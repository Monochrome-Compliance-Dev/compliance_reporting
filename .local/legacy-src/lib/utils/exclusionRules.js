// src/lib/utils/exclusionRules.js

export function getExclusionFlags(records, rules) {
  return records.map((record) => {
    let isExcluded = false;

    for (const rule of rules) {
      if (rule.type === "lessThanAndCreditCard") {
        const isLessThan = Number(record.paymentAmount) < rule.terms[0];
        const isCreditCardPayment = record.creditCardPayment === true;
        if (isLessThan && isCreditCardPayment) {
          isExcluded = true;
          break;
        }
        continue;
      }

      const value = record[rule.field];
      if (typeof value === "undefined") continue;

      const valueLower =
        typeof value === "string" ? value.toLowerCase() : value;

      for (const term of rule.terms) {
        const termLower = typeof term === "string" ? term.toLowerCase() : term;
        const isExactMatch = rule.type === "exact" && valueLower === termLower;
        const isContainsMatch =
          rule.type === "contains" &&
          typeof value === "string" &&
          valueLower.includes(termLower);

        if (isExactMatch || isContainsMatch) {
          isExcluded = true;
          break;
        }
      }

      if (isExcluded) {
        break;
      }
    }

    record.hasExclusion = isExcluded;
    return record;
  });
}
