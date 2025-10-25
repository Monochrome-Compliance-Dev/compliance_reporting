// v2 Data Console adapter — thin wrapper around ptrsApi dataset endpoints
// Keep UI imports tidy by centralising here.

import {
  addDataset as apiAddDataset,
  listDatasets as apiListDatasets,
  removeDataset as apiRemoveDataset,
} from "v2/ptrs/services/ptrsApi";

export const addDataset = (runId, file, opts) =>
  apiAddDataset(runId, file, opts);

export const listDatasets = (runId) => apiListDatasets(runId);

export const removeDataset = (runId, datasetId) =>
  apiRemoveDataset(runId, datasetId);
