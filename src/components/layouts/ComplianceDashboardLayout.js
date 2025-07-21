import { Box, Typography } from "@mui/material";
import { PeriodFilterDropdown } from "../shared/compliance/PeriodFilterDropdown";
import { cloneElement, useEffect, useState } from "react";
import { esgService, msService } from "../../services/";

export default function ComplianceDashboardLayout({ title, children, module }) {
  const [reportingPeriods, setReportingPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  useEffect(() => {
    if (module === "ms") {
      msService
        .getReportingPeriods()
        .then(setReportingPeriods)
        .catch(console.error);
    } else if (module === "esg") {
      esgService
        .getReportingPeriods()
        .then(setReportingPeriods)
        .catch(console.error);
    }
  }, [module]);

  return (
    <Box px={4} mt={3}>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
        mb={3}
        width="100%"
      >
        <Typography variant="h4" fontWeight="600" gutterBottom>
          {title}
        </Typography>
        {reportingPeriods?.length > 0 && (
          <PeriodFilterDropdown
            periods={reportingPeriods}
            selectedPeriod={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          />
        )}
      </Box>
      {cloneElement(children, {
        selectedPeriod,
        reportingPeriods,
      })}
    </Box>
  );
}
