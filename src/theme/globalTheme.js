import { createTheme } from "@mui/material/styles";

const lightPalette = {
  primary: { main: "#7c4dff" }, // Accent purple #7c4dff
  secondary: { main: "#6f7e8c" }, // Steel grey #6f7e8c
  background: {
    default: "#f4f6f8", // Background default #f4f6f8
    paper: "#ffffff", // Background paper #ffffff
    navbar: "#e1e5ea", // Navbar background #e1e5ea
  },
  text: {
    primary: "#1e1e1e", // Primary text #1e1e1e
    secondary: "#4d4d4d", // Secondary text #4d4d4d
  },
  action: { hoverOpacity: 0.08 },
};

const darkPalette = {
  primary: { main: "#1e88e5" }, // Mid-blue for dark CTAs #1e88e5
  secondary: { main: "#6f7e8c" }, // Steel grey #6f7e8c
  background: {
    default: "#292940", // Background default #1e1e2f
    paper: "#2b2b3c", // Background paper #2b2b3c
    navbar: "#1e1e2f", // Navbar background #1e1e2f
  },
  text: {
    primary: "#f0f2f5", // Primary text #f0f2f5
    secondary: "#aeb0b5", // Secondary text #aeb0b5
  },
  action: { hoverOpacity: 0.08 },
};

const globalTheme = (mode) => {
  // Ensure mode is extracted if passed as an object or is undefined
  if (typeof mode === "object" && mode.mode) {
    mode = mode.mode; // Extract the mode property
  }

  if (!mode || typeof mode !== "string") mode = "light"; // Default to light mode if mode is invalid

  // console.log("globalTheme mode", mode); // Debug log to check the theme mode

  return createTheme({
    palette: {
      mode, // Ensure mode is either "light" or "dark"
      ...(mode === "light" ? lightPalette : darkPalette),
    },
    // Status color extension
    status: {
      success: "#2ecc71", // #2ecc71
      warning: "#f39c12", // #f39c12
      danger: "#e74c3c", // #e74c3c
    },
    typography: {
      fontFamily: "'Outfit','Roboto', 'Helvetica', 'Arial', sans-serif",
      h4: {
        fontWeight: 600,
        fontSize: "1.8rem",
      },
      body1: {
        fontSize: "1rem",
        color:
          mode === "light"
            ? lightPalette.text.primary
            : darkPalette.text.primary, // Adjust text color for modes
        lineHeight: 1.7,
      },
      // Additional variants
      body2: {
        fontSize: "0.875rem",
        lineHeight: 1.6,
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: "1rem",
      },
      caption: {
        fontSize: "0.75rem",
        color:
          mode === "light"
            ? lightPalette.text.secondary
            : darkPalette.text.secondary,
      },
      allVariants: {
        color:
          mode === "light"
            ? lightPalette.text.primary
            : darkPalette.text.primary,
        lineHeight: 1.7,
      },
    },
    shape: {
      borderRadius: 8,
    },
    spacing: 8,
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            backgroundColor:
              mode === "light"
                ? lightPalette.background.paper
                : darkPalette.background.paper,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none", // Disable uppercase text
            borderRadius: "8px",
            padding: "10px 16px",
          },
          containedPrimary: {
            backgroundColor: mode === "light" ? "#7c4dff" : "#1e88e5",
            "&:hover": {
              backgroundColor: mode === "light" ? "#9575cd" : "#42a5f5",
            },
          },
          outlined: {
            borderColor:
              mode === "light"
                ? lightPalette.primary.main
                : darkPalette.primary.main,
            color:
              mode === "light"
                ? lightPalette.text.secondary
                : darkPalette.text.secondary,
            "&:hover": {
              borderColor:
                mode === "light"
                  ? lightPalette.text.secondary
                  : darkPalette.text.secondary,
              backgroundColor: mode === "light" ? "#ede7f6" : "#3a3a4d",
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            marginBottom: "16px", // Consistent spacing between fields
          },
        },
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            marginBottom: "16px", // Consistent spacing for form controls
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor:
                mode === "light"
                  ? lightPalette.text.primary
                  : darkPalette.text.primary,
              borderWidth: "1.5px",
            },
          },
          notchedOutline: {
            borderColor:
              mode === "light"
                ? lightPalette.text.secondary
                : darkPalette.text.secondary,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor:
              mode === "light"
                ? lightPalette.background.navbar // Use navbar color for light mode
                : darkPalette.background.navbar, // Use navbar color for dark mode
            backgroundImage: "none", // Remove the default gradient
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            color:
              mode === "light"
                ? lightPalette.text.primary
                : darkPalette.text.primary,
            "&.Mui-selected": {
              backgroundColor:
                mode === "light"
                  ? lightPalette.primary.main
                  : darkPalette.primary.main,
              color:
                mode === "light"
                  ? lightPalette.text.primary
                  : darkPalette.text.primary,
              "&:hover": {
                backgroundColor:
                  mode === "light"
                    ? "#c0c0c0"
                    : darkPalette.primary.dark || "#333", // fallback if not defined
              },
            },
          },
        },
      },

      // Additional component overrides
      MuiLink: {
        styleOverrides: {
          root: {
            color:
              mode === "light"
                ? lightPalette.primary.main
                : darkPalette.primary.main,
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === "light" ? "#333" : "#eee",
            color: mode === "light" ? "#fff" : "#000",
            fontSize: "0.75rem",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${mode === "light" ? "#e0e0e0" : "#444"}`,
            color:
              mode === "light"
                ? lightPalette.text.primary
                : darkPalette.text.primary,
          },
          head: {
            fontWeight: 600,
            backgroundColor: mode === "light" ? "#f5f5f5" : "#1f1f2e",
          },
        },
      },
    },
  });
};

export default globalTheme;
