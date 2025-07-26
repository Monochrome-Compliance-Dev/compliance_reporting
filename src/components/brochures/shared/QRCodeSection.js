import { Box, Typography } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { useTheme } from "@mui/material/styles";

const QRCodeSection = ({ codes }) => {
  const theme = useTheme();
  if (!codes || codes.length === 0) return null;

  return (
    <Box mt={6} display="flex" gap={8} flexWrap="wrap" justifyContent="center">
      {codes.map(({ label, value }) => (
        <Box
          key={value}
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <QRCodeSVG value={value} size={128} />
          <Typography
            variant="body2"
            mt={2}
            sx={{ color: theme.palette.text.primary }}
          >
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default QRCodeSection;
