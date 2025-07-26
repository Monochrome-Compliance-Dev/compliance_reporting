import { Box, Typography } from "@mui/material";

const BrochureLayout = ({ title, subtitle, children }) => {
  return (
    <Box>
      <Typography variant="h3" align="center" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="subtitle1" align="center" gutterBottom>
          {subtitle}
        </Typography>
      )}
      {children}
    </Box>
  );
};

export default BrochureLayout;
