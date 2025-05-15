import React, { useContext, useState } from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Tooltip
} from '@mui/material';
import { 
  AccountBalanceWallet as WalletIcon,
  LinkOff as DisconnectIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { WalletContext } from '../../context/WalletContext';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const ConnectWallet = () => {
  const { 
    publicKey, 
    connecting, 
    connected, 
    connectPhantomWallet, 
    disconnectWallet,
    isPhantomInstalled
  } = useContext(WalletContext);
  
  const { user, updateProfile } = useContext(AuthContext);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [linking, setLinking] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Handle wallet connection
  const handleConnect = async () => {
    if (!isPhantomInstalled) {
      setOpenDialog(true);
      return;
    }
    
    await connectPhantomWallet();
  };
  
  // Handle wallet disconnection
  const handleDisconnect = async () => {
    await disconnectWallet();
  };
  
  // Handle linking wallet to user account
  const handleLinkWallet = async () => {
    try {
      setLinking(true);
      
      // Call API to link wallet
      const response = await axios.post('/users/link-wallet', {
        walletAddress: publicKey
      });
      
      if (response.data.success) {
        toast.success('Wallet linked to your account successfully!');
        // Update user profile to reflect wallet linkage
        updateProfile({ ...user, walletAddress: publicKey });
      }
    } catch (error) {
      console.error('Error linking wallet:', error);
      toast.error('Failed to link wallet to your account. Please try again.');
    } finally {
      setLinking(false);
    }
  };
  
  // Handle copying wallet address
  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      setCopied(true);
      toast.info('Wallet address copied to clipboard');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Close the install Phantom dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Format wallet address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <>
      {!connected ? (
        <Button
          variant="contained"
          color="primary"
          startIcon={<WalletIcon />}
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? 'Connecting...' : 'Connect Phantom Wallet'}
          {connecting && <CircularProgress size={24} sx={{ ml: 1 }} />}
        </Button>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Paper elevation={2} sx={{ p: 2, mb: 2, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Connected Wallet
              </Typography>
              <Chip 
                label="Connected" 
                color="success" 
                size="small" 
                icon={<CheckCircleIcon />} 
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {/* Phantom Logo */}
              <Box 
                component="img" 
                src="https://phantom.app/img/phantom-logo.svg" 
                alt="Phantom Logo"
                sx={{ 
                  width: 24, 
                  height: 24, 
                  mr: 1,
                  borderRadius: '50%',
                  backgroundColor: '#AB9FF2',
                  p: 0.5
                }}
              />
              <Typography variant="body2" sx={{ mr: 1, fontWeight: 'medium' }}>
                {formatAddress(publicKey)}
              </Typography>
              <Tooltip title={copied ? "Copied!" : "Copy address"}>
                <CopyIcon 
                  fontSize="small" 
                  sx={{ cursor: 'pointer', color: copied ? 'success.main' : 'action.active' }} 
                  onClick={handleCopyAddress}
                />
              </Tooltip>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {!user?.walletAddress && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleLinkWallet}
                  disabled={linking}
                >
                  {linking ? 'Linking...' : 'Link to Account'}
                  {linking && <CircularProgress size={16} sx={{ ml: 1 }} />}
                </Button>
              )}
              
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DisconnectIcon />}
                onClick={handleDisconnect}
                sx={{ ml: 'auto' }}
              >
                Disconnect
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
      
      {/* Dialog for Phantom installation */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Phantom Wallet Required</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Phantom wallet is not installed. You need to install Phantom wallet to connect to the blockchain.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.open('https://phantom.app/', '_blank')}
          >
            Install Phantom
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ConnectWallet;
