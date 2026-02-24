import { Card, CardContent, Grid, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router";

export function DashboardCards({ cards }) {
  const navigate = useNavigate();

  return (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      {cards.map(({ title, value, subtitle, href, period }, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Box
            onClick={() => navigate(href, { state: { period: period } })}
            sx={{
              cursor: "pointer",
              transition: "transform 0.2s",
              "&:hover": { transform: "scale(1.02)" },
            }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6">{title}</Typography>
                <Typography variant="h4">{value}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
