import {
  Box,
  Typography,
  Divider,
  useTheme,
  ImageList,
  ImageListItem,
} from "@mui/material";

const solutions = [
  {
    title: "Compliance Base",
    subtitle: "Stress-free compliance for smaller businesses",
    body: `Ideal for companies under $5M turnover, Compliance Base delivers peace of mind without the overhead. We handle the essential obligations like Payment Times Reporting, Modern Slavery, and Director Disclosures so your internal teams can stay focused. No chasing deadlines. No wrestling with templates. Just effortless, always-on compliance.`,
    imagePosition: "left",
    image: "/images/solutions/Happy-corporate-customer.jpg",
  },
  {
    title: "Compliance Growth",
    subtitle: "Scaling compliance with your operations",
    body: `Designed for growing businesses, this plan wraps automation, guidance, and accountability into a single, powerful platform. You get unlimited obligation coverage, Whistleblower and ESG support, and quarterly dashboards so your execs can sleep at night. We even include advisory support to make sure nothing falls through the cracks.`,
    imagePosition: "right",
    image: "/images/solutions/compliance.jpg",
  },
  {
    title: "Compliance Executive",
    subtitle: "Enterprise-grade assurance for complex environments",
    body: `For large or listed organisations, this tier offers full-spectrum coverage. From supplier risk scoring and policy reviews to board-ready reporting and 24-hour SLAs, we become your compliance command centre. No gaps. No ambiguity. Just clear, defensible delivery of everything regulators and stakeholders expect.`,
    imagePosition: "left",
    image: "/images/solutions/lists.jpg",
  },
];

export default function Solutions() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: theme.spacing(6),
        px: { xs: 2, sm: 4, md: 8 },
        backgroundColor: theme.palette.background.default,
      }}
    >
      {solutions.map((solution, index) => {
        const isImageLeft = solution.imagePosition === "left";
        return (
          <Box key={index} sx={{ mb: theme.spacing(6) }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: {
                  xs: "column",
                  md: isImageLeft ? "row" : "row-reverse",
                },
                alignItems: "center",
                gap: theme.spacing(4),
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  minHeight: 200,
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: { xs: 265, md: 275 },
                  overflow: "hidden",
                }}
              >
                <Box
                  component="img"
                  src={solution.image}
                  alt={solution.title}
                  loading="lazy"
                  sx={{
                    width: { xs: 450, md: 475 },
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 2,
                    display: "block",
                    maxWidth: "100%",
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" gutterBottom>
                  {solution.title}
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  gutterBottom
                >
                  {solution.subtitle}
                </Typography>
                <Typography variant="body1">{solution.body}</Typography>
              </Box>
            </Box>
            {index < solutions.length - 1 && (
              <Divider sx={{ my: theme.spacing(6) }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
