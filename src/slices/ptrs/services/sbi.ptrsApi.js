// PTRS SBI service — aligned to /api/v2/ptrs endpoints
// This client NORMALISES all responses so the FE never has to peel envelopes.
// All methods return plain objects. .js only.

import { fetchWrapper } from "shared/utils";
import { pickData } from "./ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

export const getSbiStatus = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/sbi/status`,
  );

  const d = pickData(res);
  const data = d?.data || d || {};
  const latest = data?.latestUpload || null;

  return {
    ptrsId: data?.ptrsId || ptrsId,
    latestUpload: latest
      ? {
          id: latest.id,
          status: latest.status || "unknown",
          fileName: latest.fileName || null,
          fileHash: latest.fileHash || null,
          rawRowCount:
            typeof latest.rawRowCount === "number" ? latest.rawRowCount : null,
          parsedAbnCount:
            typeof latest.parsedAbnCount === "number"
              ? latest.parsedAbnCount
              : null,
          summary: latest.summary || null,
          createdAt: latest.createdAt || null,
        }
      : null,
  };
};

export const importSbiResults = async (ptrsId, file) => {
  if (!ptrsId) throw new Error("ptrsId is required");
  if (!file) throw new Error("file is required");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetchWrapper.postUpload(
    `${API_ROOT}/v2/ptrs/${ptrsId}/sbi/import`,
    formData,
  );

  const d = pickData(res);
  const data = d?.data || d || {};

  return {
    status: data.status || "unknown",
    ptrsId: data.ptrsId || ptrsId,
    sbiUploadId: data.sbiUploadId || null,
    counts: data.counts || {},
    summary: data.summary || null,
  };
};

export const exportSbiAbnCsv = async (ptrsId) => {
  if (!ptrsId) throw new Error("ptrsId is required");

  const res = await fetchWrapper.get(
    `${API_ROOT}/v2/ptrs/${ptrsId}/sbi/export`,
  );

  // fetchWrapper.get returns parsed JSON if ct is json, otherwise returns raw text.
  // Our export endpoint is `text/csv`, so this should be the CSV string.
  if (typeof res !== "string") {
    // Defensive: if the backend ever wraps this, try to peel it
    const d = pickData(res);
    return d?.data || d || "";
  }

  return res;
};
