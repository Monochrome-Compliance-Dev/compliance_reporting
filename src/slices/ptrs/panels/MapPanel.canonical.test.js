import { act } from "react";
import { createRoot } from "react-dom/client";
import MapPanel, { hasCompleteDirectPaymentSettings } from "./MapPanel";
import {
  buildPtrsCanonicalRevision,
  getPtrsFieldMap,
} from "../services/maps.ptrsApi";
import { getDatasetSample } from "../services/data.ptrsApi";

const mockGoTo = jest.fn();
const mockShowAlert = jest.fn();
const mockUpdateStep = jest.fn(async () => {});
const mockGetReadiness = jest.fn(() => ({ ready: true }));

jest.mock("react-router", () => ({
  useSearchParams: () => [new URLSearchParams("ptrsId=ptrs000001")],
}));
jest.mock("context", () => ({
  useAlert: () => ({ showAlert: mockShowAlert }),
}));
jest.mock("../context/PtrsContext", () => ({
  usePtrsContext: () => ({ profileId: "profile001" }),
}));
jest.mock("../hooks/usePtrsNavigation", () => ({
  usePtrsNavigation: () => ({ goTo: mockGoTo }),
}));
jest.mock("./SupportingDatasetsSection", () => () => null);
jest.mock("shared/ui", () => ({ LoadingSpinner: () => null }));
jest.mock("../services/ingestConfig", () => ({
  getFieldLabel: (field) => field,
}));
jest.mock("../ingestConfig", () => {
  const requirements = { requiredFields: [], requiredFieldGroups: [] };
  return {
    PTRS_REQUIRED_FIELDS: [],
    PTRS_OPTIONAL_FIELDS: [],
    PTRS_FIELD_LABELS: {},
    FIELD_SYNONYMS: {},
    getPtrsAdapterLabel: () => "Test adapter",
    getPtrsAdapterMappingRequirements: () => requirements,
    getPtrsDatasetMappingReadiness: (...args) => mockGetReadiness(...args),
    getReachablePtrsDatasetIds: (datasets, _joins, selectedId) =>
      new Set(
        datasets
          .filter(
            (dataset) =>
              dataset.id === selectedId || dataset.purpose !== "transaction",
          )
          .map((dataset) => dataset.id),
      ),
  };
});
jest.mock("../hooks/usePtrsQueries", () => {
  const datasets = {
    data: {
      items: [
        {
          id: "dataset001",
          purpose: "transaction",
          role: "transaction",
          fileName: "First.csv",
        },
        {
          id: "dataset002",
          purpose: "transaction",
          role: "transaction",
          fileName: "Second.csv",
        },
      ],
    },
  };
  const empty = { data: null };
  const fieldMap = { data: [] };
  return {
    useUpdatePtrsMutation: () => ({ mutateAsync: mockUpdateStep }),
    usePtrsDatasetsQuery: () => datasets,
    usePtrsMapQuery: () => empty,
    usePtrsBlueprintQuery: () => empty,
    usePtrsFieldMapQuery: () => fieldMap,
  };
});
jest.mock("../services/data.ptrsApi", () => ({
  getDatasetSample: jest.fn(async () => ({ rows: [], headers: [] })),
}));
jest.mock("../services/maps.ptrsApi", () => ({
  buildPtrsCanonicalRevision: jest.fn(),
  importPtrsFieldMap: jest.fn(),
  listPtrsWithMap: jest.fn(),
  savePtrsMap: jest.fn(),
  savePtrsFieldMap: jest.fn(),
  getPtrsFieldMap: jest.fn(async () => []),
}));

