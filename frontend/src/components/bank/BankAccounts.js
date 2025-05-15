import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const BankAccounts = () => {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(null);
  
  // Fetch bank accounts on component mount
  useEffect(() => {
    const fetchBankAccounts = async () => {
      if (!isAuthenticated) {
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch bank accounts from API with timeout
        const fetchWithTimeout = async (promise, timeoutMs = 10000) => {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
          });
          return Promise.race([promise, timeoutPromise]);
        };
        
        const response = await fetchWithTimeout(axios.get('/users/bank-accounts'));
        
        // Set bank accounts from API response
        setBankAccounts(response.data);
      } catch (err) {
        console.error('Error fetching bank accounts:', err);
        setError('Failed to load bank accounts. Please try again.');
        // Set empty array to prevent UI from waiting indefinitely
        setBankAccounts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBankAccounts();
  }, [isAuthenticated]);
  
  const handleAddBankAccount = () => {
    navigate('/add-bank-account');
  };
  
  const handleDeleteBankAccount = async (accountId) => {
    try {
      setDeleteLoading(accountId);
      
      // Call API to delete bank account
      await axios.delete(`/users/bank-accounts/${accountId}`);
      
      // Update state by removing the account
      setBankAccounts(prevAccounts => 
        prevAccounts.filter(account => account._id !== accountId)
      );
      
      toast.success('Bank account removed successfully!');
    } catch (err) {
      console.error('Error deleting bank account:', err);
      toast.error('Failed to remove bank account. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };
  
  if (authLoading || loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="calc(100vh - 128px)">
        <CircularProgress size={60} thickness={4} sx={{ color: '#8a4bff', mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          Loading bank accounts...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Bank Accounts
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddBankAccount}
          >
            Add Bank Account
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Info Card */}
        <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: 'primary.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <AccountBalanceIcon color="primary" sx={{ mr: 2, mt: 0.5 }} />
            <Box>
              <Typography variant="h6" gutterBottom>
                Link Your Bank Accounts
              </Typography>
              <Typography variant="body2">
                Link your bank accounts to enable automated tax deduction. Your bank account information is securely stored and only used for tax payment purposes.
              </Typography>
            </Box>
          </Box>
        </Paper>
        
        {/* Bank Accounts Table */}
        {bankAccounts.length === 0 ? (
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No Bank Accounts Found
            </Typography>
            <Typography variant="body1" paragraph>
              You haven't linked any bank accounts yet.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddBankAccount}
            >
              Add Your First Bank Account
            </Button>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bank Name</TableCell>
                  <TableCell>Account Number</TableCell>
                  <TableCell>Account Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Added On</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bankAccounts.map((account) => (
                  <TableRow key={account._id}>
                    <TableCell>{account.bankName}</TableCell>
                    <TableCell>{account.accountNumber}</TableCell>
                    <TableCell>{account.accountType}</TableCell>
                    <TableCell>
                      {account.isVerified ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Verified"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<WarningIcon />}
                          label="Pending Verification"
                          color="warning"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>{new Date(account.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="Remove Account">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteBankAccount(account._id)}
                          disabled={deleteLoading === account._id}
                        >
                          {deleteLoading === account._id ? (
                            <CircularProgress size={24} />
                          ) : (
                            <DeleteIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* Information */}
        <Box sx={{ mt: 4 }}>
          <Alert severity="info">
            <Typography variant="body2">
              For security reasons, bank account verification may take up to 24 hours. Once verified, your account can be used for tax payments.
            </Typography>
          </Alert>
        </Box>
      </Box>
    </Container>
  );
};

export default BankAccounts;
