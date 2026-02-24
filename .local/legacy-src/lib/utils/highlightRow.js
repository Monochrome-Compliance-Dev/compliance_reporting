/**
 * Determines the background color for a table row based on its state.
 * @param {Object} record - The record object.
 * @returns {string} - The background color for the row.
 */
export function getRowHighlightColor(record) {
  if (record.isError) {
    return "rgba(255, 0, 0, 0.1)";
  }
  if (record.wasChanged) {
    // if (record.id === "_lSpo_PgVt")
    //   console.log("Record with ID _lSpo_PgVt has wasChanged set to true");
    return "rgba(255, 165, 0, 0.3)";
  }
  if (record.wasSaved) {
    // if (record.id === "_lSpo_PgVt")
    //   console.log("Record with ID _lSpo_PgVt has wasSaved set to true");
    return "rgba(0, 255, 0, 0.1)";
  }
  if (record.partialPayment) {
    return "rgba(0, 0, 255, 0.1)";
  }
  if (record.id === "_lSpo_PgVt") {
    // console.log(
    //   "Record with ID _lSpo_PgVt has no specific state, returning inherit color"
    // );
  }
  return "inherit";
}
