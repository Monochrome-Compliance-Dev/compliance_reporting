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

const schema = Yup.object().shape({
  indicatorId: Yup.string().length(10).required("Indicator is required"),
  value: Yup.number().required("Value is required"),
  unit: Yup.string().required("Unit is required"),
});

const NewMetricDialog = ({
  open,
  onClose,
  onCreated,
  reportingPeriodId,
  indicators,
}) => {
  const { showAlert } = useAlert();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      indicatorId: "",
      value: "",
      unit: "",
    },
  });

  const onSubmit = async (data) => {
    const cleanData = {
      indicatorId: data.indicatorId,
      value: data.value,
      unit: sanitiseInput(data.unit),
      reportingPeriodId,
    };

    try {
      await esgService.createMetric(cleanData);
      showAlert(`Metric created.`, "success");
      onCreated();
      onClose();
      reset();
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
          name="value"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Value"
              type="number"
              margin="normal"
              fullWidth
              error={!!errors.value}
              helperText={errors.value?.message}
            />
          )}
        />
        <Controller
          name="unit"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Unit"
              margin="normal"
              fullWidth
              error={!!errors.unit}
              helperText={errors.unit?.message}
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
