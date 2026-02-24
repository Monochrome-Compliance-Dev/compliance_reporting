import { Box, Typography } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";

export const EmailQRCode = () => (
  <Box textAlign="center">
    <Typography variant="subtitle1" sx={{ mb: 1 }}>
      Send us an email
    </Typography>
    <QRCodeSVG value="mailto:contact@monochrome-compliance.com" />
  </Box>
);

export const WebsiteQRCode = () => (
  <Box textAlign="center">
    <Typography variant="subtitle1" sx={{ mb: 1 }}>
      Visit our website
    </Typography>
    <QRCodeSVG value="https://www.monochrome-compliance.com" />
  </Box>
);

export const ContactFormQRCode = () => (
  <Box textAlign="center">
    <Typography variant="subtitle1" sx={{ mb: 1 }}>
      Contact Form
    </Typography>
    <QRCodeSVG value="https://www.monochrome-compliance.com/contact" />
  </Box>
);