let container;
let root;
beforeEach(() => {
  jest.clearAllMocks();
  getDatasetSample.mockResolvedValue({ rows: [], headers: [] });
  getPtrsFieldMap.mockResolvedValue([]);
  mockGetReadiness.mockReturnValue({ ready: true });
  mockUpdateStep.mockResolvedValue({});
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
async function mountMap() {
  // ReactDOM's native renderer needs act; this is not Testing Library render.
  const mountElement = () => root.render(<MapPanel />);
  await act(mountElement);
  return Array.from(container.querySelectorAll("button")).find((button) =>
    button.textContent.includes("Next: Stage data"),
  );
}
afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

test.each([
  ["missing snapshot", { dateFormat: "MDY", reportingEntity: null }],
  [
    "missing entity name",
    { dateFormat: "MDY", reportingEntity: { abn: "40115288492" } },
  ],
  [
    "missing supplied ABN",
    {
      dateFormat: "MDY",
      reportingEntity: { entityName: "Supplied Entity", abn: "  " },
    },
  ],
  [
    "invalid date convention",
    {
      dateFormat: "guess",
      reportingEntity: { entityName: "Entity", abn: "43 111 372 064" },
    },
  ],
])("rejects direct-payment settings with %s", (_label, dataset) => {
  expect(hasCompleteDirectPaymentSettings(dataset)).toBe(false);
});

test.each(["1234", "not-an-abn", "12345678901"])(
  "accepts supplied invalid ABN %s for downstream validation",
  (abn) => {
    expect(
      hasCompleteDirectPaymentSettings({
        dateFormat: "MDY",
        reportingEntity: { entityName: "Supplied Entity", abn },
      }),
    ).toBe(true);
  },
);

test.each(["ISO", "MDY", "DMY"])(
  "accepts complete direct-payment settings using %s",
  (dateFormat) => {
    expect(
      hasCompleteDirectPaymentSettings({
        dateFormat,
        reportingEntity: {
          entityName: "ENVIROPACIFIC SERVICES LIMITED",
          abn: "43 111 372 064",
        },
      }),
    ).toBe(true);
  },
);

test("builds sequentially, guards repeat clicks and navigates only after both canonical revisions succeed", async () => {
  const button = await mountMap();
  let completeFirst;
  let completeSecond;
  buildPtrsCanonicalRevision
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          completeFirst = resolve;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          completeSecond = resolve;
        }),
    );
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(buildPtrsCanonicalRevision).toHaveBeenCalledTimes(1);
  expect(mockGoTo).not.toHaveBeenCalled();
  await act(async () => {
    completeFirst({ ready: true });
  });
  expect(buildPtrsCanonicalRevision).toHaveBeenCalledTimes(2);
  expect(
    buildPtrsCanonicalRevision.mock.calls.map(
      ([, options]) => options.datasetId,
    ),
  ).toEqual(["dataset001", "dataset002"]);
  expect(mockUpdateStep).not.toHaveBeenCalled();
  expect(mockGoTo).not.toHaveBeenCalled();
  await act(async () => {
    completeSecond({ ready: true });
  });
  expect(mockUpdateStep).toHaveBeenCalledWith({ currentStep: "stage" });
  expect(mockGoTo).toHaveBeenCalledWith(
    "stage?ptrsId=ptrs000001&profileId=profile001&autoRunStage=true",
    { includeId: false },
  );
});

test("an active build leaves Map usable without starting the next dataset or navigating", async () => {
  const button = await mountMap();
  buildPtrsCanonicalRevision.mockResolvedValue({ ready: false });
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(buildPtrsCanonicalRevision).toHaveBeenCalledTimes(1);
  expect(mockGoTo).not.toHaveBeenCalled();
  expect(mockUpdateStep).not.toHaveBeenCalled();
  expect(mockShowAlert).toHaveBeenCalledWith(
    expect.stringContaining("already in progress"),
    "info",
  );
  expect(button.disabled).toBe(false);
});

test("checks every transaction dataset independently before materialising", async () => {
  const button = await mountMap();
  mockGetReadiness
    .mockReturnValueOnce({ ready: true })
    .mockReturnValueOnce({ ready: false });

  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(
    getPtrsFieldMap.mock.calls.map(([, , datasetId]) => datasetId),
  ).toEqual(["dataset001", "dataset002"]);
  expect(buildPtrsCanonicalRevision).not.toHaveBeenCalled();
  expect(mockGoTo).not.toHaveBeenCalled();
  expect(mockShowAlert).toHaveBeenCalledWith(
    "Mapping is incomplete for: Second.csv",
    "error",
  );
});
