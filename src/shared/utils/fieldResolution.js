const getOptionValue = (option) => {
  if (option == null) return "";
  if (typeof option === "string") return option;
  if (typeof option === "object") {
    return String(
      option.value ?? option.header ?? option.field ?? option.label ?? "",
    ).trim();
  }
  return String(option).trim();
};

export const normaliseFieldName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const resolveFieldOption = (options, value) => {
  if (!value) return null;

  const raw = String(value).trim();
  const norm = normaliseFieldName(raw);
  const safeOptions = Array.isArray(options) ? options : [];

  const exact = safeOptions.find((opt) => getOptionValue(opt) === raw);
  if (exact) return getOptionValue(exact);

  const fuzzy = safeOptions.find(
    (opt) => normaliseFieldName(getOptionValue(opt)) === norm,
  );
  if (fuzzy) return getOptionValue(fuzzy);

  return raw;
};

export const safeSelectValue = (options, value) => {
  const resolved = resolveFieldOption(options, value);
  return resolved || "";
};
