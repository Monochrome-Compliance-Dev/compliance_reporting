import { useNavigate } from "react-router"; // Import useNavigate
import { customerService } from "../../services";
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

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await customerService.getAll();
        setCustomers(response || []);
      } catch (err) {
        console.error("Error loading customers:", err);
        setError("Failed to load customers.");
      }
    }

    fetchCustomers();
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

  if (!customers || customers.length === 0) {
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
            No Customers Found
          </Typography>
          <Button
            variant="contained"
            color="primary" // Reverted to US English
            onClick={() => navigate("/customers/register")} // Navigate to register page
            sx={{ mt: 2 }}
          >
            Register a New Customer
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
          Customers
        </Typography>
        <Typography variant="body1" gutterBottom>
          This is the Customers page. Below is the list of registered customers.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/customers/register")} // Navigate to register page
          sx={{ mb: 2 }}
        >
          Register a New Customer
        </Button>
        <List>
          {customers.map((customer) => (
            <ListItem
              key={customer.id}
              sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
            >
              <ListItemText
                primary={customer.businessName}
                secondary={`Email: ${customer.contactEmail} | Phone: ${customer.contactPhone}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
