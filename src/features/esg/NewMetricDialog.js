import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { esgService } from "../../services/esg/esg";
import { useAlert } from "../../context/";
import { sanitiseInput } from "../../lib/utils/sanitiseInput";
import { useState } from "react";

const schema = Yup.object().shape({
  indicatorId: Yup.string().required("Indicator is required"),
  value: Yup.number()
    .typeError("Value must be a number")
    .required("Value is required"),
  unit: Yup.string().required("Unit is required"),
  newUnit: Yup.mixed().when("unit", (unit) =>
    unit === "__new__"
      ? Yup.string().required("New unit is required")
      : Yup.string()
  ),
});

const NewMetricDialog = ({
  open,
  onClose,
  onCreated,
  reportingPeriodId,
  indicators,
  metrics,
}) => {
  const { showAlert } = useAlert();
  const [newUnit, setNewUnit] = useState("");
  // Build unique units from all metrics
  const uniqueUnits = [...new Set(metrics.map((m) => m.unit))].filter(
    (u) => !!u && u !== "__new__"
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      indicatorId: "",
      value: "",
      unit: "",
      newUnit: "",
    },
  });

  const watchedUnit = watch("unit");

  const onSubmit = async (data) => {
    if (
      data.unit === "__new__" &&
      (!data.newUnit || data.newUnit.trim() === "")
    ) {
      showAlert("New unit is required.", "warning");
      return;
    }

    const selectedUnit =
      data.unit === "__new__"
        ? sanitiseInput(data.newUnit)
        : sanitiseInput(data.unit);
    // Prevent duplicate units
    if (
      data.unit === "__new__" &&
      uniqueUnits.includes(sanitiseInput(data.newUnit))
    ) {
      showAlert(
        "This unit already exists. Please select it from the list.",
        "warning"
      );
      return;
    }
    const cleanData = {
      indicatorId: data.indicatorId,
      value: data.value,
      unit: selectedUnit,
      reportingPeriodId,
    };
    try {
      await esgService.createMetric(cleanData);
      showAlert(`Metric created.`, "success");
      onCreated();
      onClose();
      reset();
      setNewUnit("");
    } catch (error) {
      console.error("Failed to create metric:", error);
      showAlert("Failed to create metric.", "error");
    }
  };

  if (!indicators || indicators.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>New ESG Metric</DialogTitle>
      <DialogContent>
        <Controller
          name="indicatorId"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Indicator *"
              margin="normal"
              fullWidth
              error={!!errors.indicatorId}
              helperText={errors.indicatorId?.message}
            >
              {indicators && indicators.length > 0 ? (
                indicators.map((ind) => (
                  <MenuItem key={ind.id} value={ind.id}>
                    {ind.name} ({ind.code})
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No indicators found</MenuItem>
              )}
            </TextField>
          )}
        />
        <Controller
          name="unit"
          control={control}
          render={({ field }) => (
            <>
              <TextField
                {...field}
                select
                label="Select Unit *"
                margin="normal"
                fullWidth
                error={!!errors.unit}
                helperText={errors.unit?.message}
              >
                {uniqueUnits.length > 0 ? (
                  uniqueUnits.map((u, i) => (
                    <MenuItem key={i} value={u}>
                      {u}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No existing units</MenuItem>
                )}
                <MenuItem value="__new__">+ Add new unit</MenuItem>
              </TextField>
              {field.value === "__new__" && (
                <Controller
                  name="newUnit"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New Unit *"
                      margin="normal"
                      fullWidth
                      error={!!errors.newUnit}
                      helperText={errors.newUnit?.message}
                    />
                  )}
                />
              )}
            </>
          )}
        />
        <Controller
          name="value"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Value *"
              type="number"
              margin="normal"
              fullWidth
              error={!!errors.value}
              helperText={errors.value?.message}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewMetricDialog;
