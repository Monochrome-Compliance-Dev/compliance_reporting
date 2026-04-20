const feedbackEvents = [];

function normaliseAbn(value) {
  return String(value || "").replace(/\D/g, "");
}

function normaliseText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function buildReferenceKey(row) {
  const reference = normaliseText(row.Reference || row.description || "");
  return reference || "__blank_reference__";
}

function buildDocumentTypeKey(row) {
  return (
    String(row["Document Type"] || "")
      .trim()
      .toUpperCase() || "__blank_doc_type__"
  );
}

function buildAccountKey(row) {
  return (
    String(row.Account || row["Account"] || "").trim() || "__blank_account__"
  );
}

function buildEntityKey(row) {
  const abn = normaliseAbn(row.payee_entity_abn || row["ABN /Tax number"]);
  if (abn) return abn;

  const name = normaliseText(row.payee_entity_name || row["Name 1"] || "");
  return name || "__unknown_entity__";
}

function buildOutcomeBucket(finalCategory, accepted) {
  if (accepted) {
    if (finalCategory === "intra_group") return "accepted_intra_group";
    if (finalCategory === "transfer") return "accepted_transfer";
    return "accepted_normal";
  }

  if (finalCategory === "intra_group") return "reclassified_intra_group";
  if (finalCategory === "transfer") return "reclassified_transfer";
  return "rejected_to_normal";
}

function createEmptyAggregate(type, key) {
  return {
    type,
    key,
    totalCount: 0,
    accepted_intra_group: 0,
    accepted_transfer: 0,
    accepted_normal: 0,
    reclassified_intra_group: 0,
    reclassified_transfer: 0,
    rejected_to_normal: 0,
    reasonCounts: {},
    lastUpdatedAt: null,
  };
}

function accumulateAggregate(aggregate, bucket, createdAt, reasonCodes = []) {
  const next = {
    ...aggregate,
    totalCount: aggregate.totalCount + 1,
    lastUpdatedAt: createdAt,
    reasonCounts: {
      ...(aggregate.reasonCounts || {}),
    },
  };

  next[bucket] = (next[bucket] || 0) + 1;

  reasonCodes.forEach((code) => {
    if (!code) return;
    next.reasonCounts[code] = (next.reasonCounts[code] || 0) + 1;
  });

  return next;
}

function aggregateEvents(events, getKey, type) {
  return events.reduce((acc, event) => {
    const key = getKey(event.row);
    const bucket = buildOutcomeBucket(event.finalCategory, event.accepted);
    const current = acc[key] || createEmptyAggregate(type, key);

    acc[key] = accumulateAggregate(
      current,
      bucket,
      event.createdAt,
      event.reasonCodes || [],
    );

    return acc;
  }, {});
}

function scoreAggregateBias(aggregate) {
  const reasonCounts = aggregate.reasonCounts || {};

  let intraGroupBias =
    aggregate.accepted_intra_group * 5 + aggregate.reclassified_intra_group * 4;

  let transferBias =
    aggregate.accepted_transfer * 5 + aggregate.reclassified_transfer * 4;

  let normalBias =
    aggregate.accepted_normal * 4 + aggregate.rejected_to_normal * 4;

  if ((aggregate.rejected_to_normal || 0) > 0) {
    intraGroupBias = Math.max(
      0,
      intraGroupBias - aggregate.rejected_to_normal * 24,
    );
    transferBias = Math.max(
      0,
      transferBias - aggregate.rejected_to_normal * 16,
    );
    normalBias += aggregate.rejected_to_normal * 16;
  }

  if ((aggregate.reclassified_transfer || 0) > 0) {
    intraGroupBias = Math.max(
      0,
      intraGroupBias - aggregate.reclassified_transfer * 20,
    );
    transferBias += aggregate.reclassified_transfer * 12;
  }

  if ((aggregate.reclassified_intra_group || 0) > 0) {
    transferBias = Math.max(
      0,
      transferBias - aggregate.reclassified_intra_group * 20,
    );
    intraGroupBias += aggregate.reclassified_intra_group * 12;
  }

  if (aggregate.type === "account") {
    if ((reasonCounts.account_not_internal || 0) > 0) {
      intraGroupBias = 0;
    }
  }

  if (aggregate.type === "entity") {
    if (
      (reasonCounts.abn_match_misleading || 0) > 0 ||
      (reasonCounts.supplier_external || 0) > 0
    ) {
      intraGroupBias = 0;
    }
  }

  if (aggregate.type === "reference") {
    if ((reasonCounts.reference_misleading || 0) > 0) {
      intraGroupBias = 0;
      transferBias = 0;
    }
  }

  if (aggregate.type === "document_type") {
    if ((reasonCounts.document_type_misleading || 0) > 0) {
      intraGroupBias = 0;
      transferBias = 0;
    }
  }

  if ((reasonCounts.grouping_wrong || 0) > 0) {
    intraGroupBias = Math.floor(intraGroupBias * 0.25);
    transferBias = Math.floor(transferBias * 0.25);
  }

  if ((reasonCounts.payment_terms_misleading || 0) > 0) {
    intraGroupBias = Math.floor(intraGroupBias * 0.5);
  }

  if ((reasonCounts.should_be_transfer || 0) > 0) {
    intraGroupBias = 0;
    transferBias += reasonCounts.should_be_transfer * 20;
    normalBias = Math.max(0, normalBias - reasonCounts.should_be_transfer * 6);
  }

  if ((reasonCounts.should_be_normal || 0) > 0) {
    intraGroupBias = 0;
    transferBias = 0;
    normalBias += reasonCounts.should_be_normal * 20;
  }

  if ((reasonCounts.credit_adjustment || 0) > 0) {
    intraGroupBias = Math.max(
      0,
      intraGroupBias - reasonCounts.credit_adjustment * 10,
    );
    transferBias = Math.max(
      0,
      transferBias - reasonCounts.credit_adjustment * 8,
    );
    normalBias += reasonCounts.credit_adjustment * 10;
  }

  return {
    intra_group: intraGroupBias,
    transfer: transferBias,
    normal: normalBias,
  };
}

