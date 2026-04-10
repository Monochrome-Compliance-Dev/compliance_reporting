export const parseStageRow = (row) => {
  try {
    if (!row) return null;

    // Step 1: remove wrapping quotes
    let cleaned = row.trim();

    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }

    // Step 2: fix double quotes from CSV escaping
    cleaned = cleaned.replace(/""/g, '"');

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse row:", row);
    return null;
  }
};
