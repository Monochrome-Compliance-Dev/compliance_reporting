import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlert } from "context";
import {
  createCustomerProfile,
  deleteCustomerProfile,
  getCustomerProfiles,
  updateCustomerProfile,
} from "./customerProfilesApi";

export function useCustomerProfiles(customerId) {
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();

  const profilesQuery = useQuery({
    queryKey: ["customer-profiles", customerId],
    enabled: !!customerId,
    queryFn: () => getCustomerProfiles(customerId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["customer-profiles", customerId],
    });

  const createMutation = useMutation({
    mutationFn: ({ customerId, payload }) =>
      createCustomerProfile(customerId, payload),
    onSuccess: () => {
      invalidate();
      showAlert("Profile created", "success");
    },
    onError: (error) => {
      const message = error?.message || "Failed to create profile";
      showAlert(message, "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ customerId, profileId, payload }) =>
      updateCustomerProfile(customerId, profileId, payload),
    onSuccess: () => {
      invalidate();
      showAlert("Profile updated", "success");
    },
    onError: (error) => {
      const message = error?.message || "Failed to update profile";
      showAlert(message, "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ customerId, profileId }) =>
      deleteCustomerProfile(customerId, profileId),
    onSuccess: () => {
      invalidate();
      showAlert("Profile deleted", "success");
    },
    onError: (error) => {
      const message = error?.message || "Failed to delete profile";
      showAlert(message, "error");
    },
  });

  const createProfile = (payload) => {
    createMutation.mutate({ customerId, payload });
  };

  const updateProfile = (profileId, payload) => {
    updateMutation.mutate({ customerId, profileId, payload });
  };

  const deleteProfile = (profileId) => {
    deleteMutation.mutate({ customerId, profileId });
  };

  return {
    profilesQuery,
    createProfile,
    updateProfile,
    deleteProfile,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
  };
}
