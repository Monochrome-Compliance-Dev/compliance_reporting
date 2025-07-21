import { useState, useEffect } from "react";
import { StandardTable } from "../../components/shared/compliance/StandardTable";
import { Typography, Box, Button } from "@mui/material";
import { msService } from "../../services/ms/ms";

function MsSupplierRisks() {
  const [supplierRisks, setSupplierRisks] = useState([]);

  useEffect(() => {
    msService.getSupplierRisks().then((data) => {
      if (Array.isArray(data)) setSupplierRisks(data);
      else console.warn("Unexpected response:", data);
    });
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Supplier Risks
      </Typography>
      <Button onClick={() => console.log("Add clicked")} sx={{ mb: 2 }}>
        Add Supplier Risk
      </Button>
      <StandardTable
        rows={supplierRisks}
        columns={[
          { label: "Supplier Name", key: "name" },
          { label: "Country", key: "country" },
          { label: "Risk Level", key: "risk" },
          { label: "Last Reviewed", key: "reviewed" },
        ]}
        onEdit={(row) => console.log("Edit", row)}
        onDelete={(row) => console.log("Delete", row)}
      />
    </Box>
  );
}

export default MsSupplierRisks;
