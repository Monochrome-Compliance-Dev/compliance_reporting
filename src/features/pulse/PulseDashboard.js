import React from "react";
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
} from "@mui/material";
import data from "./mockData.json";
import { useNavigate } from "react-router";

const PulseDashboard = () => {
  const navigate = useNavigate();

  const { clients, resources, engagements, timeEntries, allocations } = data;

  const clientName = (clientId) =>
    clients.find((c) => c.id === clientId)?.name || "-";

  const statusLabel = {
    IN_PROGRESS: "In Progress",
    PLANNED: "Planned",
    OVER_BUDGET: "Over Budget",
  };

  const engagementRows = engagements.map((e) => ({
    id: e.id,
    name: e.name,
    client: clientName(e.clientId),
    budgetHours: e.budgetHours,
    actualHours: timeEntries
      .filter((t) => t.engagementId === e.id)
      .reduce((s, t) => s + Number(t.hours || 0), 0),
    status: statusLabel[e.status] || e.status,
  }));

  const totalBudgetHours = engagements.reduce(
    (s, e) => s + Number(e.budgetHours || 0),
    0
  );
  const totalActualHours = timeEntries.reduce(
    (s, t) => s + Number(t.hours || 0),
    0
  );

  const resourceRows = resources.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    allocatedHours: allocations
      .filter((a) => a.resourceId === r.id)
      .reduce((s, a) => s + Number(a.allocatedHours || 0), 0),
  }));

  const clientRows = clients.map((c) => ({
    id: c.id,
    name: c.name,
    abn: c.abn,
    email: c.email || c.primaryEmail || "-",
  }));

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Pulse Dashboard
      </Typography>

      {/* KPI Overview */}
      <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
        KPI Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Engagements</Typography>
              <Typography variant="h4">{engagementRows.length}</Typography>
              <Typography variant="body2" color="textSecondary">
                Number of engagements
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Budget Hours</Typography>
              <Typography variant="h4">{totalBudgetHours}</Typography>
              <Typography variant="body2" color="textSecondary">
                Planned hours across all engagements
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Actual Hours</Typography>
              <Typography variant="h4">{totalActualHours}</Typography>
              <Typography variant="body2" color="textSecondary">
                Actual hours spent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Clients Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 4,
          mb: 2,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Clients
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            sx={{ mr: 1 }}
            onClick={() => navigate("/pulse/clients/new")}
          >
            + New Client
          </Button>
          <Button
            variant="text"
            color="primary"
            onClick={() => navigate("/pulse/clients")}
          >
            View All
          </Button>
        </Box>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>ABN</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clientRows.map((c) => (
            <TableRow key={c.id} hover>
              <TableCell>{c.name}</TableCell>
              <TableCell>{c.abn || "-"}</TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(`/pulse/clients/${c.id}`)}
                >
                  Open
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Engagements Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 4,
          mb: 2,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Engagements
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            sx={{ mr: 1 }}
            onClick={() => navigate("/pulse/engagements/new")}
          >
            + New Engagement
          </Button>
          <Button
            variant="text"
            color="primary"
            onClick={() => navigate("/pulse/engagements")}
          >
            View All
          </Button>
        </Box>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Engagement Name</TableCell>
            <TableCell>Client</TableCell>
            <TableCell>Budget Hours</TableCell>
            <TableCell>Actual Hours</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {engagementRows.map((e) => (
            <TableRow key={e.id} hover>
              <TableCell>{e.name}</TableCell>
              <TableCell>{e.client}</TableCell>
              <TableCell>{e.budgetHours}</TableCell>
              <TableCell>{e.actualHours}</TableCell>
              <TableCell>{e.status}</TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(`/pulse/engagements/${e.id}`)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Resources Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 4,
          mb: 2,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Resources
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            sx={{ mr: 1 }}
            onClick={() => navigate("/pulse/resources/new")}
          >
            + New Resource
          </Button>
          <Button
            variant="text"
            color="primary"
            onClick={() => navigate("/pulse/resources")}
          >
            View All
          </Button>
        </Box>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Allocated Hours</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {resourceRows.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.role}</TableCell>
              <TableCell>{r.allocatedHours}</TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(`/pulse/resources/${r.id}`)}
                >
                  Update
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
};

export default PulseDashboard;
