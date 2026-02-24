import { fieldMapping } from "./fieldMapping";

export function getFieldLabel(key, fallback = key) {
  const found = fieldMapping.find((f) => f.name === key);
  return found?.label || fallback;
}

export function isFieldRequiredAtStep(key, step) {
  const found = fieldMapping.find((f) => f.name === key);
  return !!found?.requiredAtStep?.includes(step);
}
