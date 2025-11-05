import { useEffect, useRef } from "react";
import {
  Outlet,
  useNavigate,
  useSearchParams,
  useOutletContext,
} from "react-router";
import { STEPS } from "./steps";
import { useStepStatuses } from "./hooks/useStepStatuses";
import { usePtrsV2Context } from "./context/PtrsV2Context";

export default function GuardedRoutePtrs({ id }) {
  const [params] = useSearchParams();
  const paramRunId = params.get("runId") || null;

  const navigate = useNavigate();
  const parentCtx = useOutletContext();

  const { runId: ctxRunId } = usePtrsV2Context();
  const runId = paramRunId || ctxRunId || null;

  const { gates } = useStepStatuses(runId, id);

  const lastRedirectRef = useRef(null);
  const lastGatesRef = useRef(null);

  useEffect(() => {
    // Prevent infinite loops from trivial object identity changes
    const gatesString = JSON.stringify(gates);
    if (lastGatesRef.current === gatesString) return;
    lastGatesRef.current = gatesString;

    const order = STEPS.map((s) => s.id);
    const idx = order.indexOf(id);

    // Debug
    console.groupCollapsed(`[GuardedRoutePtrs] step="${id}"`);
    console.log("runId:", runId);
    console.log("gates:", gates);
    console.log("order:", order);
    console.log("currentIndex:", idx);
    console.groupEnd();

    // Skip redirect logic for landing route
    if (id === "landing") return;

    const derivedGates = {
      ...gates,
      create: Boolean(runId) || Boolean(gates?.create),
    };

    // find missing prereq
    let firstMissing = null;
    for (let i = 0; i < idx; i++) {
      const prereq = order[i];
      if (!derivedGates[prereq]) {
        firstMissing = prereq;
        break;
      }
    }

    if (firstMissing) {
      const target = `/v2/ptrs/${firstMissing}${runId ? `?runId=${runId}` : ""}`;
      if (lastRedirectRef.current !== target) {
        console.warn(`[GuardedRoutePtrs] redirecting -> ${target}`);
        lastRedirectRef.current = target;
        navigate(target, { replace: true });
      }
      return;
    }

    if (id === "create" && runId) {
      const next = "data";
      const target = `/v2/ptrs/${next}?runId=${runId}`;
      if (lastRedirectRef.current !== target) {
        console.warn(`[GuardedRoutePtrs] advancing from create -> ${target}`);
        lastRedirectRef.current = target;
        navigate(target, { replace: true });
      }
      return;
    }

    // Reset redirect marker when settled
    lastRedirectRef.current = null;
  }, [id, navigate, runId, gates]);

  return <Outlet context={parentCtx} />;
}
