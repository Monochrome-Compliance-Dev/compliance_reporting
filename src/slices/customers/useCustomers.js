// Centralised customer queries & mutations.
// Patterned after PTRS usePtrsQueries: define stable keys and expose thin hooks.

import { useMutation, useQuery } from "@tanstack/react-query";
import { useAlert } from "../../context";
import { customersApi } from "./customersApi";
import { customersTraffic } from "./customersTrafficController";

// ---- Keys --------------------------------------------------------------------
const K = {
  all: ["customers", "all"],
  byAccess: ["customers", "byAccess"],
  byId: (customerId) => ["customers", "byId", customerId],
};

// ---- Queries -----------------------------------------------------------------
// Boss/global list
export function useCustomersQuery({ enabled = true } = {}) {
  return useQuery({
    queryKey: K.all,
    queryFn: async () => customersApi.getAll(),
    enabled,
    staleTime: 10_000,
  });
}

// List limited to what the current user can access (useful for scoped admins and selectors)
export function useCustomersByAccessQuery({ enabled = true } = {}) {
  return useQuery({
    queryKey: K.byAccess,
    queryFn: async () => customersApi.getCustomersByAccess(),
    enabled,
    staleTime: 10_000,
  });
}

export function useCustomerQuery(customerId, { enabled = true } = {}) {
  const isEnabled = enabled && !!customerId;

  return useQuery({
    queryKey: K.byId(customerId),
    queryFn: async () => customersApi.getById(customerId),
    enabled: isEnabled,
    staleTime: 10_000,
  });
}

// ---- Mutations ---------------------------------------------------------------
export function useCreateCustomerMutation() {
  const { showAlert } = useAlert();

  return useMutation({
    mutationFn: (payload) => customersApi.create(payload),
    onSuccess: (created) => {
      customersTraffic.emit(created?.id, { reason: "customer_created" });
      showAlert("Customer created", "success");
    },
    onError: (err) => {
      const message = err?.message || "Failed to create customer";
      showAlert(message, "error");
    },
  });
}

export function useUpdateCustomerMutation(customerId) {
  const { showAlert } = useAlert();

  return useMutation({
    mutationFn: (payload) => customersApi.update(customerId, payload),
    onSuccess: () => {
      customersTraffic.emit(customerId, { reason: "customer_updated" });
      showAlert("Customer updated", "success");
    },
    onError: (err) => {
      const message = err?.message || "Failed to update customer";
      showAlert(message, "error");
    },
  });
}

// ---- Convenience summary helpers --------------------------------------------
export function useCustomersSummary({ enabled = true } = {}) {
  const q = useCustomersQuery({ enabled });

  if (!enabled) return { status: "idle", data: [], error: null, refetch: null };
  if (q.isLoading)
    return { status: "loading", data: [], error: null, refetch: q.refetch };
  if (q.isError)
    return {
      status: "error",
      data: [],
      error: q.error?.message || "Failed to load customers",
      refetch: q.refetch,
    };

  return {
    status: "success",
    data: q.data || [],
    error: null,
    refetch: q.refetch,
  };
}

export function useCustomersByAccessSummary({ enabled = true } = {}) {
  const q = useCustomersByAccessQuery({ enabled });

  if (!enabled) return { status: "idle", data: [], error: null, refetch: null };
  if (q.isLoading)
    return { status: "loading", data: [], error: null, refetch: q.refetch };
  if (q.isError)
    return {
      status: "error",
      data: [],
      error: q.error?.message || "Failed to load accessible customers",
      refetch: q.refetch,
    };

  return {
    status: "success",
    data: q.data || [],
    error: null,
    refetch: q.refetch,
  };
}

export { K as customersQueryKeys };
