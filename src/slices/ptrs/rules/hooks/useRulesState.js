import { useState, useCallback } from "react";

export default function useRulesState(initialRules = []) {
  const [rules, setRules] = useState(initialRules);
  const [isSaving, setIsSaving] = useState(false);

  const resetRules = useCallback((nextRules) => {
    setRules(Array.isArray(nextRules) ? nextRules : []);
  }, []);

  const addRule = useCallback(() => {
    setRules((prev) => [
      ...prev,
      {
        cid: crypto.randomUUID(),
        id: undefined,
        label: "",
        description: "",
        enabled: true,
        type: "row",
        when: [],
        target: { match: [], where: [] },
        action: {
          op: "add",
          field: "",
          valueFieldFromCurrent: "",
          round: 2,
        },
      },
    ]);
  }, []);

  const updateRule = useCallback((index, patch) => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }, []);

  const removeRule = useCallback((index) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const saveRules = useCallback(
    async (saveFn) => {
      setIsSaving(true);
      try {
        await saveFn(rules);
      } finally {
        setIsSaving(false);
      }
    },
    [rules],
  );

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
