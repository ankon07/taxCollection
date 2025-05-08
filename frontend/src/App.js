import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import PrivateRoute from './components/auth/PrivateRoute';

// Main components
import Dashboard from './components/dashboard/Dashboard';
import Profile from './components/profile/Profile';
import BankAccounts from './components/bank/BankAccounts';
import AddBankAccount from './components/bank/AddBankAccount';
import IncomeDeclaration from './components/tax/IncomeDeclaration';
import TaxCalculation from './components/tax/TaxCalculation';
import TaxPayment from './components/tax/TaxPayment';
import TaxHistory from './components/tax/TaxHistory';
import TaxReceipt from './components/tax/TaxReceipt';

// Context providers
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';

// Create theme with dark purple color scheme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8a4bff', // Bright purple
      light: '#b69fff',
      dark: '#7a3bef',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff9800', // Orange for warnings/highlights
      light: '#ffb74d',
      dark: '#f57c00',
      contrastText: '#ffffff',
    },
    background: {
      default: '#2a1a4a', // Dark purple background
      paper: '#3a2a5a', // Slightly lighter purple for cards
    },
    text: {
      primary: '#ffffff',
      secondary: '#b69fff', // Light purple for secondary text
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
    divider: 'rgba(138, 75, 255, 0.2)',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 300,
      color: '#ffffff',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 300,
      color: '#ffffff',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 300,
      color: '#ffffff',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 300,
      color: '#ffffff',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 400,
      color: '#ffffff',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#ffffff',
    },
    subtitle1: {
      color: '#b69fff',
    },
    subtitle2: {
      color: '#b69fff',
    },
    body1: {
      color: '#ffffff',
    },
    body2: {
      color: '#b69fff',
    },
  },
  shape: {
    borderRadius: 16, // Rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          backgroundColor: '#8a4bff',
          '&:hover': {
            backgroundColor: '#7a3bef',
          },
        },
        outlined: {
          borderColor: '#8a4bff',
          color: '#8a4bff',
          '&:hover': {
            backgroundColor: 'rgba(138, 75, 255, 0.1)',
            borderColor: '#7a3bef',
          },
        },
        text: {
          color: '#8a4bff',
          '&:hover': {
            backgroundColor: 'rgba(138, 75, 255, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#3a2a5a',
          backgroundImage: 'none',
          boxShadow: '0 4px 20px rgba(138, 75, 255, 0.2)',
        },
        elevation0: {
          backgroundColor: '#3a2a5a',
          backgroundImage: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#3a2a5a',
          backgroundImage: 'none',
          boxShadow: '0 4px 20px rgba(138, 75, 255, 0.2)',
          borderRadius: 16,
          overflow: 'hidden',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': {
            backgroundColor: 'rgba(138, 75, 255, 0.1)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#2a1a4a',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#2a1a4a',
          borderRight: '1px solid rgba(138, 75, 255, 0.2)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(138, 75, 255, 0.2)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(138, 75, 255, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(138, 75, 255, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#8a4bff',
            },
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <WalletProvider>
          <Router>
          <Header />
          <main style={{ minHeight: 'calc(100vh - 128px)', backgroundColor: '#2a1a4a' }}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/bank-accounts" element={
                <PrivateRoute>
                  <BankAccounts />
                </PrivateRoute>
              } />
              <Route path="/add-bank-account" element={
                <PrivateRoute>
                  <AddBankAccount />
                </PrivateRoute>
              } />
              <Route path="/income-declaration" element={
                <PrivateRoute>
                  <IncomeDeclaration />
                </PrivateRoute>
              } />
              <Route path="/tax-calculation" element={
                <PrivateRoute>
                  <TaxCalculation />
                </PrivateRoute>
              } />
              <Route path="/tax-payment" element={
                <PrivateRoute>
                  <TaxPayment />
                </PrivateRoute>
              } />
              <Route path="/tax-history" element={
                <PrivateRoute>
                  <TaxHistory />
                </PrivateRoute>
              } />
              <Route path="/tax-receipt/:id" element={
                <PrivateRoute>
                  <TaxReceipt />
                </PrivateRoute>
              } />
              
              {/* Default route */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
          <Footer />
          </Router>
        </WalletProvider>
      </AuthProvider>
      <ToastContainer position="top-right" autoClose={5000} />
    </ThemeProvider>
  );
}

export default App;
