import React, { createContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

// Create context
export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  // Check if Phantom wallet is installed
  const checkIfPhantomInstalled = useCallback(() => {
    const provider = window.phantom?.solana;
    return provider?.isPhantom;
  }, []);

  // Connect to Phantom wallet
  const connectWallet = useCallback(async () => {
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
      
      toast.success('Wallet connected successfully!');
      return publicKey.toString();
    } catch (err) {
      console.error('Connect wallet error:', err);
      setError(err.message || 'Failed to connect wallet. Please try again.');
      toast.error(err.message || 'Failed to connect wallet. Please try again.');
      return null;
    } finally {
      setConnecting(false);
    }
  }, [checkIfPhantomInstalled]);

  // Disconnect from Phantom wallet
  const disconnectWallet = useCallback(async () => {
    try {
      if (wallet) {
        await wallet.disconnect();
      }
      
      setWallet(null);
      setPublicKey(null);
      setConnected(false);
      
      toast.info('Wallet disconnected');
    } catch (err) {
      console.error('Disconnect wallet error:', err);
      setError(err.message || 'Failed to disconnect wallet. Please try again.');
      toast.error(err.message || 'Failed to disconnect wallet. Please try again.');
    }
  }, [wallet]);

  // Sign a transaction
  const signTransaction = useCallback(async (transaction) => {
    try {
      if (!wallet || !connected) {
        throw new Error('Wallet not connected');
      }
      
      const signedTransaction = await wallet.signTransaction(transaction);
      return signedTransaction;
    } catch (err) {
      console.error('Sign transaction error:', err);
      setError(err.message || 'Failed to sign transaction. Please try again.');
      toast.error(err.message || 'Failed to sign transaction. Please try again.');
      return null;
    }
  }, [wallet, connected]);

  // Sign and send a transaction
  const signAndSendTransaction = useCallback(async (transaction) => {
    try {
      if (!wallet || !connected) {
        throw new Error('Wallet not connected');
      }
      
      const signature = await wallet.signAndSendTransaction(transaction);
      return signature;
    } catch (err) {
      console.error('Sign and send transaction error:', err);
      setError(err.message || 'Failed to send transaction. Please try again.');
      toast.error(err.message || 'Failed to send transaction. Please try again.');
      return null;
    }
  }, [wallet, connected]);

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        const isPhantomInstalled = checkIfPhantomInstalled();
        if (!isPhantomInstalled) {
          return;
        }
        
        const provider = window.phantom?.solana;
        
        // Check if already connected
        if (provider.isConnected) {
          const publicKey = provider.publicKey.toString();
          setWallet(provider);
          setPublicKey(publicKey);
          setConnected(true);
        }
      } catch (err) {
        console.error('Check wallet connection error:', err);
      }
    };
    
    checkWalletConnection();
  }, [checkIfPhantomInstalled]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        publicKey,
        connecting,
        connected,
        error,
        connectWallet,
        disconnectWallet,
        signTransaction,
        signAndSendTransaction,
        isPhantomInstalled: checkIfPhantomInstalled()
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
