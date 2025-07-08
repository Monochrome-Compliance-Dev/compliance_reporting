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
  name: Yup.string().required("Name is required"),
  code: Yup.string()
    .matches(
      /^[a-zA-Z0-9_]+$/,
      "Code can only contain letters, numbers, and underscores"
    )
    .required("Code is required"),
  description: Yup.string(),
  category: Yup.string()
    .oneOf(["environment", "social", "governance"])
    .required("Category is required"),
});

const NewIndicatorDialog = ({
  open,
  onClose,
  onCreated,
  reportingPeriodId,
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
      name: "",
      code: "",
      description: "",
      category: "",
    },
  });

  const onSubmit = async (data) => {
    const cleanData = {
      name: sanitiseInput(data.name),
      code: sanitiseInput(data.code),
      description: sanitiseInput(data.description),
      category: sanitiseInput(data.category),
      reportingPeriodId,
    };

    try {
      await esgService.createIndicator(cleanData);
      showAlert(`Indicator "${cleanData.name}" created.`, "success");
      onCreated();
      onClose();
      reset();
    } catch (error) {
      console.error("Failed to create indicator:", error);
      showAlert(`Failed to create indicator "${cleanData.name}".`, "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>New ESG Indicator</DialogTitle>
      <DialogContent>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Name *"
              margin="normal"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Code *"
              margin="normal"
              fullWidth
              error={!!errors.code}
              helperText={errors.code?.message}
            />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Description"
              margin="normal"
              fullWidth
              multiline
              rows={3}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          )}
        />
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Category *"
              margin="normal"
              fullWidth
              error={!!errors.category}
              helperText={errors.category?.message}
            >
              <MenuItem value="environment">Environment</MenuItem>
              <MenuItem value="social">Social</MenuItem>
              <MenuItem value="governance">Governance</MenuItem>
            </TextField>
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

export default NewIndicatorDialog;