export function resetMockReviewLearningStore() {
  feedbackEvents.splice(0, feedbackEvents.length);
}

export function getMockReviewFeedbackEvents() {
  return [...feedbackEvents];
}

export function recordMockReviewFeedback({
  rows,
  accepted,
  suggestedCategory,
  finalCategory,
  reasonCode = "",
  reasonCodes = [],
  note = "",
  source = "manual",
}) {
  const inputRows = Array.isArray(rows) ? rows : [rows];
  const validRows = inputRows.filter(Boolean);

  const createdAt = new Date().toISOString();

  const newEvents = validRows.map((row) => ({
    id: `${row.__mockId || row["Document Number"] || "row"}-${createdAt}`,
    rowId: row.__mockId || "",
    suggestedCategory: String(
      suggestedCategory || row.__suggestedCategory || "unknown",
    ),
    finalCategory: String(finalCategory || "normal"),
    accepted: Boolean(accepted),
    reasonCode: String(reasonCode || ""),
    reasonCodes: Array.isArray(reasonCodes)
      ? reasonCodes.filter(Boolean).map((value) => String(value))
      : [],
    note: String(note || ""),
    source,
    createdAt,
    row: {
      __mockId: row.__mockId,
      payee_entity_abn: row.payee_entity_abn || row["ABN /Tax number"] || "",
      payee_entity_name: row.payee_entity_name || row["Name 1"] || "",
      payer_entity_abn:
        row.payer_entity_abn || row["entitystructure__ABN"] || "",
      payer_entity_name:
        row.payer_entity_name ||
        row["entitystructure__Company Code Name"] ||
        "",
      Account: row.Account || row["Account"] || "",
      Reference: row.Reference || row.description || "",
      "Document Type": row["Document Type"] || "",
      "Payment terms": row["Payment terms"] || "",
      payment_amount: row.payment_amount || "",
      payment_time_days: row.payment_time_days || 0,
    },
  }));

  feedbackEvents.push(...newEvents);

  return newEvents;
}

export function getMockLearningSummary() {
  const byEntity = aggregateEvents(feedbackEvents, buildEntityKey, "entity");
  const byReference = aggregateEvents(
    feedbackEvents,
    buildReferenceKey,
    "reference",
  );
  const byDocumentType = aggregateEvents(
    feedbackEvents,
    buildDocumentTypeKey,
    "document_type",
  );
  const byAccount = aggregateEvents(feedbackEvents, buildAccountKey, "account");

  return {
    totals: {
      feedbackEventCount: feedbackEvents.length,
      entityPatternCount: Object.keys(byEntity).length,
      referencePatternCount: Object.keys(byReference).length,
      documentTypePatternCount: Object.keys(byDocumentType).length,
      accountPatternCount: Object.keys(byAccount).length,
    },
    byEntity,
    byReference,
    byDocumentType,
    byAccount,
  };
}

export function getMockLearnedAdjustment(row) {
  const summary = getMockLearningSummary();

  const entityAggregate = summary.byEntity[buildEntityKey(row)];
  const referenceAggregate = summary.byReference[buildReferenceKey(row)];
  const documentTypeAggregate =
    summary.byDocumentType[buildDocumentTypeKey(row)];
  const accountAggregate = summary.byAccount[buildAccountKey(row)];

  const categoryBias = {
    intra_group: 0,
    transfer: 0,
    normal: 0,
  };

  const matchedSources = [];

  [
    { name: "account", aggregate: accountAggregate },
    { name: "entity", aggregate: entityAggregate },
    { name: "reference", aggregate: referenceAggregate },
    { name: "document_type", aggregate: documentTypeAggregate },
  ].forEach(({ name, aggregate }) => {
    if (!aggregate) return;

    const bias = scoreAggregateBias(aggregate);
    categoryBias.intra_group += bias.intra_group;
    categoryBias.transfer += bias.transfer;
    categoryBias.normal += bias.normal;
    matchedSources.push(name);
  });

  const internalBias = Math.max(
    categoryBias.intra_group,
    categoryBias.transfer,
  );
  const adjustment = internalBias - categoryBias.normal;

  let suggestedCategory = "unknown";

  if (
    categoryBias.intra_group > categoryBias.transfer &&
    categoryBias.intra_group > categoryBias.normal
  ) {
    suggestedCategory = "intra_group";
  } else if (
    categoryBias.transfer > categoryBias.intra_group &&
    categoryBias.transfer > categoryBias.normal
  ) {
    suggestedCategory = "transfer";
  } else if (categoryBias.normal > 0) {
    suggestedCategory = "normal";
  }

  return {
    adjustment,
    categoryBias,
    suggestedCategory,
    matchedSources,
  };
}
