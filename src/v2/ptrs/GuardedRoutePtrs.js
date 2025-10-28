import { useEffect } from "react";
import {
  Outlet,
  useNavigate,
  useSearchParams,
  useOutletContext,
} from "react-router";
import { STEPS } from "./steps";
import { useStepStatuses } from "./hooks/useStepStatuses";

export default function GuardedRoutePtrs({ id }) {
  const [params] = useSearchParams();
  const runId = params.get("runId") || null;
  const navigate = useNavigate();
  const { gates } = useStepStatuses(runId, id);
  const parentCtx = useOutletContext();

  useEffect(() => {
    // Compute the ordered step list and the index of the current step
    const order = STEPS.map((s) => s.id);
    const idx = order.indexOf(id);

    // Debug: what did we get and in what order will we check?
    // console.groupCollapsed(`[GuardedRoutePtrs] step="%s" render`, id);
    // console.log("runId:", runId);
    // console.log("gates:", gates);
    // console.log("order:", order);
    // console.log("currentIndex:", idx);
    // console.groupEnd();

    // If we already have a runId, treat the "create" gate as satisfied.
    const derivedGates = {
      ...gates,
      create: Boolean(runId) || Boolean(gates?.create),
    };

    // Enforce prerequisite gates only for steps before the current one
    for (let i = 0; i < idx; i++) {
      const prereq = order[i];
      if (!derivedGates[prereq]) {
        const target = `/v2/ptrs/${prereq}${runId ? `?runId=${runId}` : ""}`;
        console.warn(
          `[GuardedRoutePtrs] redirecting -> %s (gate "%s" not satisfied)`,
          target,
          prereq
        );
        navigate(target, { replace: true });
        return;
      }
    }
  }, [id, gates, navigate, runId]);

  return <Outlet context={parentCtx} />;
}
