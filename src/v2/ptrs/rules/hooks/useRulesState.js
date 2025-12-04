import { useState } from "react";

export default function useRulesState(initialRules = []) {
  const [rules, setRules] = useState(initialRules);
  const [isSaving, setIsSaving] = useState(false);

  const resetRules = (nextRules) => {
    setRules(Array.isArray(nextRules) ? nextRules : []);
  };

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        // Client-only identifier
        cid: crypto.randomUUID(),
        id: undefined,

        // Meta
        label: "",
        description: "",
        enabled: true,
        type: "row",

        // Conditions
        when: [],

        // Relationship (safe empty structure)
        target: {
          match: [],
          where: [],
        },

        // Action – IMPORTANT: give selects a valid initial value
        action: {
          op: "add", // one of: add | sub | mul | div | assign
          field: "", // '' is allowed by MUI as “no selection yet”
          valueFieldFromCurrent: "", // same
          round: 2,
        },
      },
    ]);
  };

  const updateRule = (index, patch) => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );
  };

  const removeRule = (index) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const saveRules = async (saveFn) => {
    setIsSaving(true);
    try {
      await saveFn(rules);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    rules,
    resetRules,
    addRule,
    updateRule,
    removeRule,
    saveRules,
    isSaving,
  };
}
