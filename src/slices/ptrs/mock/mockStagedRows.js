import { parseStageRow } from "./parseStageRow";
import { rawData } from "./data-1775787908890.js";

export const loadMockStagedRows = async () => {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    throw new Error("Mock staged rows data file was empty or invalid");
  }

  const rows = rawData.map(parseStageRow).filter(Boolean);

  if (rows.length === 0) {
    throw new Error("Mock staged rows loaded but no rows could be parsed");
  }

  return rows;
};
