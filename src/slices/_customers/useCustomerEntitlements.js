import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlert } from "context";
import {
  getCustomerEntitlements,
  updateCustomerEntitlements,
} from "./customerEntitlementsApi";

export function useCustomerEntitlements(customerId) {
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();

  const entitlementsQuery = useQuery({
    queryKey: ["customer-entitlements", customerId],
    enabled: !!customerId,
    queryFn: () => getCustomerEntitlements(customerId),
  });

  const saveMutation = useMutation({
    mutationFn: ({ customerId, features }) =>
      updateCustomerEntitlements(customerId, features),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer-entitlements", customerId],
      });
      if (typeof showAlert === "function") {
        showAlert("Customer entitlements updated", "success");
      }
    },
    onError: (error) => {
      const message =
        error?.message || "Failed to update customer entitlements";
      if (typeof showAlert === "function") {
        showAlert(message, "error");
      }
    },
  });

  const saveEntitlements = (features) => {
    saveMutation.mutate({ customerId, features });
  };

  return {
    entitlementsQuery,
    saveEntitlements,
    isSaving: saveMutation.isLoading,
  };
}
