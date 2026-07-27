import { createTheme } from "@mui/material/styles";

const lightPalette = {
  primary: {
    main: "#7c4dff",
    dark: "#6138d8",
    light: "#a980ff",
  },
  secondary: {
    main: "#6f7e8c",
  },
  background: {
    default: "#f4f6f8",
    paper: "#ffffff",
    navbar: "#e1e5ea",
    subtle: "#eef1f4",
  },
  text: {
    primary: "#1e1e1e",
    secondary: "#4d4d4d",
  },
  divider: "#d9dee3",
  action: {
    hoverOpacity: 0.08,
  },
};

const darkPalette = {
  primary: {
    main: "#1e88e5",
    dark: "#1565c0",
    light: "#64b5f6",
  },
  secondary: {
    main: "#6f7e8c",
  },
  background: {
    default: "#292940",
    paper: "#2b2b3c",
    navbar: "#1e1e2f",
    subtle: "#242436",
  },
  text: {
    primary: "#f0f2f5",
    secondary: "#aeb0b5",
  },
  divider: "#434356",
  action: {
    hoverOpacity: 0.08,
  },
};

const globalTheme = (mode) => {
  const resolvedMode =
    typeof mode === "object" && mode?.mode ? mode.mode : mode;

  const activeMode = typeof resolvedMode === "string" ? resolvedMode : "light";

  const palette = activeMode === "dark" ? darkPalette : lightPalette;

  return createTheme({
    palette: {
      mode: activeMode,
      ...palette,
      neutral: {
        main: "#6f7e8c",
        light: "#a3adb8",
        dark: "#495566",
      },
    },

    status: {
      success: "#2ecc71",
      warning: "#f39c12",
      danger: "#e74c3c",
    },

    layout: {
      public: {
        maxWidth: 1440,
        contentWidth: 1180,
        textWidth: 760,
        pageGutter: {
          xs: 2,
          sm: 3,
          md: 5,
          lg: 6,
        },
        sectionSpacing: {
          xs: 6,
          md: 9,
        },
        sectionPadding: {
          xs: 3,
          sm: 4,
          md: 6,
        },
        cardPadding: {
          xs: 2.5,
          sm: 3,
        },
        borderRadius: 3,
      },
    },

    typography: {
      fontFamily: "'Outfit', 'Roboto', 'Helvetica', 'Arial', sans-serif",

      h1: {
        fontSize: "clamp(2.25rem, 5vw, 4.25rem)",
        fontWeight: 700,
        lineHeight: 1.08,
        letterSpacing: "-0.035em",
      },

      h2: {
        fontSize: "clamp(1.9rem, 3.5vw, 3rem)",
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: "-0.025em",
      },

      h3: {
        fontSize: "clamp(1.65rem, 2.5vw, 2.35rem)",
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
      },

      h4: {
        fontSize: "clamp(1.4rem, 2vw, 1.8rem)",
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: "-0.015em",
      },

      h5: {
        fontSize: "1.25rem",
        fontWeight: 700,
        lineHeight: 1.35,
      },

      h6: {
        fontSize: "1.05rem",
        fontWeight: 700,
        lineHeight: 1.4,
      },

      subtitle1: {
        fontSize: "1rem",
        fontWeight: 600,
        lineHeight: 1.5,
      },

      subtitle2: {
        fontSize: "0.875rem",
        fontWeight: 600,
        lineHeight: 1.5,
      },

      body1: {
        fontSize: "1rem",
        lineHeight: 1.7,
      },

      body2: {
        fontSize: "0.875rem",
        lineHeight: 1.6,
      },

      overline: {
        fontSize: "0.75rem",
        fontWeight: 700,
        lineHeight: 1.5,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      },

      caption: {
        fontSize: "0.75rem",
        lineHeight: 1.5,
      },

      button: {
        fontWeight: 600,
        textTransform: "none",
      },

      allVariants: {
        color: palette.text.primary,
      },
    },

    shape: {
      borderRadius: 8,
    },

    spacing: 8,

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollBehavior: "smooth",
          },
          body: {
            backgroundColor: palette.background.default,
          },
          "*": {
            boxSizing: "border-box",
          },
          img: {
            maxWidth: "100%",
          },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: palette.background.navbar,
            backgroundImage: "none",
          },
        },
      },

      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: palette.background.paper,
            backgroundImage: "none",
          },
          rounded: {
            borderRadius: 16,
          },
        },
      },

      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            border: `1px solid ${palette.divider}`,
            borderRadius: 16,
            backgroundImage: "none",
          },
        },
      },

      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: 24,
            "&:last-child": {
              paddingBottom: 24,
            },
          },
        },
      },

      MuiCardHeader: {
        styleOverrides: {
          root: {
            padding: 24,
          },
          title: {
            fontWeight: 700,
          },
          subheader: {
            marginTop: 4,
          },
        },
      },

      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            minHeight: 42,
            padding: "9px 18px",
            borderRadius: 8,
            fontWeight: 600,
            textTransform: "none",
          },

          sizeSmall: {
            minHeight: 34,
            padding: "6px 12px",
          },

          sizeLarge: {
            minHeight: 48,
            padding: "11px 22px",
          },

          containedPrimary: {
            backgroundColor: palette.primary.main,
            "&:hover": {
              backgroundColor: palette.primary.dark,
            },
          },

          outlined: {
            borderColor: palette.divider,
            color: palette.text.primary,
            "&:hover": {
              borderColor: palette.text.secondary,
              backgroundColor: activeMode === "light" ? "#ede7f6" : "#3a3a4d",
            },
          },
        },
      },

      MuiLink: {
        styleOverrides: {
          root: {
            color: palette.primary.main,
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          },
        },
      },

      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.primary.main,
              borderWidth: 1.5,
            },
          },
          notchedOutline: {
            borderColor: palette.divider,
          },
        },
      },

      MuiFormControl: {
        styleOverrides: {
          root: {
            minWidth: 0,
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${palette.divider}`,
            color: palette.text.primary,
          },
          head: {
            fontWeight: 700,
            backgroundColor: activeMode === "light" ? "#f5f5f5" : "#1f1f2e",
          },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: activeMode === "light" ? "#333333" : "#eeeeee",
            color: activeMode === "light" ? "#ffffff" : "#000000",
            fontSize: "0.75rem",
          },
        },
      },

      MuiToggleButton: {
        styleOverrides: {
          root: {
            color: palette.text.primary,
            "&.Mui-selected": {
              backgroundColor: palette.primary.main,
              color: "#ffffff",
              "&:hover": {
                backgroundColor: palette.primary.dark,
              },
            },
          },
        },
      },
    },
  });
};

export default globalTheme;
