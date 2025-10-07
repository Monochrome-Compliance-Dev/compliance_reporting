/**
 * Generic edit handler to be used inside component event handlers.
 *
 * @param {Object} options
 * @param {Function} options.setDialogState - Function to open the edit dialog
 * @param {Function} options.showAlert - Function to display alert messages
 * @param {Function} [options.onSuccess] - Optional callback after successful edit
 */
const editHandler = ({ setDialogState, showAlert, onSuccess }) => {
  return (record, label = "record") => {
    setDialogState({
      open: true,
      title: `Edit ${label}`,
      record,
      onClose: async ({ confirmed, updatedData }) => {
        if (!confirmed) return setDialogState(null);

        try {
          // Ideally the actual update function should be handled in the dialog component
          showAlert(`${label} updated successfully.`, "success");
          if (onSuccess) onSuccess(updatedData);
        } catch (error) {
          console.error(
            "Edit failed:",
            error.response?.data || error.message || error
          );
          showAlert(`Failed to update ${label}.`, "error");
        } finally {
          setDialogState(null);
        }
      },
    });
  };
};

export default editHandler;
