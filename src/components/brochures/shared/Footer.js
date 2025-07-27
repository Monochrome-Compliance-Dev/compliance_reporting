import { Box, Typography, useTheme } from "@mui/material";

const BrochureFooter = ({
  title = "Monochrome Compliance. Powered by AWS.",
  subtitle,
  legalReference = "Compliant with the Modern Slavery Act 2018 (Cth).",
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        mt: 6,
        pt: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
        textAlign: "center",
      }}
    >
      <Typography variant="caption" color="textSecondary">
        © {new Date().getFullYear()} {title} {subtitle} {legalReference}
      </Typography>
    </Box>
  );
};

export default BrochureFooter;
