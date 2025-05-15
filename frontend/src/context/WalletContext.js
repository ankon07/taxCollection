import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';

// Create context
export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  // Common wallet state
  const [wallet, setWallet] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [walletType, setWalletType] = useState(null); // 'phantom' or 'metamask'
  const walletTypeRef = useRef(null);
  
  // Keep the ref in sync with the state
  useEffect(() => {
    walletTypeRef.current = walletType;
  }, [walletType]);

  // Check if Phantom wallet is installed
  const checkIfPhantomInstalled = useCallback(() => {
    const provider = window.phantom?.solana;
    return provider?.isPhantom;
  }, []);

  // Check if MetaMask is installed
  const checkIfMetaMaskInstalled = useCallback(() => {
    return window.ethereum && window.ethereum.isMetaMask;
  }, []);

  // Connect to Phantom wallet
  const connectPhantomWallet = useCallback(async () => {
    try {
      setConnecting(true);
      setError(null);

      // Check if Phantom is installed
      const isPhantomInstalled = checkIfPhantomInstalled();
      if (!isPhantomInstalled) {
        throw new Error('Phantom wallet is not installed. Please install it from https://phantom.app/');
      }

      // Connect to Phantom
      const provider = window.phantom?.solana;
      const { publicKey } = await provider.connect();
      
      setWallet(provider);
      setPublicKey(publicKey.toString());
      setConnected(true);
      setWalletType('phantom');
      
      toast.success('Phantom wallet connected successfully!');
      return publicKey.toString();
    } catch (err) {
      console.error('Connect Phantom wallet error:', err);
      setError(err.message || 'Failed to connect Phantom wallet. Please try again.');
      toast.error(err.message || 'Failed to connect Phantom wallet. Please try again.');
      return null;
    } finally {
      setConnecting(false);
    }
  }, [checkIfPhantomInstalled]);

  // Connect to MetaMask wallet
  const connectMetaMaskWallet = useCallback(async () => {
    try {
      setConnecting(true);
      setError(null);

      // Check if MetaMask is installed
      if (!checkIfMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed. Please install it from https://metamask.io/download/');
      }

      // Force MetaMask to show the account selection popup
      if (window.ethereum) {
        console.log('Requesting MetaMask accounts...');
        
        // Reset state before connecting
        setWallet(null);
        setPublicKey(null);
        setConnected(false);
        setWalletType(null);
        
        // Request account access - this should trigger the MetaMask popup
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts',
          params: [] // Explicitly provide empty params to ensure the popup shows
        });
        
        console.log('MetaMask accounts received:', accounts);
        
        if (accounts && accounts.length > 0) {
          const account = accounts[0];
          console.log('Selected account:', account);
          
          setWallet(window.ethereum);
          setPublicKey(account);
          setConnected(true);
          setWalletType('metamask');
          
          toast.success('MetaMask wallet connected successfully!');
          return account;
        } else {
          throw new Error('No accounts found. Please unlock your MetaMask and try again.');
        }
      } else {
        throw new Error('MetaMask is not available. Please install MetaMask and refresh the page.');
      }
    } catch (err) {
      console.error('Connect MetaMask wallet error:', err);
      setError(err.message || 'Failed to connect MetaMask wallet. Please try again.');
      toast.error(err.message || 'Failed to connect MetaMask wallet. Please try again.');
      return null;
    } finally {
      setConnecting(false);
    }
  }, [checkIfMetaMaskInstalled]);

  // Disconnect wallet (works for both wallet types)
  const disconnectWallet = useCallback(async () => {
    try {
      if (walletType === 'phantom' && wallet) {
        await wallet.disconnect();
      }
      // MetaMask doesn't have a disconnect method, we just clear the state
      
      setWallet(null);
      setPublicKey(null);
      setConnected(false);
      setWalletType(null);
      
      toast.info('Wallet disconnected');
    } catch (err) {
      console.error('Disconnect wallet error:', err);
      setError(err.message || 'Failed to disconnect wallet. Please try again.');
      toast.error(err.message || 'Failed to disconnect wallet. Please try again.');
    }
  }, [wallet, walletType]);

  // Sign a transaction (Phantom wallet)
  const signPhantomTransaction = useCallback(async (transaction) => {
    try {
      if (!wallet || !connected || walletType !== 'phantom') {
        throw new Error('Phantom wallet not connected');
      }
      
      const signedTransaction = await wallet.signTransaction(transaction);
      return signedTransaction;
    } catch (err) {
      console.error('Sign Phantom transaction error:', err);
      setError(err.message || 'Failed to sign transaction. Please try again.');
      toast.error(err.message || 'Failed to sign transaction. Please try again.');
      return null;
    }
  }, [wallet, connected, walletType]);

  // Sign and send a transaction (Phantom wallet)
  const signAndSendPhantomTransaction = useCallback(async (transaction) => {
    try {
      if (!wallet || !connected || walletType !== 'phantom') {
        throw new Error('Phantom wallet not connected');
      }
      
      const signature = await wallet.signAndSendTransaction(transaction);
      return signature;
    } catch (err) {
      console.error('Sign and send Phantom transaction error:', err);
      setError(err.message || 'Failed to send transaction. Please try again.');
      toast.error(err.message || 'Failed to send transaction. Please try again.');
      return null;
    }
  }, [wallet, connected, walletType]);

  // Send Ethereum transaction (MetaMask)
  const sendEthereumTransaction = useCallback(async (transactionParameters) => {
    try {
      if (!wallet || !connected || walletType !== 'metamask') {
        throw new Error('MetaMask wallet not connected');
      }
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });
      
      return txHash;
    } catch (err) {
      console.error('Send Ethereum transaction error:', err);
      setError(err.message || 'Failed to send transaction. Please try again.');
      toast.error(err.message || 'Failed to send transaction. Please try again.');
      return null;
    }
  }, [wallet, connected, walletType]);

  // Initialize wallet state on component mount
  useEffect(() => {
    // Clear any previous wallet state
    setWallet(null);
    setPublicKey(null);
    setConnected(false);
    setWalletType(null);
    
    // Note: We're not automatically checking for existing connections
    // This ensures the user must explicitly connect their wallet each time
    console.log('Wallet context initialized - user must connect wallet explicitly');
    
    // Set up MetaMask event listeners
    try {
      if (window.ethereum) {
        // Listen for account changes
        const handleAccountsChanged = (accounts) => {
          try {
            if (accounts && accounts.length === 0) {
              // MetaMask is locked or the user has not connected any accounts
              if (walletTypeRef.current === 'metamask') {
                setWallet(null);
                setPublicKey(null);
                setConnected(false);
                setWalletType(null);
              }
            } else if (walletTypeRef.current === 'metamask' && accounts && accounts.length > 0) {
              setPublicKey(accounts[0]);
            }
          } catch (err) {
            console.error('Error handling accounts changed:', err);
          }
        };
        
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        
        // Clean up listeners on unmount
        return () => {
          try {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          } catch (err) {
            console.error('Error removing event listeners:', err);
          }
        };
      }
    } catch (err) {
      console.error('Error setting up MetaMask event listeners:', err);
    }
  }, [checkIfMetaMaskInstalled]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        publicKey,
        connecting,
        connected,
        error,
        walletType,
        // Phantom wallet methods
        connectPhantomWallet,
        signPhantomTransaction,
        signAndSendPhantomTransaction,
        isPhantomInstalled: checkIfPhantomInstalled(),
        // MetaMask wallet methods
        connectMetaMaskWallet,
        sendEthereumTransaction,
        isMetaMaskInstalled: checkIfMetaMaskInstalled(),
        // Common methods
        disconnectWallet
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
