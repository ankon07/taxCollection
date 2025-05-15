import React, { useContext, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  ListItemIcon,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Logout as LogoutIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { WalletContext } from '../../context/WalletContext';

const Header = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const { connected, publicKey, walletType, connectMetaMaskWallet } = useContext(WalletContext);
  const isMetaMaskConnected = connected && walletType === 'metamask';
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };
  
  const handleNavigation = (path) => {
    handleMenuClose();
    setMobileOpen(false);
    navigate(path);
  };
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Bank Accounts', icon: <AccountBalanceIcon />, path: '/bank-accounts' },
    { text: 'Income Declaration', icon: <CalculateIcon />, path: '/income-declaration' },
    { text: 'Tax Calculation', icon: <CalculateIcon />, path: '/tax-calculation' },
    { text: 'Tax Payment', icon: <PaymentIcon />, path: '/tax-payment' },
    { text: 'Tax History', icon: <HistoryIcon />, path: '/tax-history' }
  ];
  
  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => handleNavigation(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <Divider />
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );
  
  return (
    <>
      <AppBar position="static" sx={{ 
        bgcolor: '#2a1a4a', 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid rgba(138, 75, 255, 0.2)'
      }}>
        <Toolbar>
          {isAuthenticated && isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h6"
            component={RouterLink}
            to={isAuthenticated ? '/dashboard' : '/'}
            sx={{
              textDecoration: 'none',
              color: 'white',
              flexGrow: 1,
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Box 
              component="span" 
              sx={{ 
                color: '#8a4bff', 
                mr: 1, 
                fontSize: '1.5rem', 
                fontWeight: 'bold' 
              }}
            >
              ZKP
            </Box>
            Tax System
          </Typography>
          
          {isAuthenticated ? (
            <>
              {!isMobile && (
              <Box sx={{ display: 'flex' }}>
                {menuItems.map((item) => (
                  <Button
                    key={item.text}
                    color="inherit"
                    onClick={() => handleNavigation(item.path)}
                    sx={{ 
                      mx: 1, 
                      color: 'white',
                      position: 'relative',
                      '&:hover': {
                        bgcolor: 'rgba(138, 75, 255, 0.1)',
                      },
                      '&:hover::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '25%',
                        width: '50%',
                        height: '2px',
                        bgcolor: '#8a4bff',
                        borderRadius: '2px'
                      }
                    }}
                  >
                    {item.text}
                  </Button>
                ))}
              </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                {isMetaMaskConnected ? (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 1,
                    px: 1.5,
                    py: 0.5,
                    mr: 1
                  }}>
                    <WalletIcon sx={{ 
                      width: 20, 
                      height: 20,
                      mr: 1,
                      color: '#ff9800'
                    }} />
                    <Typography variant="body2" color="white">
                      {`${publicKey?.substring(0, 4)}...${publicKey?.substring(publicKey?.length - 4)}`}
                    </Typography>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<WalletIcon />}
                    onClick={() => {
                      console.log('Connect Wallet button clicked');
                      connectMetaMaskWallet()
                        .then(account => {
                          console.log('MetaMask connected with account:', account);
                        })
                        .catch(err => {
                          console.error('Failed to connect MetaMask:', err);
                        });
                    }}
                    sx={{ 
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        borderColor: '#8a4bff',
                        bgcolor: 'rgba(138, 75, 255, 0.1)',
                      }
                    }}
                  >
                    Connect Wallet
                  </Button>
                )}
              </Box>
              
              <IconButton
                onClick={handleProfileMenuOpen}
                color="inherit"
                edge="end"
                sx={{ 
                  '&:hover': {
                    bgcolor: 'rgba(138, 75, 255, 0.1)',
                  }
                }}
              >
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: '#8a4bff',
                  boxShadow: '0 2px 10px rgba(138, 75, 255, 0.3)'
                }}>
                  {user?.fullName?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: {
                    bgcolor: '#3a2a5a',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    borderRadius: 2,
                    border: '1px solid rgba(138, 75, 255, 0.2)',
                    mt: 1
                  }
                }}
              >
                <MenuItem 
                  onClick={() => handleNavigation('/profile')}
                  sx={{ 
                    borderRadius: 1,
                    mx: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(138, 75, 255, 0.1)',
                    }
                  }}
                >
                  <ListItemIcon>
                    <PersonIcon fontSize="small" sx={{ color: '#8a4bff' }} />
                  </ListItemIcon>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    Profile
                  </Typography>
                </MenuItem>
                
                <MenuItem 
                  onClick={() => handleNavigation('/bank-accounts')}
                  sx={{ 
                    borderRadius: 1,
                    mx: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(138, 75, 255, 0.1)',
                    }
                  }}
                >
                  <ListItemIcon>
                    <AccountBalanceIcon fontSize="small" sx={{ color: '#8a4bff' }} />
                  </ListItemIcon>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    Bank Accounts
                  </Typography>
                </MenuItem>
                
                <MenuItem 
                  onClick={() => handleNavigation('/tax-history')}
                  sx={{ 
                    borderRadius: 1,
                    mx: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(138, 75, 255, 0.1)',
                    }
                  }}
                >
                  <ListItemIcon>
                    <ReceiptIcon fontSize="small" sx={{ color: '#8a4bff' }} />
                  </ListItemIcon>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    Tax History
                  </Typography>
                </MenuItem>
                
                <MenuItem onClick={() => handleNavigation('/dashboard')}>
                  <ListItemIcon>
                    <WalletIcon fontSize="small" sx={{ color: isMetaMaskConnected ? '#ff9800' : 'inherit' }} />
                  </ListItemIcon>
                  {isMetaMaskConnected ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="inherit">
                        {`${publicKey?.substring(0, 6)}...${publicKey?.substring(publicKey?.length - 4)}`}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography 
                      variant="inherit" 
                      onClick={() => {
                        console.log('Connect MetaMask menu item clicked');
                        connectMetaMaskWallet()
                          .then(account => {
                            console.log('MetaMask connected with account:', account);
                            handleMenuClose(); // Close the menu after connecting
                          })
                          .catch(err => {
                            console.error('Failed to connect MetaMask:', err);
                          });
                      }}
                      sx={{ cursor: 'pointer' }}
                    >
                      Connect MetaMask
                    </Typography>
                  )}
                </MenuItem>
                
                <Divider sx={{ my: 1, borderColor: 'rgba(138, 75, 255, 0.2)' }} />
                
                <MenuItem 
                  onClick={handleLogout}
                  sx={{ 
                    borderRadius: 1,
                    mx: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(138, 75, 255, 0.1)',
                    }
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" sx={{ color: '#ff9800' }} />
                  </ListItemIcon>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    Logout
                  </Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box>
              <Button
                component={RouterLink}
                to="/login"
                sx={{ 
                  color: 'white',
                  mx: 1,
                  '&:hover': {
                    bgcolor: 'rgba(138, 75, 255, 0.1)',
                  }
                }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                component={RouterLink}
                to="/register"
                sx={{ 
                  bgcolor: '#8a4bff',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#7a3bef',
                  }
                }}
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      {isAuthenticated && isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': { 
              width: 240,
              bgcolor: '#2a1a4a',
              borderRight: '1px solid rgba(138, 75, 255, 0.2)'
            }
          }}
        >
          {drawer}
        </Drawer>
      )}
    </>
  );
};

export default Header;
