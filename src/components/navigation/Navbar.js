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

  const isLoggedIn = Boolean(user);
  const hideNavLinks =
    location.pathname.includes("/dashboard") ||
    location.pathname.includes("/data") ||
    location.pathname.includes("/report");

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
          {(!isLoggedIn || isPublicOnlyMode) && (
            <>
              {/* Pulse Button and Menu -- now appears before Solutions */}
              <Button
                color="inherit"
                onClick={handlePulseOpen}
                sx={{
                  color: theme.palette.text.primary,
                  display: "flex",
                  alignItems: "center",
                }}
                endIcon={<ExpandMoreIcon />}
              >
                Pulse
                <Chip
                  label="New"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              </Button>
              <Menu
                anchorEl={pulseAnchor}
                open={Boolean(pulseAnchor)}
                onClose={handlePulseClose}
                sx={{ mt: 1 }}
              >
                <MenuItem
                  onClick={handlePulseClose}
                  component={Link}
                  to="/pulse"
                >
                  <AutoGraphIcon sx={{ fontSize: 20, mr: 1 }} />
                  Overview
                </MenuItem>
                <MenuItem
                  onClick={handlePulseClose}
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
                <MenuItem
                  onClick={handlePulseClose}
                  component={Link}
                  to="/pulse/pricing"
                >
                  <PriceCheckIcon sx={{ fontSize: 20, mr: 1 }} />
                  Pricing
                </MenuItem>
              </Menu>
              {/* Solutions Button and Menu */}
              <Button
                color="inherit"
                onClick={handleSolutionsOpen}
                sx={{
                  color: theme.palette.text.primary,
                  display: "flex",
                  alignItems: "center",
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
                <MenuItem
                  onClick={handleSolutionsClose}
                  component={Link}
                  to="/director-obligations"
                >
                  <SupervisorAccountIcon sx={{ fontSize: 20, mr: 1 }} />
                  Director Obligations
                </MenuItem>
                <MenuItem
                  onClick={handleSolutionsClose}
                  component={Link}
                  to="/esg-reporting"
                >
                  <ForestIcon sx={{ fontSize: 20, mr: 1 }} />
                  ESG Reporting
                </MenuItem>
                <MenuItem
                  onClick={handleSolutionsClose}
                  component={Link}
                  to="/modern-slavery"
                >
                  <GavelIcon sx={{ fontSize: 20, mr: 1 }} />
                  Modern Slavery
                </MenuItem>
                <MenuItem
                  onClick={handleSolutionsClose}
                  component={Link}
                  to="/payment-times-reporting"
                >
                  <AccessTimeIcon sx={{ fontSize: 20, mr: 1 }} />
                  PTR Solution
                </MenuItem>
                <MenuItem
                  onClick={handleSolutionsClose}
                  component={Link}
                  to="/risk-register"
                >
                  <WarningIcon sx={{ fontSize: 20, mr: 1 }} />
                  Risk Register
                </MenuItem>
                <MenuItem
                  onClick={handleSolutionsClose}
                  component={Link}
                  to="/whistleblower-compliance"
                >
                  <RecordVoiceOverIcon sx={{ fontSize: 20, mr: 1 }} />
                  Whistleblower Compliance
                </MenuItem>
                <MenuItem
                  onClick={handleSolutionsClose}
                  component={Link}
                  to="/working-capital"
                >
                  <TrendingUpIcon sx={{ fontSize: 20, mr: 1 }} />
                  Working Capital Analysis
                </MenuItem>
              </Menu>
              {/* Products Button and Menu */}
              <Button
                color="inherit"
                onClick={handleProductsOpen}
                sx={{
                  color: theme.palette.text.primary,
                  display: "flex",
                  alignItems: "center",
                }}
                endIcon={<ExpandMoreIcon />}
              >
                Products
              </Button>
              <Menu
                anchorEl={productsAnchor}
                open={Boolean(productsAnchor)}
                onClose={handleProductsClose}
                sx={{ mt: 1 }}
              >
                <MenuItem
                  onClick={handleProductsClose}
                  component={Link}
                  to="/director-obligations"
                >
                  <SupervisorAccountIcon sx={{ fontSize: 20, mr: 1 }} />
                  Director Obligations
                </MenuItem>
                <MenuItem
                  onClick={handleProductsClose}
                  component={Link}
                  to="/esg-reporting"
                >
                  <ForestIcon sx={{ fontSize: 20, mr: 1 }} />
                  ESG Reporting
                </MenuItem>
                <MenuItem
                  onClick={handleProductsClose}
                  component={Link}
                  to="/modern-slavery"
                >
                  <GavelIcon sx={{ fontSize: 20, mr: 1 }} />
                  Modern Slavery
                </MenuItem>
                <MenuItem
                  onClick={handleProductsClose}
                  component={Link}
                  to="/payment-times-reporting"
                >
                  <AccessTimeIcon sx={{ fontSize: 20, mr: 1 }} />
                  PTR Solution
                </MenuItem>
                <MenuItem
                  onClick={handleProductsClose}
                  component={Link}
                  to="/risk-register"
                >
                  <WarningIcon sx={{ fontSize: 20, mr: 1 }} />
                  Risk Register
                </MenuItem>
                <MenuItem
                  onClick={handleProductsClose}
                  component={Link}
                  to="/whistleblower-compliance"
                >
                  <RecordVoiceOverIcon sx={{ fontSize: 20, mr: 1 }} />
                  Whistleblower Compliance
                </MenuItem>
                <MenuItem
                  onClick={handleProductsClose}
                  component={Link}
                  to="/working-capital"
                >
                  <TrendingUpIcon sx={{ fontSize: 20, mr: 1 }} />
                  Working Capital Analysis
                </MenuItem>
              </Menu>
              {/* <Button
            color="inherit"
            onClick={handleGettingStartedOpen}
            sx={{
              color: theme.palette.text.primary,
              display: "flex",
              alignItems: "center",
            }}
            endIcon={<ExpandMoreIcon />}
          >
            Getting Started
          </Button>
          <Menu
            anchorEl={gettingStartedAnchor}
            open={Boolean(gettingStartedAnchor)}
            onClose={handleGettingStartedClose}
            sx={{ mt: 1 }}
          >
            <MenuItem
              onClick={handleGettingStartedClose}
              component={Link}
              to="/overview"
            >
              <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
              Overview
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={handleGettingStartedClose}
              component={Link}
              to="/resources"
            >
              <FolderIcon sx={{ fontSize: 20, mr: 1 }} />
              Resources
            </MenuItem>
            <MenuItem
              onClick={handleGettingStartedClose}
              component={Link}
              to="/faq"
            >
              <HelpOutlineIcon sx={{ fontSize: 20, mr: 1 }} />
              FAQ
            </MenuItem>
          </Menu> */}
              <Button
                color="inherit"
                onClick={handlePartnersOpen}
                sx={{
                  color: theme.palette.text.primary,
                  display: "flex",
                  alignItems: "center",
                }}
                endIcon={<ExpandMoreIcon />}
              >
                Partners
              </Button>
              <Menu
                anchorEl={partnersAnchor}
                open={Boolean(partnersAnchor)}
                onClose={handlePartnersClose}
                sx={{ mt: 1 }}
              >
                <MenuItem
                  onClick={handlePartnersClose}
                  component={Link}
                  to="/partners"
                >
                  <HandshakeIcon sx={{ fontSize: 20, mr: 1 }} />
                  Overview
                </MenuItem>
                <MenuItem
                  onClick={handlePartnersClose}
                  component={Link}
                  to="/partners/products/modern-slavery"
                >
                  <GavelIcon sx={{ fontSize: 20, mr: 1 }} />
                  Modern Slavery
                </MenuItem>
              </Menu>
              <Button
                color="inherit"
                onClick={handleConnectOpen}
                sx={{
                  color: theme.palette.text.primary,
                  display: "flex",
                  alignItems: "center",
                }}
                endIcon={<ExpandMoreIcon />}
              >
                Connect
              </Button>
              <Menu
                anchorEl={connectAnchor}
                open={Boolean(connectAnchor)}
                onClose={handleConnectClose}
                sx={{ mt: 1 }}
              >
                <MenuItem
                  onClick={handleConnectClose}
                  component={Link}
                  to="/contact"
                >
                  <MailOutlineIcon sx={{ fontSize: 20, mr: 1 }} />
                  Contact
                </MenuItem>
                <MenuItem
                  onClick={handleConnectClose}
                  component={Link}
                  to="/blog"
                >
                  <ArticleIcon sx={{ fontSize: 20, mr: 1 }} />
                  Blog
                </MenuItem>
                <MenuItem
                  onClick={handleConnectClose}
                  component={Link}
                  to="/about"
                >
                  <InfoIcon sx={{ fontSize: 20, mr: 1 }} />
                  About
                </MenuItem>
              </Menu>{" "}
            </>
          )}
          {isLoggedIn && !isPublicOnlyMode && (
            <>
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
            </>
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
            {isLoggedIn && !isPublicOnlyMode && (
              <MenuItem
                onClick={handleMenuClose}
                component={Link}
                to="/dashboard"
                sx={{ color: theme.palette.text.primary }}
              >
                <WorkOutlineIcon sx={{ fontSize: 20, mr: 1 }} />
                Open Workspace
              </MenuItem>
            )}
            <Divider />
            {/* Pulse section */}
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/pulse"
              sx={{ color: theme.palette.text.primary }}
            >
              Pulse
              <Chip
                label="New"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/pulse/pricing"
              sx={{ color: theme.palette.text.primary }}
            >
              Pulse Pricing
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/pulse/maximiser"
              sx={{ color: theme.palette.text.primary }}
            >
              Pulse Maximiser
              <Chip
                label="Beta"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </MenuItem>
            <Divider />
            {/* Solutions section */}
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/director-obligations"
              sx={{ color: theme.palette.text.primary }}
            >
              <SupervisorAccountIcon sx={{ fontSize: 20, mr: 1 }} />
              Director Obligations
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/esg-reporting"
              sx={{ color: theme.palette.text.primary }}
            >
              <ForestIcon sx={{ fontSize: 20, mr: 1 }} />
              ESG Reporting
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/modern-slavery"
              sx={{ color: theme.palette.text.primary }}
            >
              <GavelIcon sx={{ fontSize: 20, mr: 1 }} />
              Modern Slavery
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/payment-times-reporting"
              sx={{ color: theme.palette.text.primary }}
            >
              <AccessTimeIcon sx={{ fontSize: 20, mr: 1 }} />
              PTR Solution
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/risk-register"
              sx={{ color: theme.palette.text.primary }}
            >
              <WarningIcon sx={{ fontSize: 20, mr: 1 }} />
              Risk Register
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/whistleblower-compliance"
              sx={{ color: theme.palette.text.primary }}
            >
              <RecordVoiceOverIcon sx={{ fontSize: 20, mr: 1 }} />
              Whistleblower Compliance
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/working-capital"
              sx={{ color: theme.palette.text.primary }}
            >
              <TrendingUpIcon sx={{ fontSize: 20, mr: 1 }} />
              Working Capital Analysis
            </MenuItem>
            {/* Products section */}
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/director-obligations"
              sx={{ color: theme.palette.text.primary }}
            >
              Director Obligations
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/esg-reporting"
              sx={{ color: theme.palette.text.primary }}
            >
              ESG Reporting
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/modern-slavery"
              sx={{ color: theme.palette.text.primary }}
            >
              Modern Slavery
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/payment-times-reporting"
              sx={{ color: theme.palette.text.primary }}
            >
              PTR Solution
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/risk-register"
              sx={{ color: theme.palette.text.primary }}
            >
              Risk Register
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/whistleblower-compliance"
              sx={{ color: theme.palette.text.primary }}
            >
              Whistleblower Compliance
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/working-capital"
              sx={{ color: theme.palette.text.primary }}
            >
              Working Capital Analysis
            </MenuItem>
            {/* <Divider />
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/overview"
              sx={{ color: theme.palette.text.primary }}
            >
              Overview
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/resources"
              sx={{ color: theme.palette.text.primary }}
            >
              Resources
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/faq"
              sx={{ color: theme.palette.text.primary }}
            >
              FAQ
            </MenuItem> */}
            <Divider />
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
              to="/blog"
              sx={{ color: theme.palette.text.primary }}
            >
              Blog
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/about"
              sx={{ color: theme.palette.text.primary }}
            >
              About
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              component={Link}
              to="/partners"
              sx={{ color: theme.palette.text.primary }}
            >
              Partners
            </MenuItem>
          </Menu>
        </Box>
        {(!isLoggedIn || isPublicOnlyMode) && (
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
        {isLoggedIn && !isPublicOnlyMode && (
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={() => navigate("/dashboard")}
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
        {isLoggedIn && !isPublicOnlyMode && (
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
