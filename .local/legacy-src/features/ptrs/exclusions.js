/**
 * PTRS Exclusions adapter
 * - Fetches BE-driven exclusions via tcpService
 * - Falls back to static defaults from stepConfigs
 * - Uses existing AlertContext via an injected showAlert function (no new components)
 */

// NOTE: keep imports light; no React import needed.
import { tcpService } from "../../services/tcp/tcp";
import { stepConfigs } from "../../config/stepConfigs";

/**
 * Get exclusion rules for a given step.
 * @param {number} step - 1..5
 * @param {Object} [opts]
 * @param {(msg: string, severity?: "success"|"info"|"warning"|"error")=>void} [opts.showAlert]
 * @returns {Promise<Array<{field:string,type:string,terms:Array<any>}>>}
 */
export async function getExclusionRules(step, opts = {}) {
  const { showAlert } = opts;
  const s = Number(step);
  const fallback = stepConfigs?.[`step${s}`]?.exclusionRules || [];

  try {
    const rules = await tcpService.getExclusionRules(s);
    if (Array.isArray(rules) && rules.length > 0) {
      return rules;
    }
    // BE returned empty — inform (soft) and fall back
    if (typeof showAlert === "function") {
      showAlert(
        "No exclusions found in TCP reference data. Using defaults for now.",
        "info"
      );
    }
    return fallback;
  } catch (err) {
    // Network or BE error — warn and fall back
    if (typeof showAlert === "function") {
      const msg = err?.message || "Unable to load exclusions from the server";
      showAlert(`${msg}. Using defaults for now.`, "warning");
    }
    return fallback;
  }
}
