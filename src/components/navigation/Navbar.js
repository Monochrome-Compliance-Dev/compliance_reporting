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
import { userService } from "../../services";
import { useAuthContext } from "../../context/AuthContext";

const isPublicOnlyMode =
  String(process.env.REACT_APP_PUBLIC_ONLY).toLowerCase() === "true";

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
  const navigate = useNavigate();
  const location = useLocation();

  const isMarketingRoute =
    location.pathname === "/" ||
    location.pathname.startsWith("/payment-times-reporting") ||
    location.pathname.startsWith("/pricing") ||
    location.pathname.startsWith("/about") ||
    location.pathname.startsWith("/contact");

  const showPublicMarketingNav = isPublicOnlyMode || isMarketingRoute;

  const isLoggedIn = Boolean(user);
  const hideNavLinks =
    !showPublicMarketingNav &&
    (location.pathname.includes("/dashboard") ||
      location.pathname.includes("/data") ||
      location.pathname.includes("/report"));

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
          {showPublicMarketingNav && (
            <Box sx={{ display: "contents" }}>
              <MenuItem
                onClick={handleMenuClose}
                component={Link}
                to="/payment-times-reporting"
                sx={{ color: theme.palette.text.primary }}
              >
                Payment Times Reporting
              </MenuItem>
              <MenuItem
                onClick={handleMenuClose}
                component={Link}
                to="/pricing"
                sx={{ color: theme.palette.text.primary }}
              >
                Pricing
              </MenuItem>
              <MenuItem
                onClick={handleMenuClose}
                component={Link}
                to="/contact"
                sx={{ color: theme.palette.text.primary }}
              >
                Contact
              </MenuItem>
              <MenuItem
                onClick={handleMenuClose}
                component={Link}
                to="/about"
                sx={{ color: theme.palette.text.primary }}
              >
                About
              </MenuItem>
            </Box>
          )}
          {isLoggedIn && !showPublicMarketingNav && !isPublicOnlyMode && (
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
                  to="/blog"
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
            {isLoggedIn && !showPublicMarketingNav && !isPublicOnlyMode && (
              <MenuItem
                onClick={handleMenuClose}
                component={Link}
                to="/v2/dashboard"
                sx={{ color: theme.palette.text.primary }}
              >
                <WorkOutlineIcon sx={{ fontSize: 20, mr: 1 }} />
                Open Workspace
              </MenuItem>
            )}
            <Divider />
            {showPublicMarketingNav && (
              <Box sx={{ display: "contents" }}>
                <MenuItem
                  onClick={handleMenuClose}
                  component={Link}
                  to="/payment-times-reporting"
                  sx={{ color: theme.palette.text.primary }}
                >
                  Payment Times Reporting
                </MenuItem>
                <MenuItem
                  onClick={handleMenuClose}
                  component={Link}
                  to="/pricing"
                  sx={{ color: theme.palette.text.primary }}
                >
                  Pricing
                </MenuItem>
                <MenuItem
                  onClick={handleMenuClose}
                  component={Link}
                  to="/contact"
                  sx={{ color: theme.palette.text.primary }}
                >
                  Contact
                </MenuItem>
                <MenuItem
                  onClick={handleMenuClose}
                  component={Link}
                  to="/about"
                  sx={{ color: theme.palette.text.primary }}
                >
                  About
                </MenuItem>
              </Box>
            )}
          </Menu>
        </Box>
        {showPublicMarketingNav && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/contact")}
            sx={{
              ml: 2,
              fontWeight: 600,
              display: { xs: "none", md: "inline-flex" },
            }}
          >
            Book a Call
          </Button>
        )}
        {isLoggedIn && !showPublicMarketingNav && !isPublicOnlyMode && (
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={() => navigate("/v2/dashboard")}
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
        {!isPublicOnlyMode && !isLoggedIn && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate("/login")}
            sx={{ ml: 2, fontWeight: 600 }}
          >
            Login
          </Button>
        )}
        {isLoggedIn && !showPublicMarketingNav && !isPublicOnlyMode && (
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
