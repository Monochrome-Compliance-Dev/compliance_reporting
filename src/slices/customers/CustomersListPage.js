import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router";
import { useTheme } from "@mui/material/styles";

import { customersApi } from "./customersApi";
import { useAlert } from "context";

export default function CustomersListPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const data = await customersApi.getAll();
        if (mounted) setCustomers(data);
      } catch (err) {
        showAlert("Failed to load customers", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [showAlert]);

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight={600}>
          Customers
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate("/app/boss/customers/new")}
        >
          Add Customer
        </Button>
      </Box>

      <Paper
        sx={{
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Business Name</TableCell>
                  <TableCell>ABN</TableCell>
                  <TableCell>Billing Type</TableCell>
                  <TableCell>Seats</TableCell>
                  <TableCell>Active</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((c) => (
                  <TableRow
                    key={c.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(`/app/boss/customers/${c.id}`)}
                  >
                    <TableCell>{c.businessName}</TableCell>
                    <TableCell>{c.abn}</TableCell>
                    <TableCell>{c.billingType}</TableCell>
                    <TableCell>{c.seats}</TableCell>
                    <TableCell>{c.active ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}

                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No customers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
