export const pulseConfig = {
  tenantModes: {
    auditFirm: {
      requiresClient: true,
      showBudgets: true,
      allowResourceBilling: true,
    },
    internalDept: {
      requiresClient: false,
      showBudgets: true,
      allowResourceBilling: false,
    },
  },
  defaults: {
    requiresClient: true,
    showBudgets: true,
  },
};

export const getPulseConfig = (tenantType = "default") => {
  return pulseConfig.tenantModes[tenantType] || pulseConfig.defaults;
};
