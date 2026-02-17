import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

const schema = Yup.object().shape({
  name: Yup.string().required("Profile name is required"),
  description: Yup.string().nullable(),
  product: Yup.string()
    .oneOf(["ptrs", "pulse"], "Invalid product")
    .required("Product is required"),
});

const defaultValues = {
  name: "Big Boy",
  description: "",
  product: "ptrs",
};

function CustomerProfileFormDialog({ open, onClose, onSubmit, initialValues }) {
  const theme = useTheme();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;

    reset({
      ...defaultValues,
      ...(initialValues || {}),
    });
  }, [open, initialValues, reset]);

  const handleFormSubmit = (values) => {
    if (onSubmit) {
      onSubmit(values);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle>
        {initialValues ? "Edit profile" : "New profile"}
      </DialogTitle>
      <DialogContent sx={{ pt: theme.spacing(2) }}>
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Profile name"
                fullWidth
                size="small"
                {...register("name")}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                size="small"
                {...register("description")}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="product"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Product"
                    fullWidth
                    size="small"
                    {...field}
                    value={field.value ?? "ptrs"}
                    error={!!errors.product}
                    helperText={errors.product?.message}
                  >
                    <MenuItem value="ptrs">PTRS</MenuItem>
                    <MenuItem value="pulse">Pulse</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions sx={{ px: theme.spacing(3), pb: theme.spacing(2) }}>
        <Button onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={handleSubmit(handleFormSubmit)}
          disabled={isSubmitting}
        >
          {initialValues ? "Save changes" : "Create profile"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CustomerProfileFormDialog;
