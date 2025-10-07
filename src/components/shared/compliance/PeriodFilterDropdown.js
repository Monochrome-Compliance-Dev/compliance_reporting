import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

export function PeriodFilterDropdown({ periods, selectedPeriod, onChange }) {
  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel id="period-select-label">Reporting Period</InputLabel>
      <Select
        labelId="period-select-label"
        value={selectedPeriod ?? "all"}
        label="Reporting Period"
        onChange={onChange}
      >
        {[{ id: "all", name: "All Periods" }, ...(periods || [])].map(
          (period) => (
            <MenuItem key={period.id} value={period.id}>
              {period.name}
            </MenuItem>
          )
        )}
      </Select>
    </FormControl>
  );
}
