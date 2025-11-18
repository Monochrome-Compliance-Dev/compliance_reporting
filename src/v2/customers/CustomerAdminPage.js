import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import { useCustomers } from "./useCustomers";
import CustomerTable from "./CustomerTable";
import CustomerFormDialog from "./CustomerFormDialog";
import { useNavigate } from "react-router";

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

    navigate(`/v2/boss/customers/${customer.id}/entitlements`, {
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
      `Are you sure you want to delete customer "${customer.businessName}"?`
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
