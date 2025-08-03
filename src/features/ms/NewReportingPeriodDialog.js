import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { msService } from "../../services/ms/ms";
import { useAlert } from "../../context/";
import { sanitiseInput } from "../../lib/utils/sanitiseInput";

const schema = Yup.object().shape({
  name: Yup.string()
    .transform((value) => sanitiseInput(value))
    .required("Name is required"),
  startDate: Yup.string()
    .required("Start date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  endDate: Yup.string()
    .required("End date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .test(
      "is-after-start",
      "End date cannot be before start date",
      function (value) {
        const { startDate } = this.parent;
        return !startDate || !value || new Date(value) >= new Date(startDate);
      }
    ),
});

const NewReportingPeriodDialog = ({ open, onClose, onCreated }) => {
  const { showAlert } = useAlert();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
    },
  });

  const onSubmit = async (data) => {
    console.log("onSubmit data: ", data);
    try {
      await msService.createReportingPeriod(data);
      showAlert(`Reporting period "${data.name}" created.`, "success");
      onCreated();
      onClose();
      reset();
    } catch (error) {
      console.error("Failed to create reporting period:", error);
      showAlert(`Failed to create reporting period "${data.name}".`, "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>New Reporting Period</DialogTitle>
      <DialogContent>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Name"
              margin="normal"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />
        <Controller
          name="startDate"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Start Date"
              type="date"
              margin="normal"
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!errors.startDate}
              helperText={errors.startDate?.message}
            />
          )}
        />
        <Controller
          name="endDate"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="End Date"
              type="date"
              margin="normal"
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!errors.endDate}
              helperText={errors.endDate?.message}
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

export default NewReportingPeriodDialog;
