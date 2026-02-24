import { useState, useEffect, useMemo } from "react";
import { StandardTable } from "../../components/shared/compliance/StandardTable";
import { Typography, Box, Button } from "@mui/material";
import { msService } from "../../services/ms/ms";
import { LoadingSpinner } from "../../components/ui";
import { supplierRiskFields } from "./msTableConfigs";

function MsSupplierRisks() {
  const [supplierRisks, setSupplierRisks] = useState([]);

  useEffect(() => {
    msService.getSupplierRisks().then((data) => {
      if (Array.isArray(data)) setSupplierRisks(data);
      else console.warn("Unexpected response:", data);
    });
  }, []);

  const columns = useMemo(
    () =>
      [
        { label: "Supplier Name", key: "name" },
        { label: "Country", key: "country" },
        { label: "Risk Level", key: "risk" },
        { label: "Last Reviewed", key: "reviewed" },
      ] || [],
    []
  );

  if (!supplierRisks) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Supplier Risks
      </Typography>
      <Button onClick={() => console.log("Add clicked")} sx={{ mb: 2 }}>
        Add Supplier Risk
      </Button>
      <StandardTable
        rows={Array.isArray(supplierRisks) ? supplierRisks : []}
        columns={Array.isArray(columns) ? columns : []}
        onEdit={(row) => console.log("Edit", row)}
        onDelete={(row) => console.log("Delete", row)}
        fields={supplierRiskFields}
      />
    </Box>
  );
}

export default MsSupplierRisks;
