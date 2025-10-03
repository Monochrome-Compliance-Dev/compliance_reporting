import { useEffect } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router";
import { STEPS } from "./steps";
import { useStepStatuses } from "./hooks/useStepStatuses";

export default function GuardedRoutePtrs({ id }) {
  const [params] = useSearchParams();
  const runId = params.get("runId") || null;
  const navigate = useNavigate();
  const { gates } = useStepStatuses(runId);

  useEffect(() => {
    const order = STEPS.map((s) => s.id);
    const idx = order.indexOf(id);
    for (let i = 0; i < idx; i++) {
      if (!gates[order[i]]) {
        navigate(`/v2/ptrs/${order[i]}${runId ? `?runId=${runId}` : ""}`, {
          replace: true,
        });
        return;
      }
    }
  }, [id, gates, navigate, runId]);

  return <Outlet />;
}
