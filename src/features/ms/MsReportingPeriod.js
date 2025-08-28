import { useEffect } from "react";
import FactoryIcon from "@mui/icons-material/Factory";
import SchoolIcon from "@mui/icons-material/School";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import {
  Button,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useAlert } from "../../context";
import { useNavigate, useParams } from "react-router";
import { msService } from "../../services/ms/ms";

const MsReportingPeriod = () => {
  const theme = useTheme();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const { reportingPeriodId } = useParams();
  // Hardcoded sample progress data by responsible party
  const progressByRole = {
    CFO: 50,
    "Supply Chain GM": 0,
    "ESG Manager": 20,
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const interview =
          await msService.getInterviewResponses(reportingPeriodId);
        console.log("Interview:", interview);
        const risks = await msService.getSupplierRisks(reportingPeriodId);
        console.log("Risks:", risks);
        const training = await msService.getTraining(reportingPeriodId);
        console.log("Training:", training);
        const grievances = await msService.getGrievances(reportingPeriodId);
        console.log("Grievances:", grievances);
      } catch (err) {
        showAlert("Failed to load data", "error");
      }
    };
    loadData();
  }, [reportingPeriodId, showAlert]);

  // Stub: Replace with actual data fetching logic
  const fetchPeriodData = () => {
    // e.g., re-fetch reporting periods or risks
    console.log("fetchPeriodData called");
  };

  const handleGenerateStatement = () => {
    console.log("Generate Modern Slavery Statement clicked");
  };

  return (
    <div>
      {/* Progress summary table grouped by responsible party */}
      <TableContainer
        component={Paper}
        sx={{ maxWidth: 500, mb: theme.spacing(3) }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Responsible Party</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Interview</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(progressByRole).map(([role, percent]) => (
              <TableRow key={role}>
                <TableCell>{role}</TableCell>
                <TableCell>{percent}%</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      navigate(`/ms/${reportingPeriodId}/interview`)
                    }
                  >
                    Complete Interview
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => navigate(`/ms/${reportingPeriodId}/supplier-risks`)}
        sx={{ mb: 2 }}
        startIcon={<FactoryIcon />}
      >
        Manage Supplier Risks (3)
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => navigate(`/ms/${reportingPeriodId}/training`)}
        sx={{ mb: 2 }}
        startIcon={<SchoolIcon />}
      >
        Manage Training Records // count of training records in state
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => navigate(`/ms/${reportingPeriodId}/grievances`)}
        sx={{ mb: 2 }}
        startIcon={<ReportProblemIcon />}
      >
        Manage Grievance Log (3)
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={handleGenerateStatement}
        sx={{ mb: 2 }}
      >
        Generate Modern Slavery Statement
      </Button>
    </div>
  );
};

export default MsReportingPeriod;
