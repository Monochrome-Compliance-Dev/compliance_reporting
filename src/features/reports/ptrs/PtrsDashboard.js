import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  useTheme,
} from "@mui/material";

const PTRS_METRICS = {
  invoicesPaidWithin30Days: 61.52,
  valuePaidWithin30Days: 67.57,
  avgPaymentTime: 35.46,
  medianPaymentTime: 27.0,
  percentile80: 45,
  percentile95: 75,
  sbNumPayments: 41.15,
  sbValuePayments: 35.46,
  sbPeppolNum: 0.0,
  sbPeppolValue: 0.0,
};

const StatCard = ({ title, value }) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        minWidth: 140,
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        p: 2,
        boxShadow: theme.shadows[1],
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Typography
          variant="body2"
          color={theme.palette.text.secondary}
          sx={{ mb: 1 }}
        >
          {title}
        </Typography>
        <Typography variant="h5" color={theme.palette.success.main}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default function PtrsDashboard() {
  const theme = useTheme();
  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ color: theme.palette.text.primary, mb: 3 }}
      >
        PTRS Dashboard
      </Typography>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Invoices paid within 30 days"
            value={`${PTRS_METRICS.invoicesPaidWithin30Days}%`}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Value of invoices paid within 30 days"
            value={`${PTRS_METRICS.valuePaidWithin30Days}%`}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard
            title="Average payment time"
            value={`${PTRS_METRICS.avgPaymentTime} days`}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard
            title="Median payment time"
            value={`${PTRS_METRICS.medianPaymentTime} days`}
          />
        </Grid>
        <Grid item xs={6} md={1}>
          <StatCard title="80th" value={`${PTRS_METRICS.percentile80} d`} />
        </Grid>
        <Grid item xs={6} md={1}>
          <StatCard title="95th" value={`${PTRS_METRICS.percentile95} d`} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3, borderColor: theme.palette.divider }} />

      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ color: theme.palette.text.primary, mb: 2 }}
      >
        Proportion of Small Business Spend
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              p: 2,
              boxShadow: theme.shadows[1],
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mb: 1 }}
              >
                # Small Business Payments
              </Typography>
              <Typography
                variant="h5"
                sx={{ color: theme.palette.text.primary }}
              >
                {PTRS_METRICS.sbNumPayments}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              p: 2,
              boxShadow: theme.shadows[1],
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mb: 1 }}
              >
                Value of SB Payments
              </Typography>
              <Typography
                variant="h5"
                sx={{ color: theme.palette.text.primary }}
              >
                {PTRS_METRICS.sbValuePayments}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              p: 2,
              boxShadow: theme.shadows[1],
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mb: 1 }}
              >
                % Peppol-enabled SB (Num)
              </Typography>
              <Typography
                variant="h5"
                sx={{ color: theme.palette.text.primary }}
              >
                {PTRS_METRICS.sbPeppolNum}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              p: 2,
              boxShadow: theme.shadows[1],
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mb: 1 }}
              >
                % Peppol-enabled SB (Value)
              </Typography>
              <Typography
                variant="h5"
                sx={{ color: theme.palette.text.primary }}
              >
                {PTRS_METRICS.sbPeppolValue}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4, borderColor: theme.palette.divider }} />

      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ color: theme.palette.text.primary, mb: 2 }}
      >
        Visual Trends & Analysis
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              p: 2,
              boxShadow: theme.shadows[1],
            }}
          >
            <CardContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Payment Distribution
              </Typography>
              {/* Mock bar chart */}
              <Box
                sx={{
                  height: 200,
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "flex-end",
                  pb: 2,
                }}
              >
                {[45, 20, 35].map((value, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      width: "20%",
                      height: `${value}%`,
                      backgroundColor: theme.palette.success.main,
                      borderRadius: 1,
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              p: 2,
              boxShadow: theme.shadows[1],
            }}
          >
            <CardContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                SB Spend Breakdown
              </Typography>
              {/* Mock pie chart */}
              <Box
                sx={{
                  height: 200,
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    background: `conic-gradient(${theme.palette.success.main} 35%, ${theme.palette.grey[300]} 0)`,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    position: "absolute",
                    color: theme.palette.text.primary,
                  }}
                >
                  35%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
