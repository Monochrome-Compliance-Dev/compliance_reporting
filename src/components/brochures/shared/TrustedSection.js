import { Box, Typography } from "@mui/material";

const TrustedSection = ({ trustedSection }) => {
  const { intro, clients = [] } = trustedSection;
  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h6" gutterBottom>
        Trusted by Compliance Leaders
      </Typography>
      <Typography variant="body2" paragraph>
        {intro}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
        {clients.map((client, idx) => (
          <img
            key={idx}
            src={client.src}
            alt={client.alt}
            style={{ height: 32 }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default TrustedSection;
