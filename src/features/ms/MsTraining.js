import { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import { msService } from "../../services/ms/ms";
import { StandardTable } from "../../components/shared/compliance";
import { trainingColumns } from "../../components/shared/compliance/tableConfigs";
import { useAlert } from "../../context/AlertContext";
import { ConfirmDialog } from "../../components/ui/";

function MsTraining() {
  const [trainingData, setTrainingData] = useState([]);
  const [dialogState, setDialogState] = useState(null);
  const [editingRowId, setEditingRowId] = useState(null);
  const { showAlert } = useAlert();

  useEffect(() => {
    msService.getTrainingRecords().then((data) => {
      if (Array.isArray(data)) {
        setTrainingData(data);
      } else {
        console.warn("Unexpected response:", data);
      }
    });
  }, []);

  const handleEdit = async (updatedRecord) => {
    try {
      const result = await msService.updateTrainingRecord(
        updatedRecord.id,
        updatedRecord
      );
      setTrainingData((prev) =>
        prev.map((r) => (r.id === result.id ? result : r))
      );
      setEditingRowId(null);
      showAlert("Training record updated successfully.", "success");
    } catch (err) {
      console.error("Edit failed:", err);
      showAlert("Failed to update training record.", "error");
    }
  };

  const handleDelete = (record) => {
    const confirmedDelete = async () => {
      try {
        await msService.deleteTrainingRecord(record.id);
        setTrainingData((prev) => prev.filter((r) => r.id !== record.id));
        showAlert("Training record deleted successfully.", "success");
      } catch (err) {
        console.error("Delete failed:", err);
        showAlert("Failed to delete training record.", "error");
      } finally {
        setDialogState(null);
      }
    };

    setDialogState({
      title: `Delete training record`,
      content: `Are you sure you want to delete the training record for ${record.employeeName}? This action cannot be undone.`,
      onClose: () => setDialogState(null),
      onConfirm: confirmedDelete,
    });
  };

  return (
    <>
      <Button onClick={() => console.log("Add clicked")} sx={{ mb: 2 }}>
        Add Training Record
      </Button>
      <StandardTable
        columns={trainingColumns}
        rows={trainingData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        editingRowId={editingRowId}
        setEditingRowId={setEditingRowId}
      />
      {dialogState && (
        <ConfirmDialog
          open={true}
          title={dialogState.title}
          content={dialogState.content}
          onClose={dialogState.onClose || (() => setDialogState(null))}
          onConfirm={dialogState.onConfirm}
        />
      )}
    </>
  );
}

export default MsTraining;
