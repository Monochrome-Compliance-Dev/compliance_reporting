import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAlert } from "context";
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from "./customersApi";

export function useCustomers() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: listCustomers,
  });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      showAlert("Customer created successfully", "success");
    },
    onError: (error) => {
      const message = error?.message || "Failed to create customer";
      showAlert(message, "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      showAlert("Customer updated successfully", "success");
    },
    onError: (error) => {
      const message = error?.message || "Failed to update customer";
      showAlert(message, "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      showAlert("Customer deleted successfully", "success");
    },
    onError: (error) => {
      const message = error?.message || "Failed to delete customer";
      showAlert(message, "error");
    },
  });

  return {
    customersQuery,
    createCustomer: createMutation.mutate,
    updateCustomer: (id, data) => updateMutation.mutate({ id, data }),
    deleteCustomer: deleteMutation.mutate,
  };
}
