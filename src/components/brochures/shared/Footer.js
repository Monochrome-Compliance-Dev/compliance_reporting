import { Box, Typography, useTheme } from "@mui/material";

const BrochureFooter = ({
  title = "Monochrome Compliance. Powered by AWS.",
  subtitle,
  legalReference = "Compliant with the Modern Slavery Act 2018 (Cth).",
}) => {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        borderTop: `1px solid ${
          theme.palette.mode === "light"
            ? theme.palette.grey[300]
            : theme.palette.grey[700]
        }`,
        mt: 6,
        pt: 2,
        textAlign: "center",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} {title} {subtitle} {legalReference}
      </Typography>
    </Box>
  );
};

export default BrochureFooter;
