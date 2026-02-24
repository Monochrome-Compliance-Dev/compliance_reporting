import { Box, Typography } from "@mui/material";
import { EmailQRCode, WebsiteQRCode } from "../../static/QRCodes";

const QRCodeSection = ({ codes }) => {
  if (!codes || codes.length === 0) return null;

  return (
    <Box sx={{ textAlign: "center", mt: 6 }}>
      <Typography variant="h6" gutterBottom>
        Want to learn more?
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 4, mt: 2 }}>
        <EmailQRCode style={{ height: 100 }} />
        <WebsiteQRCode style={{ height: 100 }} />
      </Box>
    </Box>
  );
};

export default QRCodeSection;
