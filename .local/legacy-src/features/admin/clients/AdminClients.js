import { useNavigate } from "react-router"; // Import useNavigate
import { clientService } from "../../services";
import { useEffect, useState } from "react";
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

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await clientService.getAll();
        setClients(response || []);
      } catch (err) {
        console.error("Error loading clients:", err);
        setError("Failed to load clients.");
      }
    }

    fetchClients();
  }, []);

  if (error) {
    return (
      <Box
        sx={{
          padding: 3,
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 3,
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

  if (!clients || clients.length === 0) {
    return (
      <Box
        sx={{
          padding: 3,
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 3,
            maxWidth: 800,
            margin: "0 auto",
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Typography variant="h4" gutterBottom>
            No Clients Found
          </Typography>
          <Button
            variant="contained"
            color="primary" // Reverted to US English
            onClick={() => navigate("/clients/register")} // Navigate to register page
            sx={{ mt: 2 }}
          >
            Register a New Client
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        padding: 3,
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 3,
          maxWidth: 800,
          margin: "0 auto",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Clients
        </Typography>
        <Typography variant="body1" gutterBottom>
          This is the Clients page. Below is the list of registered clients.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/clients/register")} // Navigate to register page
          sx={{ mb: 2 }}
        >
          Register a New Client
        </Button>
        <List>
          {clients.map((client) => (
            <ListItem
              key={client.id}
              sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
            >
              <ListItemText
                primary={client.businessName}
                secondary={`Email: ${client.contactEmail} | Phone: ${client.contactPhone}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
