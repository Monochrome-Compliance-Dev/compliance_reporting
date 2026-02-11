import { useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

const schema = Yup.object().shape({
  businessName: Yup.string().required("Business name is required"),
  abn: Yup.string().required("ABN is required"),
  industryCode: Yup.string().required("Industry code is required"),
  addressline1: Yup.string().nullable(),
  city: Yup.string().nullable(),
  state: Yup.string().nullable(),
  postcode: Yup.string().nullable(),
  country: Yup.string().nullable(),
  contactFirst: Yup.string().nullable(),
  contactLast: Yup.string().nullable(),
  contactPosition: Yup.string().nullable(),
  contactEmail: Yup.string().email("Invalid email").nullable(),
  contactPhone: Yup.string().nullable(),
  seats: Yup.number()
    .nullable()
    .transform((value, originalValue) =>
      String(originalValue).trim() === "" ? null : value
    ),
  billingType: Yup.string().nullable(),
  partnerId: Yup.string().nullable(),
});

const defaultValues = {
  businessName: "",
  abn: "",
  industryCode: "",
  addressline1: "",
  city: "",
  state: "",
  postcode: "",
  country: "",
  contactFirst: "",
  contactLast: "",
  contactPosition: "",
  contactEmail: "",
  contactPhone: "",
  seats: "",
  billingType: "",
  partnerId: "",
};

function CustomerFormDialog({ open, mode, initialValues, onClose, onSubmit }) {
  const theme = useTheme();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialValues) {
        reset({
          ...defaultValues,
          ...initialValues,
          seats: initialValues.seats ?? "",
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, mode, initialValues, reset]);

  const handleFormSubmit = (values) => {
    const payload = {
      ...values,
      seats:
        values.seats === "" || values.seats === null
          ? null
          : Number(values.seats),
    };
    if (onSubmit) {
      onSubmit(payload);
    }
  };

  const title = mode === "edit" ? "Edit customer" : "Add customer";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ marginTop: theme.spacing(0.5) }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Business name"
              fullWidth
              size="small"
              {...register("businessName")}
              error={!!errors.businessName}
              helperText={errors.businessName?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="ABN"
              fullWidth
              size="small"
              {...register("abn")}
              error={!!errors.abn}
              helperText={errors.abn?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Industry code"
              fullWidth
              size="small"
              {...register("industryCode")}
              error={!!errors.industryCode}
              helperText={errors.industryCode?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Address line 1"
              fullWidth
              size="small"
              {...register("addressline1")}
              error={!!errors.addressline1}
              helperText={errors.addressline1?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="City"
              fullWidth
              size="small"
              {...register("city")}
              error={!!errors.city}
              helperText={errors.city?.message}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="State"
              fullWidth
              size="small"
              {...register("state")}
              error={!!errors.state}
              helperText={errors.state?.message}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Postcode"
              fullWidth
              size="small"
              {...register("postcode")}
              error={!!errors.postcode}
              helperText={errors.postcode?.message}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Country"
              fullWidth
              size="small"
              {...register("country")}
              error={!!errors.country}
              helperText={errors.country?.message}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Contact first name"
              fullWidth
              size="small"
              {...register("contactFirst")}
              error={!!errors.contactFirst}
              helperText={errors.contactFirst?.message}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Contact last name"
              fullWidth
              size="small"
              {...register("contactLast")}
              error={!!errors.contactLast}
              helperText={errors.contactLast?.message}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Contact position"
              fullWidth
              size="small"
              {...register("contactPosition")}
              error={!!errors.contactPosition}
              helperText={errors.contactPosition?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Contact email"
              fullWidth
              size="small"
              {...register("contactEmail")}
              error={!!errors.contactEmail}
              helperText={errors.contactEmail?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Contact phone"
              fullWidth
              size="small"
              {...register("contactPhone")}
              error={!!errors.contactPhone}
              helperText={errors.contactPhone?.message}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Seats"
              fullWidth
              size="small"
              type="number"
              {...register("seats")}
              error={!!errors.seats}
              helperText={errors.seats?.message}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Billing type"
              fullWidth
              size="small"
              {...register("billingType")}
              error={!!errors.billingType}
              helperText={errors.billingType?.message}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Partner ID"
              fullWidth
              size="small"
              {...register("partnerId")}
              error={!!errors.partnerId}
              helperText={errors.partnerId?.message}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          variant="contained"
          disabled={isSubmitting}
        >
          {mode === "edit" ? "Save changes" : "Create customer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CustomerFormDialog;
