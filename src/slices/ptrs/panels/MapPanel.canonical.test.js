import { act } from "react";
import { createRoot } from "react-dom/client";
import MapPanel from "./MapPanel";
import { buildPtrsCanonicalRevision } from "../services/maps.ptrsApi";
import { getDatasetSample } from "../services/data.ptrsApi";

const mockGoTo = jest.fn();
const mockShowAlert = jest.fn();
const mockUpdateStep = jest.fn(async () => {});

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
}));

let container;
let root;
beforeEach(() => {
  jest.clearAllMocks();
  getDatasetSample.mockResolvedValue({ rows: [], headers: [] });
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
