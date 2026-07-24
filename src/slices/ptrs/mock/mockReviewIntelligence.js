import { getMockLearnedAdjustment } from "./mockReviewLearningStore";

const knownGroupEntities = [
  {
    name: "Veolia Water Technologies 2 Pty Ltd",
    abn: "30616561829",
  },
  {
    name: "Veolia Environmental Services (Australia) Pty Ltd",
    abn: "20051316584",
  },
  {
    name: "Veolia Water Utilities Pty Ltd",
    abn: "71072158108",
  },
  {
    name: "Veolia Energy Technical Services",
    abn: "46064584587",
  },
];

const transferKeywords = [
  "intercompany",
  "recharge",
  "transfer",
  "settlement",
  "sweep",
  "journal",
  "cash movement",
];

const LEARNED_OVERRIDE_MIN_ADJUSTMENT = 20;
const LEARNED_OVERRIDE_MIN_BIAS_GAP = 10;

function normaliseAbn(value) {
  return String(value || "").replace(/\D/g, "");
}

function normaliseText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function includesKnownEntityName(text) {
  const normalised = normaliseText(text);
  if (!normalised) return false;

  return knownGroupEntities.some((entity) => {
    const entityName = normaliseText(entity.name);
    return (
      normalised.includes(entityName) ||
      entityName.includes(normalised) ||
      normalised.includes("veolia")
    );
  });
}

function hasTransferKeyword(text) {
  const normalised = normaliseText(text);
  if (!normalised) return false;

  return transferKeywords.some((keyword) => normalised.includes(keyword));
}

function scoreRow(row) {
  const flags = [];
  let score = 0;

  const payerAbn = normaliseAbn(
    row.payer_entity_abn || row["entitystructure__ABN"],
  );
  const payeeAbn = normaliseAbn(row.payee_entity_abn || row["ABN /Tax number"]);
  const payerName =
    row.payer_entity_name || row["entitystructure__Company Code Name"] || "";
  const payeeName = row.payee_entity_name || row["Name 1"] || "";
  const reference = row.Reference || row.description || "";
  const documentType = row["Document Type"] || "";

  const groupAbns = new Set(
    knownGroupEntities.map((entity) => normaliseAbn(entity.abn)),
  );

  if (payeeAbn && groupAbns.has(payeeAbn)) {
    score += 100;
    flags.push("abn_match_group_entity");
  }

  if (payeeAbn && payerAbn && payeeAbn === payerAbn) {
    score += 120;
    flags.push("payee_matches_payer_abn");
  }

  if (!payeeAbn && includesKnownEntityName(payeeName)) {
    score += 60;
    flags.push("name_match_without_abn");
  }

  if (includesKnownEntityName(payeeName)) {
    score += 40;
    flags.push("payee_name_looks_internal");
  }

  if (includesKnownEntityName(reference)) {
    score += 20;
    flags.push("reference_mentions_group_entity");
  }

  if (hasTransferKeyword(reference)) {
    score += 30;
    flags.push("reference_transfer_keyword");
  }

  if (
    normaliseText(payeeName) &&
    normaliseText(payerName) &&
    (normaliseText(payeeName).includes(normaliseText(payerName)) ||
      normaliseText(payerName).includes(normaliseText(payeeName)))
  ) {
    score += 40;
    flags.push("payer_payee_name_similarity");
  }

  if (["SA", "AB", "JV"].includes(String(documentType || "").toUpperCase())) {
    score += 20;
    flags.push("doc_type_internal_like");
  }

  let suggestedCategory = "unknown";

  const hasIntraGroupSignal =
    flags.includes("abn_match_group_entity") ||
    flags.includes("payee_matches_payer_abn") ||
    flags.includes("name_match_without_abn") ||
    flags.includes("payee_name_looks_internal");

  const hasTransferSignal =
    flags.includes("reference_transfer_keyword") ||
    flags.includes("doc_type_internal_like");

  if (hasIntraGroupSignal) {
    suggestedCategory = "intra_group";
  } else if (hasTransferSignal) {
    suggestedCategory = "transfer";
  }

  const learned = getMockLearnedAdjustment(row);
  const isReviewed = row.__reviewStatus === "reviewed";
  const existingReviewedScore = Number(row.__reviewScore);
  const existingReviewedFlags = Array.isArray(row.__reviewFlags)
    ? row.__reviewFlags
    : [];
  const existingReviewedSuggestedCategory = String(
    row.__suggestedCategory || "",
  );

  const learnedBias = learned.categoryBias || {
    intra_group: 0,
    transfer: 0,
    normal: 0,
  };

  const sortedBiasEntries = Object.entries(learnedBias).sort(
    (a, b) => b[1] - a[1],
  );
  const topBiasValue = sortedBiasEntries[0]?.[1] || 0;
  const secondBiasValue = sortedBiasEntries[1]?.[1] || 0;
  const biasGap = topBiasValue - secondBiasValue;

  const learnedOverrideAllowed =
    !isReviewed &&
    learned.suggestedCategory !== "unknown" &&
    (learned.adjustment || 0) >= LEARNED_OVERRIDE_MIN_ADJUSTMENT &&
    biasGap >= LEARNED_OVERRIDE_MIN_BIAS_GAP;

  const learnedFlags = isReviewed
    ? []
    : (learned.matchedSources || []).map((source) => `learned_${source}`);

  const computedSuggestedCategory = learnedOverrideAllowed
    ? learned.suggestedCategory
    : suggestedCategory;

  const finalSuggestedCategory =
    isReviewed && existingReviewedSuggestedCategory
      ? existingReviewedSuggestedCategory
      : computedSuggestedCategory;

  const finalScore =
    isReviewed && Number.isFinite(existingReviewedScore)
      ? existingReviewedScore
      : score + (learned.adjustment || 0);

  const finalFlags = isReviewed
    ? existingReviewedFlags.length
      ? existingReviewedFlags
      : flags
    : [...flags, ...learnedFlags];

  return {
    score: finalScore,
    flags: finalFlags,
    suggestedCategory: finalSuggestedCategory,
    learnedAdjustment: learned.adjustment || 0,
    learnedCategoryBias: learnedBias,
    matchedLearningSources: learned.matchedSources || [],
    learnedOverrideAllowed,
    learnedBiasGap: biasGap,
  };
}

export function enrichRowsWithReviewSignals(rows) {
  return rows.map((row) => {
    const result = scoreRow(row);

    return {
      ...row,
      __reviewScore: result.score,
      __reviewFlags: result.flags,
      __reviewFlagsLabel: result.flags.join(", "),
      __suggestedCategory: result.suggestedCategory,
      __learnedAdjustment: result.learnedAdjustment,
      __learnedCategoryBias: result.learnedCategoryBias,
      __matchedLearningSources: result.matchedLearningSources,
      __learnedOverrideAllowed: result.learnedOverrideAllowed,
      __learnedBiasGap: result.learnedBiasGap,
    };
  });
}
