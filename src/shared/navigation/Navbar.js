import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Menu,
  MenuItem,
  Chip,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import Divider from "@mui/material/Divider";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GavelIcon from "@mui/icons-material/Gavel";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import WarningIcon from "@mui/icons-material/Warning";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ForestIcon from "@mui/icons-material/Forest";
import HandshakeIcon from "@mui/icons-material/Handshake";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ArticleIcon from "@mui/icons-material/Article";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { Link, useNavigate, useLocation } from "react-router";
import { useTheme } from "@mui/material/styles";
import { useAuthContext } from "context";
import { userService } from "slices/users/userApi";

export default function Navbar({ isDarkTheme, onToggleTheme }) {
  const { user } = useAuthContext();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [gettingStartedAnchor, setGettingStartedAnchor] = useState(null);
  const [connectAnchor, setConnectAnchor] = useState(null);
  const [partnersAnchor, setPartnersAnchor] = useState(null);
  const handlePartnersOpen = (event) => setPartnersAnchor(event.currentTarget);
  const handlePartnersClose = () => setPartnersAnchor(null);
  const [adminAnchor, setAdminAnchor] = useState(null);
  const [solutionsAnchor, setSolutionsAnchor] = useState(null);
  const handleSolutionsOpen = (event) =>
    setSolutionsAnchor(event.currentTarget);
  const handleSolutionsClose = () => setSolutionsAnchor(null);
  const [companyAnchor, setCompanyAnchor] = useState(null);
  const handleCompanyOpen = (event) => setCompanyAnchor(event.currentTarget);
  const handleCompanyClose = () => setCompanyAnchor(null);
  const [productsAnchor, setProductsAnchor] = useState(null);
  const handleProductsOpen = (event) => setProductsAnchor(event.currentTarget);
  const handleProductsClose = () => setProductsAnchor(null);
  const [pulseAnchor, setPulseAnchor] = useState(null);
  const [exploreAnchor, setExploreAnchor] = useState(null);
  const handleExploreOpen = (event) => setExploreAnchor(event.currentTarget);
  const handleExploreClose = () => setExploreAnchor(null);
  const handlePulseOpen = (event) => setPulseAnchor(event.currentTarget);
  const handlePulseClose = () => setPulseAnchor(null);
  const handleConnectOpen = (event) => setConnectAnchor(event.currentTarget);
  const handleConnectClose = () => setConnectAnchor(null);
  const handleAdminOpen = (event) => setAdminAnchor(event.currentTarget);
  const handleAdminClose = () => setAdminAnchor(null);
  const [insightsAnchor, setInsightsAnchor] = useState(null);
  const handleInsightsOpen = (event) => setInsightsAnchor(event.currentTarget);
  const handleInsightsClose = () => setInsightsAnchor(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isPublicOnlyMode =
    String(process.env.REACT_APP_PUBLIC_ONLY).toLowerCase() === "true";
  const isAuthEnabled = !isPublicOnlyMode;

  const isMarketingRoute = !location.pathname.startsWith("/app");

  const isLoggedIn = isAuthEnabled && Boolean(user);
  const hideNavLinks =
    !isMarketingRoute &&
    (location.pathname.includes("/app") ||
      location.pathname.includes("/ptrs") ||
      location.pathname.includes("/pulse"));

  // Shared marketing nav definition
  const marketingNav = {
    solutions: [
      { label: "Payment Times Reporting", to: "/payment-times-reporting" },
      { label: "Construction PTRS", to: "/construction-payment-reporting" },
    ],
    links: [{ label: "Pricing", to: "/pricing" }],
    company: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
    ],
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleGettingStartedOpen = (event) =>
    setGettingStartedAnchor(event.currentTarget);
  const handleGettingStartedClose = () => setGettingStartedAnchor(null);

  const handleLogout = async () => {
    try {
      userService.logout();
      handleMenuClose();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error); // Log the error
      alert("Failed to log out. Please try again."); // Display a user-friendly message
    }
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: theme.palette.background.navbar,
        color: theme.palette.text.primary,
        backgroundImage: "none", // Explicitly remove the gradient
        width: "100%",
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            color: theme.palette.text.primary,
          }}
        >
          <Box
            component="img"
            src={
              isDarkTheme
                ? // ? "/images/logos/logo-dark-thin.png"
                  "https://monochrome-assets.s3.ap-southeast-2.amazonaws.com/logo-dark-no-background.png"
                : "https://monochrome-assets.s3.ap-southeast-2.amazonaws.com/logo-light-no-background.png"
            }
            alt="Monochrome Compliance Logo"
            sx={{
              height: "auto",
              maxWidth: { xs: "200px", md: "300px" },
              width: "100%",
              objectFit: "contain",
              mt: 1.5,
              mb: 0.5,
              ml: -1.5,
              cursor: "pointer",
              "&:hover": {
                opacity: 0.8,
              },
            }}
            onClick={() => {
              navigate("/");
            }}
          />
        </Typography>
        <Box sx={{ display: { xs: "none", md: "flex" } }}>
          {isMarketingRoute && (
            <Box sx={{ display: "contents" }}>
              <Button
                color="inherit"
                onClick={handleSolutionsOpen}
                sx={{
                  color: theme.palette.text.primary,
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: theme.typography.body1.fontSize,
                }}
                endIcon={<ExpandMoreIcon />}
              >
                Solutions
              </Button>
              <Menu
                anchorEl={solutionsAnchor}
                open={Boolean(solutionsAnchor)}
                onClose={handleSolutionsClose}
                sx={{ mt: 1 }}
              >
                {marketingNav.solutions.map((item) => (
                  <MenuItem
                    key={item.to}
                    onClick={() => {
                      handleSolutionsClose();
                      handleMenuClose();
                    }}
                    component={Link}
                    to={item.to}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>

              <Button
                color="inherit"
                onClick={handleInsightsOpen}
                sx={{
                  color: theme.palette.text.primary,
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: theme.typography.body1.fontSize,
                }}
                endIcon={<ExpandMoreIcon />}
              >
                Insights
              </Button>
              <Menu
                anchorEl={insightsAnchor}
                open={Boolean(insightsAnchor)}
                onClose={handleInsightsClose}
                sx={{ mt: 1 }}
              >
                <MenuItem
                  onClick={() => {
                    handleInsightsClose();
                    handleMenuClose();
                  }}
                  component={Link}
                  to="/insights"
                >
                  Industry Insights
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleInsightsClose();
                    handleMenuClose();
                  }}
                  component={Link}
                  to="/insights/blog"
                >
                  Blog
                </MenuItem>
              </Menu>

              {marketingNav.links.map((item) => (
                <Button
                  key={item.to}
                  color="inherit"
                  component={Link}
                  to={item.to}
                  onClick={handleMenuClose}
                  sx={{
                    color: theme.palette.text.primary,
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: theme.typography.body1.fontSize,
                  }}
                >
                  {item.label}
                </Button>
              ))}

              <Button
                color="inherit"
                onClick={handleCompanyOpen}
                sx={{
                  color: theme.palette.text.primary,
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: theme.typography.body1.fontSize,
                }}
                endIcon={<ExpandMoreIcon />}
              >
                Company
              </Button>
              <Menu
                anchorEl={companyAnchor}
                open={Boolean(companyAnchor)}
                onClose={handleCompanyClose}
                sx={{ mt: 1 }}
              >
                {marketingNav.company.map((item) => (
                  <MenuItem
                    key={item.to}
                    onClick={() => {
                      handleCompanyClose();
                      handleMenuClose();
                    }}
                    component={Link}
                    to={item.to}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}
          {isLoggedIn && !isMarketingRoute && (
            <Box sx={{ display: "contents" }}>
              <Button
                color="inherit"
                onClick={handleExploreOpen}
                sx={{
                  color: theme.palette.text.secondary,
                  alignItems: "center",
                }}
                endIcon={<ExpandMoreIcon />}
              >
                Explore
              </Button>
              <Menu
                anchorEl={exploreAnchor}
                open={Boolean(exploreAnchor)}
                onClose={handleExploreClose}
                sx={{ mt: 1 }}
              >
                {/* Pulse */}
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/pulse"
                >
                  <AutoGraphIcon sx={{ fontSize: 20, mr: 1 }} />
                  Pulse Overview
                </MenuItem>
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/pulse/pricing"
                >
                  <PriceCheckIcon sx={{ fontSize: 20, mr: 1 }} />
                  Pulse Pricing
                </MenuItem>
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/pulse/maximiser"
                >
                  <AutoAwesomeIcon sx={{ fontSize: 20, mr: 1 }} />
                  Maximiser (AI)
                  <Chip
                    label="Beta"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                </MenuItem>
                <Divider />
                {/* Solutions */}
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/director-obligations"
                >
                  <SupervisorAccountIcon sx={{ fontSize: 20, mr: 1 }} />
                  Director Obligations
                </MenuItem>
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/esg-reporting"
                >
                  <ForestIcon sx={{ fontSize: 20, mr: 1 }} />
                  ESG Reporting
                </MenuItem>
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/modern-slavery"
                >
                  <GavelIcon sx={{ fontSize: 20, mr: 1 }} />
                  Modern Slavery
                </MenuItem>
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/payment-times-reporting"
                >
                  <AccessTimeIcon sx={{ fontSize: 20, mr: 1 }} />
                  PTR Solution
                </MenuItem>
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/risk-register"
                >
                  <WarningIcon sx={{ fontSize: 20, mr: 1 }} />
                  Risk Register
                </MenuItem>
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/whistleblower-compliance"
                >
                  <RecordVoiceOverIcon sx={{ fontSize: 20, mr: 1 }} />
                  Whistleblower Compliance
                </MenuItem>
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/working-capital"
                >
                  <TrendingUpIcon sx={{ fontSize: 20, mr: 1 }} />
                  Working Capital Analysis
                </MenuItem>
                <Divider />
                {/* Partners */}
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/partners"
                >
                  <HandshakeIcon sx={{ fontSize: 20, mr: 1 }} />
                  Partners Overview
                </MenuItem>
                <Divider />
                {/* Connect */}
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/contact"
                >
                  <MailOutlineIcon sx={{ fontSize: 20, mr: 1 }} />
                  Contact
                </MenuItem>
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/insights"
                >
                  <ArticleIcon sx={{ fontSize: 20, mr: 1 }} />
                  Industry Insights
                </MenuItem>
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/insights/blog"
                >
                  <ArticleIcon sx={{ fontSize: 20, mr: 1 }} />
                  Blog
                </MenuItem>
                <MenuItem
                  onClick={handleExploreClose}
                  component={Link}
                  to="/about"
                >
                  <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
                  About
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
        <Box sx={{ display: { xs: "flex", md: "none" } }}>
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}
            sx={{ color: theme.palette.text.primary }}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            sx={{ backgroundColor: theme.palette.background.paper }}
          >
            {isLoggedIn && !isMarketingRoute && (
              <MenuItem
                onClick={handleMenuClose}
                component={Link}
                to="/app"
                sx={{ color: theme.palette.text.primary }}
              >
                <WorkOutlineIcon sx={{ fontSize: 20, mr: 1 }} />
                Open Workspace
              </MenuItem>
            )}
            <Divider />
            {isMarketingRoute && (
              <Box sx={{ display: "contents" }}>
                {marketingNav.solutions.map((item) => (
                  <MenuItem
                    key={item.to}
                    onClick={handleMenuClose}
                    component={Link}
                    to={item.to}
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {item.label}
                  </MenuItem>
                ))}

                <Divider />

                <MenuItem
                  onClick={handleMenuClose}
                  component={Link}
                  to="/insights"
                  sx={{ color: theme.palette.text.primary }}
                >
                  Industry Insights
                </MenuItem>

                <MenuItem
                  onClick={handleMenuClose}
                  component={Link}
                  to="/insights/blog"
                  sx={{ color: theme.palette.text.primary }}
                >
                  Blog
                </MenuItem>

                <Divider />

                {marketingNav.links.map((item) => (
                  <MenuItem
                    key={item.to}
                    onClick={handleMenuClose}
                    component={Link}
                    to={item.to}
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {item.label}
                  </MenuItem>
                ))}

                {marketingNav.company.map((item) => (
                  <MenuItem
                    key={item.to}
                    onClick={handleMenuClose}
                    component={Link}
                    to={item.to}
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </Box>
            )}
          </Menu>
        </Box>
        {/* Book a Call CTA removed */}
        {isLoggedIn && (
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={() => navigate("/app")}
            startIcon={<WorkOutlineIcon sx={{ fontSize: 18 }} />}
            aria-label="Open workspace"
            sx={{
              ml: 1,
              fontWeight: 600,
              px: 1.25,
              py: 0.5,
              borderColor: theme.palette.divider,
              display: { xs: "none", md: "inline-flex" },
              "&:hover": { borderColor: theme.palette.text.secondary },
            }}
          >
            Workspace
          </Button>
        )}
        {/* Dynamic Login/Logout button */}
        {!isLoggedIn && !isPublicOnlyMode && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate("/login")}
            sx={{ ml: 2, fontWeight: 600 }}
          >
            Login
          </Button>
        )}
        {isLoggedIn && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleLogout}
            sx={{ ml: 2, fontWeight: 600 }}
          >
            Logout
          </Button>
        )}
        <IconButton
          sx={{ ml: 1, color: theme.palette.text.primary }}
          onClick={onToggleTheme}
          color="inherit"
          aria-label="toggle theme"
        >
          {isDarkTheme ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
