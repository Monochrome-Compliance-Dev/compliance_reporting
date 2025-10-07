module.exports = {
  Admin: "Admin",
  Audit: "Audit",
  Boss: "Boss",
  User: "User",

  getEditableSectionsForPosition(position) {
    switch (position) {
      case "CFO":
      case "Finance Director":
        return ["Reporting Entity"];
      case "Supply Chain GM":
      case "Procurement Manager":
        return [
          "Structure, Operations & Supply Chains",
          "Risks of Modern Slavery Practices",
          "Actions Taken",
        ];
      case "ESG Manager":
        return [
          "Assessing Effectiveness",
          "Consultation",
          "Other Relevant Information",
        ];
      default:
        return [];
    }
  },
};
