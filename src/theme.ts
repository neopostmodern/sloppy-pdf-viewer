import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#2a2a2e",
      paper: "#38383d",
    },
    primary: {
      main: "#4fc3f7",
    },
    secondary: {
      main: "#0078d7",
    },
    text: {
      primary: "#e0e0e0",
      secondary: "#b0b0b0",
    },
    divider: "#555",
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 13,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "html, body, #root": {
          height: "100%",
          overflow: "hidden",
        },
        body: {
          display: "flex",
          flexDirection: "column",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "#d4d4d8",
          borderRadius: 4,
          padding: 4,
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        },
        sizeSmall: {
          padding: 4,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontSize: 13,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: 13,
        },
      },
    },
  },
});

export default theme;
