// src/lib/utils/issueRules.js

export function getIssueFlags(records, issueRules = []) {
  return records.map((record) => {
    const hasIssue = issueRules.some((rule) => rule.condition(record));
    record.hasIssue = hasIssue;
    return record;
  });
}

// Count how many records meet any issue condition
export function getIssueCounts(records, issueRules = []) {
  return records.filter((record) =>
    issueRules.some((rule) => rule.condition(record))
  );
}
