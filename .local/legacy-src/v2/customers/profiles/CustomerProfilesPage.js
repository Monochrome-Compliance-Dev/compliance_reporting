import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CustomerProfileFormDialog from "./CustomerProfileFormDialog";
import { useCustomerProfiles } from "./useCustomerProfiles";

function CustomerProfilesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { customerId } = useParams();
  const location = useLocation();

  const { profilesQuery, createProfile, updateProfile, deleteProfile } =
    useCustomerProfiles(customerId);

  const { data: profiles = [], isLoading } = profilesQuery;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);

  const customerFromState = location.state && location.state.customer;
  const customerName =
    customerFromState?.businessName || customerFromState?.name || "";

  const handleNew = () => {
    setEditingProfile(null);
    setDialogOpen(true);
  };

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    setDialogOpen(true);
  };

  const handleRequestDelete = (profile) => {
    if (!profile || !profile.id) return;
    setProfileToDelete(profile);
    setDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setProfileToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (profileToDelete && profileToDelete.id) {
      deleteProfile(profileToDelete.id);
    }
    setDeleteDialogOpen(false);
    setProfileToDelete(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProfile(null);
  };

  const handleDialogSubmit = (values) => {
    if (editingProfile && editingProfile.id) {
      updateProfile(editingProfile.id, values);
    } else {
      createProfile(values);
    }
    setDialogOpen(false);
    setEditingProfile(null);
  };

  const handleBack = () => {
    navigate("/v2/boss/customers");
  };

  if (!customerId) {
    return (
      <Box sx={{ p: theme.spacing(3) }}>
        <Typography variant="body1" color="error">
          Missing customer id in route.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: theme.spacing(3) }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: theme.spacing(2) }}
      >
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Profiles{customerName ? ` · ${customerName}` : ""}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage profiles for this customer. Profiles can be used to configure
            modules like PTRS and Pulse.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="text" onClick={handleBack}>
            Back to customers
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNew}
          >
            New profile
          </Button>
        </Stack>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 160,
              }}
            >
              <CircularProgress />
            </Box>
          ) : profiles.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No profiles found for this customer.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>{profile.name}</TableCell>
                    <TableCell sx={{ textTransform: "uppercase" }}>
                      {profile.product}
                    </TableCell>
                    <TableCell>{profile.description}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit profile">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(profile)}
                          sx={{ marginRight: theme.spacing(1) }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete profile">
                        <IconButton
                          size="small"
                          onClick={() => handleRequestDelete(profile)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CustomerProfileFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        initialValues={editingProfile}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete profile</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the profile{" "}
            <strong>{profileToDelete?.name}</strong>? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CustomerProfilesPage;
