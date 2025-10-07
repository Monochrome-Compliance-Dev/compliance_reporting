/**
 * Generic delete handler to be used inside component event handlers.
 *
 * @param {Object} options
 * @param {Function} options.deleteFn - Async function to delete the record by ID
 * @param {Function} options.setDialogState - Function to open the ConfirmDialog
 * @param {Function} options.showAlert - Function to display alert messages
 * @param {Function} [options.onSuccess] - Optional function to call after successful deletion
 */
const deleteHandler = ({ deleteFn, setDialogState, showAlert, onSuccess }) => {
  return (recordId, label = "record") => {
    setDialogState({
      open: true,
      title: `Delete ${label}?`,
      content: `Are you sure you want to delete this ${label}? This action cannot be undone.`,
      onClose: async ({ confirmed }) => {
        if (!confirmed) return setDialogState(null);

        try {
          await deleteFn(recordId);
          showAlert(`${label} deleted successfully.`, "success");
          if (onSuccess) onSuccess(recordId);
        } catch (error) {
          console.error(
            "Deletion failed:",
            error.response?.data || error.message || error
          );
          showAlert(`Failed to delete ${label}.`, "error");
        } finally {
          setDialogState(null);
        }
      },
    });
  };
};

export default deleteHandler;
