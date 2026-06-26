import { useNavigate } from "react-router";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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
import { useDataHubDatasetsQuery } from "../hooks/useDataHubQueries";

export default function LandingPanel() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { selectedProfileId } = useDataHubContext();
  const {
    data: datasetsResponse,
    isLoading,
    isError,
    error,
  } = useDataHubDatasetsQuery(selectedProfileId);
  const datasets = datasetsResponse?.items || [];

  return (
    <Box sx={{ p: theme.spacing(3) }}>
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          Upload and manage customer datasets for use across future analysis
          modules.
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
                <Typography variant="h6">Upload dataset</Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload a CSV dataset for the selected customer and profile.
                </Typography>
              </Box>
              <Button
                variant="contained"
                disabled={!selectedProfileId}
                onClick={() => {
                  navigate("create");
                }}
              >
                Upload dataset
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">Recent datasets</Typography>
                <Typography variant="body2" color="text.secondary">
                  View datasets already uploaded for this customer profile.
                </Typography>
              </Box>

              {!selectedProfileId && (
                <Typography variant="body2" color="text.secondary">
                  Choose a profile before viewing Data Hub datasets.
                </Typography>
              )}

              {isLoading && selectedProfileId && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Loading datasets...
                  </Typography>
                </Stack>
              )}

              {isError && (
                <Typography variant="body2" color="error">
                  {error?.message || "Failed to load Data Hub datasets."}
                </Typography>
              )}

              {!isLoading &&
                selectedProfileId &&
                !isError &&
                !datasets.length && (
                  <Typography variant="body2" color="text.secondary">
                    No datasets have been created for this profile yet.
                  </Typography>
                )}

              {!!datasets.length && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Dataset</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Rows</TableCell>
                        <TableCell>Updated</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {datasets.map((dataset) => {
                        const isPublished = dataset.status === "published";

                        return (
                          <TableRow key={dataset.id} hover>
                            <TableCell>
                              <Stack spacing={0.25}>
                                <Typography variant="body2" fontWeight={700}>
                                  {dataset.fileName ||
                                    dataset.sourceName ||
                                    dataset.id}
                                </Typography>
                                {isPublished && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    🔒 Published datasets are read-only.
                                  </Typography>
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell>{dataset.datasetType || "—"}</TableCell>
                            <TableCell>
                              <Chip
                                label={dataset.status}
                                size="small"
                                color={isPublished ? "success" : "default"}
                              />
                            </TableCell>
                            <TableCell>{dataset.rowsCount || 0}</TableCell>
                            <TableCell>{dataset.updatedAt || "—"}</TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() =>
                                  navigate(
                                    `${
                                      isPublished ? "publish" : "map"
                                    }/${encodeURIComponent(dataset.id)}`,
                                  )
                                }
                              >
                                {isPublished ? "View" : "Open"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
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
