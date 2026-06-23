import { useNavigate } from "react-router";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useDataHubContext } from "../context/DataHubContext";

export default function LandingPanel() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { runs, selectRun } = useDataHubContext();

  async function handleOpenRun(runId) {
    await selectRun(runId);
    navigate(`/app/data-hub/upload?runId=${encodeURIComponent(runId)}`);
  }

  function handleCreateRun() {
    navigate("/app/data-hub/create");
  }

  return (
    <Box sx={{ p: theme.spacing(3) }}>
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          Create a new run or resume an existing one.
        </Typography>

        <Card variant="outlined">
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h6">Create run</Typography>
                <Typography variant="body2" color="text.secondary">
                  Start a new Data Hub processing run for the selected customer
                  and profile.
                </Typography>
              </Box>
              <Button variant="contained" onClick={handleCreateRun}>
                Create Data Hub Run
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">Recent runs</Typography>
                <Typography variant="body2" color="text.secondary">
                  Resume a run to continue upload, link, map, stage, exclusions,
                  rules, SBI and validation work.
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Run</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Profile</TableCell>
                      <TableCell>Coverage</TableCell>
                      <TableCell>Rows</TableCell>
                      <TableCell>Updated</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {runs.map((run) => (
                      <TableRow key={run.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {run.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={run.status} size="small" />
                        </TableCell>
                        <TableCell>{run.profileName}</TableCell>
                        <TableCell>{run.coverage}</TableCell>
                        <TableCell>
                          {run.paymentsRows +
                            run.invoicesRows +
                            run.supportingRows}
                        </TableCell>
                        <TableCell>{run.updatedAt}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenRun(run.id)}
                          >
                            Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </CardContent>
        </Card>

        <Box>
          <Button variant="text" onClick={() => navigate("/app")}>
            Back to Work Hub
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
