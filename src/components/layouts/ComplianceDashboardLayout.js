import { Box, Typography, Breadcrumbs, Link as MuiLink } from "@mui/material";
import { useNavigate, useLocation } from "react-router";
import { PeriodFilterDropdown } from "../shared/compliance/PeriodFilterDropdown";
import { cloneElement, useEffect, useState } from "react";
import { esgService, msService, userService } from "../../services/";
import {
  getCurrentCustomer,
  onCustomerChange,
} from "../../lib/utils/tenantScope";

export default function ComplianceDashboardLayout({ title, children, module }) {
  const [reportingPeriods, setReportingPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [actingFor, setActingFor] = useState(() => getCurrentCustomer());
  const user = userService.userValue;
  const navigate = useNavigate();
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  useEffect(() => {
    const unsubscribe =
      typeof onCustomerChange === "function"
        ? onCustomerChange((cust) => setActingFor(cust))
        : null;
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

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
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
        <MuiLink
          underline="hover"
          color="inherit"
          onClick={() => navigate("/dashboard")}
          sx={{ cursor: "pointer" }}
        >
          Dashboard
        </MuiLink>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          const label =
            module === "ms" && value === "ms"
              ? "Modern Slavery"
              : module === "ptrs" && value === "ptrs"
                ? value.toUpperCase()
                : decodeURIComponent(value)
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());
          return isLast ? (
            <Typography color="text.primary" key={to}>
              {label}
            </Typography>
          ) : (
            <MuiLink
              underline="hover"
              color="inherit"
              onClick={() => navigate(to)}
              key={to}
              sx={{ cursor: "pointer" }}
            >
              {label}
            </MuiLink>
          );
        })}
      </Breadcrumbs>
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
        {user.role === "Boss" && actingFor?.id && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>
            Acting on behalf of: <strong>{actingFor.name}</strong>
          </Typography>
        )}
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
