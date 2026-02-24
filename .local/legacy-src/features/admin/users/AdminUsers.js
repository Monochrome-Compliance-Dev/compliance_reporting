import { useEffect, useState } from "react";
import { redirect, useNavigate } from "react-router"; // Import useNavigate
import { userService } from "../../services";
import {
  useTheme,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
} from "@mui/material";
import ProtectedRoutes from "../../lib/utils/ProtectedRoutes";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const theme = useTheme(); // Access the theme
  const navigate = useNavigate();

  useEffect(() => {
    if (!ProtectedRoutes("Admin")) {
      navigate("/user/dashboard");
      return;
    }

    async function fetchUsers() {
      try {
        const result = await userService.getAll();
        setUsers(result || []);
      } catch (err) {
        console.error("Error loading users:", err);
        setError("Failed to load users.");
      }
    }

    fetchUsers();
  }, []);

  if (error) {
    return (
      <Box
        sx={{
          padding: theme.spacing(3),
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: theme.spacing(3),
            maxWidth: 800,
            margin: "0 auto",
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Typography variant="h4" gutterBottom color="error">
            {error}
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Box
        sx={{
          padding: theme.spacing(3),
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: theme.spacing(3),
            maxWidth: 800,
            margin: "0 auto",
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Typography variant="h4" gutterBottom>
            No Users Found
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/users/create")}
            sx={{ mt: theme.spacing(2) }}
          >
            Create a New User
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        padding: theme.spacing(3),
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: theme.spacing(3),
          maxWidth: 800,
          margin: "0 auto",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Users
        </Typography>
        <Typography variant="body1" gutterBottom>
          This is the Users page. Below is the list of registered users.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/users/create")}
          sx={{ mb: theme.spacing(2) }}
        >
          Create a New User
        </Button>
        <List>
          {users.map((user) => (
            <ListItem
              key={user.id}
              sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
            >
              <ListItemText
                primary={`${user.firstName} ${user.lastName}`}
                secondary={`Role: ${user.role} | Position: ${user.position} | Email: ${user.email} | Phone: ${user.phone}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
