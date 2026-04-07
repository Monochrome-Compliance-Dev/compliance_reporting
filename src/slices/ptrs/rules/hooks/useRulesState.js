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
        groupName: "",
        enabled: true,
        type: "row",
        when: [],
        target: {
          match: [],
          where: [],
          selection: "first_match",
          requireMatch: false,
        },
        action: {
          op: "add",
          field: "",
          valueFieldFromCurrent: "",
          round: 2,
        },
      },
    ]);
  }, []);

  const updateRule = useCallback((ruleKey, patch) => {
    setRules((prev) =>
      prev.map((r) => {
        const key = r?.cid || r?.id;
        return key === ruleKey ? { ...r, ...patch } : r;
      }),
    );
  }, []);

  const removeRule = useCallback((ruleKey) => {
    setRules((prev) =>
      prev.filter((r) => {
        const key = r?.cid || r?.id;
        return key !== ruleKey;
      }),
    );
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
