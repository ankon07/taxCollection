import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  Link
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const ConnectMetaMask = ({ onConnect }) => {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return window.ethereum && window.ethereum.isMetaMask;
  };
  
  // Set up event listeners for MetaMask
  useEffect(() => {
    // We're not automatically checking for existing connections
    // This ensures the user must explicitly connect their wallet each time
    console.log('ConnectMetaMask component mounted - waiting for user to connect explicitly');
    
    // Set up event listeners
    if (window.ethereum) {
      // Listen for account changes
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // MetaMask is locked or the user has not connected any accounts
          setAccount(null);
          setConnected(false);
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          setConnected(true);
          
          // If onConnect callback is provided, call it with the new account
          if (onConnect) {
            onConnect(accounts[0]);
          }
        }
      };
      
      // Listen for chain changes
      const handleChainChanged = () => {
        // We recommend reloading the page, unless you must do otherwise
        window.location.reload();
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Clean up listeners on unmount
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account, onConnect]);
  
  const handleConnect = async () => {
    if (!isMetaMaskInstalled()) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    
    try {
      setConnecting(true);
      setError(null);
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      
      setAccount(account);
      setConnected(true);
      
      // If onConnect callback is provided, call it with the account
      if (onConnect) {
        onConnect(account);
      }
    } catch (err) {
      console.error('Connect MetaMask wallet error:', err);
      setError(err.message || 'Failed to connect MetaMask wallet. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <WalletIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
        <Typography variant="h6">MetaMask Wallet</Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {!isMetaMaskInstalled() ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>MetaMask Not Detected</AlertTitle>
          <Typography variant="body2" paragraph>
            MetaMask is required for blockchain transactions. Please install MetaMask to continue.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.open('https://metamask.io/download/', '_blank')}
            startIcon={<WalletIcon />}
          >
            Install MetaMask
          </Button>
        </Alert>
      ) : connected ? (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            <AlertTitle>MetaMask Connected</AlertTitle>
            <Typography variant="body2">
              Your MetaMask wallet is connected and ready for blockchain transactions.
            </Typography>
          </Alert>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            <Typography variant="body1">
              Connected Account: 
            </Typography>
          </Box>
          
          <Typography 
            variant="body2" 
            sx={{ 
              bgcolor: 'rgba(138, 75, 255, 0.1)', 
              p: 1, 
              borderRadius: 1,
              wordBreak: 'break-all',
              fontFamily: 'monospace'
            }}
          >
            {account}
          </Typography>
          
          <Button 
            variant="outlined" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={toggleDetails}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          
          {showDetails && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" paragraph>
                <strong>Network:</strong> Ethereum Sepolia Testnet
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Account Type:</strong> Ethereum
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Status:</strong> Active
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                <AlertTitle>Ready for Tax Payment</AlertTitle>
                <Typography variant="body2">
                  Your MetaMask wallet is now ready to process tax payments on the Ethereum blockchain. 
                  When you proceed with payment, MetaMask will prompt you to confirm the transaction.
                </Typography>
              </Alert>
            </Box>
          )}
        </Box>
      ) : (
        <Box>
          <Typography variant="body1" paragraph>
            Connect your MetaMask wallet to process tax payments on the Ethereum blockchain.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Why MetaMask?</AlertTitle>
            <Typography variant="body2">
              MetaMask is required for Ethereum blockchain transactions. Our tax payment system uses Ethereum smart contracts for secure, transparent, and immutable record-keeping.
            </Typography>
          </Alert>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Connection Error</AlertTitle>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleConnect}
            disabled={connecting}
            startIcon={connecting ? <CircularProgress size={20} /> : <WalletIcon />}
            fullWidth
            sx={{ py: 1.5 }}
          >
            {connecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>
          
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Don't have MetaMask? <Link href="https://metamask.io/download/" target="_blank">Download here</Link>
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ConnectMetaMask;
