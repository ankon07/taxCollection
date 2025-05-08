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
  Tooltip,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const TaxHistory = () => {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taxPayments, setTaxPayments] = useState([]);
  const [fiscalYearFilter, setFiscalYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const fiscalYears = ['2024-2025', '2023-2024', '2022-2023'];
  const statuses = ['completed', 'processing', 'failed'];
  
  // Fetch tax payment history on component mount
  useEffect(() => {
    const fetchTaxHistory = async () => {
      try {
        setLoading(true);
        
        // Fetch tax payment history from API
        const response = await axios.get('/tax/history');
        
        // Process the response data
        const taxPayments = response.data.map(payment => {
          // Add fiscalYear if not present in the API response
          // In a real application, this would come from the backend
          if (!payment.fiscalYear) {
            const paymentDate = new Date(payment.date);
            const year = paymentDate.getFullYear();
            // Fiscal year in Bangladesh typically runs from July to June
            const fiscalYear = paymentDate.getMonth() >= 6 
              ? `${year}-${year + 1}` 
              : `${year - 1}-${year}`;
            payment.fiscalYear = fiscalYear;
          }
          
          return payment;
        });
        
        setTaxPayments(taxPayments);
        
        // No need to process API data since we're using mock data
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tax history:', err);
        setError('Failed to load tax payment history. Please try again.');
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchTaxHistory();
    }
  }, [isAuthenticated]);
  
  const handleFiscalYearFilterChange = (event) => {
    setFiscalYearFilter(event.target.value);
  };
  
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };
  
  const handleViewReceipt = (paymentId) => {
    navigate(`/tax-receipt/${paymentId}`);
  };
  
  const handleDownloadAll = () => {
    // In a real application, this would download all receipts
    // For this demo, we'll just show a toast
    toast.info('All receipts downloaded as PDF');
  };
  
  const handlePrintAll = () => {
    // In a real application, this would print all receipts
    // For this demo, we'll just show a toast
    toast.info('Printing all receipts');
  };
  
  // Filter tax payments based on selected filters
  const filteredTaxPayments = taxPayments.filter(payment => {
    const matchesFiscalYear = fiscalYearFilter === 'all' || payment.fiscalYear === fiscalYearFilter;
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesFiscalYear && matchesStatus;
  });
  
  // Calculate total tax paid
  const totalTaxPaid = taxPayments
    .filter(payment => payment.status === 'completed')
    .reduce((total, payment) => total + payment.amount, 0);
  
  // Get status chip color
  const getStatusChipColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };
  
  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 128px)">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tax Payment History
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Total Tax Paid
                </Typography>
                <Typography variant="h4">
                  {totalTaxPaid.toLocaleString()} BDT
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Across all fiscal years
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Total Payments
                </Typography>
                <Typography variant="h4">
                  {taxPayments.length}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {taxPayments.filter(p => p.status === 'completed').length} completed, {taxPayments.filter(p => p.status === 'processing').length} processing
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Current Fiscal Year
                </Typography>
                <Typography variant="h4">
                  2024-2025
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {taxPayments.filter(p => p.fiscalYear === '2024-2025' && p.status === 'completed').reduce((total, p) => total + p.amount, 0).toLocaleString()} BDT paid
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Filters and Actions */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flex: 1 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="fiscal-year-filter-label">Fiscal Year</InputLabel>
                <Select
                  labelId="fiscal-year-filter-label"
                  id="fiscal-year-filter"
                  value={fiscalYearFilter}
                  label="Fiscal Year"
                  onChange={handleFiscalYearFilterChange}
                >
                  <MenuItem value="all">All Years</MenuItem>
                  {fiscalYears.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  {statuses.map(status => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadAll}
              >
                Download All
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PrintIcon />}
                onClick={handlePrintAll}
              >
                Print All
              </Button>
            </Box>
          </Box>
        </Paper>
        
        {/* Tax Payment Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payment Date</TableCell>
                <TableCell>Transaction Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Fiscal Year</TableCell>
                <TableCell>Bank Account</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Receipt</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTaxPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body1" sx={{ py: 3 }}>
                      No tax payment records found matching the selected filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTaxPayments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {payment.transactionDate 
                        ? new Date(payment.transactionDate).toLocaleDateString() 
                        : payment.status === 'completed' 
                          ? new Date(payment.updatedAt).toLocaleDateString()
                          : '-'}
                    </TableCell>
                    <TableCell>{payment.amount.toLocaleString()} BDT</TableCell>
                    <TableCell>{payment.fiscalYear}</TableCell>
                    <TableCell>
                      {payment.bankAccount.bankName}<br />
                      <Typography variant="caption" color="textSecondary">
                        {payment.bankAccount.accountNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        color={getStatusChipColor(payment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {payment.receiptId ? (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {payment.receiptId}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Pending
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Receipt">
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewReceipt(payment._id)}
                            disabled={payment.status !== 'completed'}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Information */}
        <Box sx={{ mt: 4 }}>
        <Alert severity="info">
          <Typography variant="body2">
            All tax payments are securely recorded on the blockchain for transparency and immutability. You can verify any payment by viewing its receipt and checking the transaction hash.
          </Typography>
          <Box mt={1}>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => window.open(`${process.env.REACT_APP_BLOCKCHAIN_EXPLORER_URL || 'https://sepolia.etherscan.io'}`, '_blank')}
            >
              View on Blockchain Explorer
            </Button>
          </Box>
        </Alert>
        </Box>
      </Box>
    </Container>
  );
};

export default TaxHistory;
