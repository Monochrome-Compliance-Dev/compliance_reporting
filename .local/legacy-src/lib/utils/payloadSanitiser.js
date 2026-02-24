import { formatDateForSQL } from "./formatters";
import { sanitiseInput } from "./sanitiseInput";
import _ from "lodash";

export function payloadSanitiser(payload = {}, fieldConfig = []) {
  const result = {};

  for (const [key, value] of Object.entries(payload)) {
    const config = fieldConfig.find((f) => f.key === key);

    if (!config) {
      result[key] = value;
      continue;
    }

    // Apply override first if present
    if (typeof config.formatOverride === "function") {
      result[key] = config.formatOverride(value);
      continue;
    }

    switch (config.inputType) {
      case "text": {
        const trimmed = value?.toString().trim();
        result[key] = trimmed ? sanitiseInput(trimmed) : null;
        break;
      }
      case "date": {
        result[key] = value ? formatDateForSQL(value) : null;
        break;
      }
      case "checkbox": {
        result[key] = Boolean(value);
        break;
      }
      default: {
        result[key] = value;
      }
    }
  }

  return result;
}

export function diffObjects(a, b) {
  const result = {};
  for (const key in a) {
    if (!_.isEqual(a[key], b[key])) {
      result[key] = a[key];
    }
  }
  return result;
}
