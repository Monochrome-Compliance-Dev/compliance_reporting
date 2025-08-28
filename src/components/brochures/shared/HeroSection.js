import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const HeroSection = ({ title, subtitle, backgroundImage }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        mb: 4,
        minHeight: { xs: 180, sm: 220, md: 300 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundColor:
            theme.palette.mode === "light"
              ? "rgba(0, 0, 0, 0.6)"
              : "rgba(0, 0, 0, 0.6)",
          inset: 0,
          zIndex: 1,
        }}
      />
      <Box sx={{ zIndex: 2, px: 2, textAlign: "center" }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
            color: theme.palette.common.white,
            mb: 2,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.common.white,
              maxWidth: 800,
              mx: "auto",
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default HeroSection;
