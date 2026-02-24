import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router";
import { useCustomers } from "./useCustomers";
import CustomerTable from "./CustomerTable";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

const customerSchema = Yup.object().shape({
  businessName: Yup.string().trim().required("Business name is required"),
  abn: Yup.string()
    .transform((v) => (v ? v.replace(/\s+/g, "") : ""))
    .nullable()
    .test("abn-format", "ABN must be 11 digits", (v) => {
      if (!v) return true;
      return /^\d{11}$/.test(v);
    }),
  billingType: Yup.string()
    .oneOf(["DIRECT", "CUSTOMER"], "Invalid billing type")
    .required("Billing type is required"),
  seats: Yup.number()
    .typeError("Seats must be a number")
    .integer("Seats must be a whole number")
    .min(1, "Seats must be at least 1")
    .required("Seats is required"),
  active: Yup.boolean().required(),
});

const customerDefaultValues = {
  businessName: "",
  abn: "",
  billingType: "DIRECT",
  seats: 1,
  active: true,
};

function CustomerFormDialog({ open, mode, initialValues, onClose, onSubmit }) {
  const theme = useTheme();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(customerSchema),
    defaultValues: customerDefaultValues,
  });

  useEffect(() => {
    if (!open) return;

    reset({
      ...customerDefaultValues,
      ...(initialValues || {}),
      // Ensure seats is a number for the form field
      seats:
        initialValues?.seats === undefined || initialValues?.seats === null
          ? 1
          : Number(initialValues.seats),
      // Normalise optional ABN to string
      abn: initialValues?.abn || "",
    });
  }, [open, initialValues, reset]);

  const active = watch("active");

  const handleFormSubmit = (values) => {
    const payload = {
      ...values,
      businessName: values.businessName.trim(),
      abn: values.abn ? values.abn.replace(/\s+/g, "") : "",
      seats: Number(values.seats),
    };

    if (onSubmit) onSubmit(payload);
  };

  const handleCancel = () => {
    if (!isSubmitting && onClose) onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === "edit" ? "Edit customer" : "New customer"}
      </DialogTitle>
      <DialogContent sx={{ pt: theme.spacing(2) }}>
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Business name"
                fullWidth
                size="small"
                {...register("businessName")}
                error={!!errors.businessName}
                helperText={errors.businessName?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="ABN"
                fullWidth
                size="small"
                placeholder="11 digits"
                {...register("abn")}
                error={!!errors.abn}
                helperText={errors.abn?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Billing type"
                fullWidth
                size="small"
                {...register("billingType")}
                error={!!errors.billingType}
                helperText={errors.billingType?.message}
              >
                <MenuItem value="DIRECT">DIRECT</MenuItem>
                <MenuItem value="CUSTOMER">CUSTOMER</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Seats"
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 1, step: 1 }}
                {...register("seats")}
                error={!!errors.seats}
                helperText={errors.seats?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!active}
                    onChange={(e) => setValue("active", e.target.checked)}
                  />
                }
                label="Active"
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
          {mode === "edit" ? "Save changes" : "Create customer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CustomerAdminPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { customersQuery, createCustomer, updateCustomer, deleteCustomer } =
    useCustomers();
  const { data: customers = [], isLoading } = customersQuery;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // "create" | "edit"
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleEntitlements = (customer) => {
    if (!customer || !customer.id) return;

    navigate(`/app/boss/customers/${customer.id}/entitlements`, {
      state: { customer },
    });
  };

  const handleProfiles = (customer) => {
    if (!customer || !customer.id) return;

    navigate(`/app/boss/customers/${customer.id}/profiles`, {
      state: { customer },
    });
  };

  const handleCreateClick = () => {
    setDialogMode("create");
    setSelectedCustomer(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (customer) => {
    setDialogMode("edit");
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleDelete = (customer) => {
    if (!customer?.id) {
      return;
    }
    // Simple confirmation for now
    // Can be replaced with a nicer dialog in future
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Are you sure you want to delete customer "${customer.businessName}"?`,
    );
    if (confirmed) {
      deleteCustomer(customer.id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCustomer(null);
  };

  const handleSubmitDialog = (values) => {
    if (dialogMode === "edit" && selectedCustomer?.id) {
      updateCustomer(selectedCustomer.id, values);
    } else {
      createCustomer(values);
    }
    setIsDialogOpen(false);
    setSelectedCustomer(null);
  };

  return (
    <Box
      sx={{
        padding: theme.spacing(3),
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2),
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5">Customers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          Add customer
        </Button>
      </Box>

      <Paper sx={{ padding: theme.spacing(2), flex: 1 }}>
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <CustomerTable
            rows={customers}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onEntitlements={handleEntitlements}
            onProfiles={handleProfiles}
          />
        )}
      </Paper>
      <CustomerFormDialog
        open={isDialogOpen}
        mode={dialogMode}
        initialValues={selectedCustomer}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitDialog}
      />
    </Box>
  );
}

export default CustomerAdminPage;
