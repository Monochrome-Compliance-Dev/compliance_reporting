import { useState } from "react";

export default function useRulesState(initialRules = []) {
  const [rules, setRules] = useState(initialRules);
  const [isSaving, setIsSaving] = useState(false);

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: "",
        description: "",
        enabled: true,
        type: "row",
        when: [],
        target: {},
        action: {},
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
    addRule,
    updateRule,
    removeRule,
    saveRules,
    isSaving,
  };
}
