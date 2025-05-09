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
  AlertTitle,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Info as InfoIcon,
  Security as SecurityIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const TaxCalculation = () => {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [loadingProofs, setLoadingProofs] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [proofs, setProofs] = useState([]);
  const [selectedProofId, setSelectedProofId] = useState('');
  const [incomeRanges, setIncomeRanges] = useState([]);
  const [selectedRange, setSelectedRange] = useState('');
  
  const [calculationResult, setCalculationResult] = useState(null);
  
  // Tax brackets will be fetched from API
  const [taxBrackets, setTaxBrackets] = useState([]);
  
  // Fetch proofs and income ranges on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingProofs(true);
        
        // Fetch ZKP proofs from API
        const proofsResponse = await axios.get('/zkp/proofs');
        const proofs = proofsResponse.data.proofs;
        
        console.log('Fetched proofs:', proofs);
        
        // Fetch tax brackets from API
        const bracketsResponse = await axios.get('/tax/brackets');
        const brackets = bracketsResponse.data.brackets;
        
        // Set tax brackets for display
        setTaxBrackets(brackets);
        
        // Create income ranges based on tax brackets
        const incomeRanges = brackets.map((bracket, index) => {
          // Skip the first bracket (0% tax)
          if (index === 0) return null;
          
          return {
            id: `range${index}`,
            label: `Income > ${bracket.min.toLocaleString()} BDT`,
            threshold: bracket.min
          };
        }).filter(Boolean); // Remove null values
        
        setProofs(proofs);
        setIncomeRanges(incomeRanges);
        
        // Set default selections if available
        if (proofs.length > 0) {
          setSelectedProofId(proofs[0]._id);
        }
        
        setLoadingProofs(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data. Please try again.');
        setLoadingProofs(false);
      }
    };
    
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);
  
  const handleProofChange = (event) => {
    setSelectedProofId(event.target.value);
  };
  
  const handleRangeChange = (event) => {
    setSelectedRange(event.target.value);
  };
  
  const handleCalculate = async () => {
    if (!selectedProofId || !selectedRange) {
      setError('Please select both a proof and an income range');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get the selected range details
      const range = incomeRanges.find(r => r.id === selectedRange);
      
      // Call API to calculate tax
      const response = await axios.post('/tax/calculate', {
        proofId: selectedProofId,
        incomeRange: range.label,
        incomeThreshold: range.threshold
      });
      
      // Process the response
      const result = response.data;
      
      // Set calculation result
      setCalculationResult({
        proofId: selectedProofId,
        incomeRange: range.label,
        taxBracket: result.taxBracket ? `${result.taxBracket.rate * 100}% (${result.taxBracket.min.toLocaleString()} to ${result.taxBracket.max === Infinity ? 'Above' : result.taxBracket.max.toLocaleString()} BDT)` : 'N/A',
        taxRate: result.taxRate || 'N/A',
        estimatedTax: result.estimatedTax || 0,
        calculatedAt: new Date().toISOString()
      });
      
      setSuccess(true);
      toast.success('Tax calculation completed successfully!');
    } catch (err) {
      console.error('Error calculating tax:', err);
      setError('Failed to calculate tax. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleProceedToPayment = () => {
    navigate('/tax-payment', { 
      state: { 
        calculationResult,
        proofId: selectedProofId
      } 
    });
  };
  
  if (authLoading || loadingProofs) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 128px)">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      bgcolor: '#2a1a4a', 
      minHeight: 'calc(100vh - 128px)',
      py: 4
    }}>
      <Container maxWidth="md">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white', mb: 3 }}>
            Tax Calculation
          </Typography>
          
          <Paper elevation={3} sx={{ 
            p: 4, 
            mb: 4, 
            bgcolor: '#3a2a5a',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(138, 75, 255, 0.2)'
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
              Calculate Tax Using Zero-Knowledge Proofs
            </Typography>
            
            <Typography variant="body1" paragraph sx={{ color: '#b69fff' }}>
              Select your income commitment and the income range that applies to you. The system will calculate your tax without revealing your exact income.
            </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="proof-select-label">Income Commitment</InputLabel>
              <Select
                labelId="proof-select-label"
                id="proof-select"
                value={selectedProofId}
                label="Income Commitment"
                onChange={handleProofChange}
                disabled={loading || proofs.length === 0}
              >
                {proofs.length === 0 ? (
                  <MenuItem value="">
                    <em>No income commitments available</em>
                  </MenuItem>
                ) : (
                  proofs.map((proof) => (
                    <MenuItem key={proof._id} value={proof._id}>
                      {proof._id}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            
            {proofs.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                You need to declare your income first. <Button size="small" onClick={() => navigate('/income-declaration')}>Declare Income</Button>
              </Alert>
            )}
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="range-select-label">Income Range</InputLabel>
              <Select
                labelId="range-select-label"
                id="range-select"
                value={selectedRange}
                label="Income Range"
                onChange={handleRangeChange}
                disabled={loading || !selectedProofId}
                endAdornment={
                  <InputAdornment position="end">
                    <Tooltip title="Select the income range that includes your actual income. This allows the system to calculate your tax without revealing your exact income.">
                      <IconButton edge="end" sx={{ mr: 2 }}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                }
              >
                {incomeRanges.map((range) => (
                  <MenuItem key={range.id} value={range.id}>
                    {range.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3, 
              p: 2, 
              bgcolor: 'rgba(138, 75, 255, 0.1)',
              borderRadius: 2,
              border: '1px solid rgba(138, 75, 255, 0.2)'
            }}>
              <SecurityIcon sx={{ mr: 1, color: '#8a4bff' }} />
              <Typography variant="body2" sx={{ color: '#b69fff' }}>
                Your privacy is protected through Zero-Knowledge Proofs. The system will verify your income range without knowing your exact income.
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              fullWidth
              onClick={handleCalculate}
              disabled={loading || !selectedProofId || !selectedRange}
              startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <CalculateIcon />}
              sx={{ 
                py: 1.5, 
                bgcolor: '#8a4bff',
                '&:hover': {
                  bgcolor: '#7a3bef',
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(138, 75, 255, 0.3)',
                  color: 'rgba(255, 255, 255, 0.5)'
                }
              }}
            >
              {loading ? 'Calculating...' : 'Calculate Tax'}
            </Button>
          </Box>
          
          {success && calculationResult && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                Tax Calculation Result
              </Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ 
                mb: 3, 
                bgcolor: '#2a1a4a',
                borderRadius: 2,
                border: '1px solid rgba(138, 75, 255, 0.2)',
                overflow: 'hidden'
              }}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', color: '#b69fff', borderBottom: '1px solid rgba(138, 75, 255, 0.2)' }}>
                        Income Range
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(138, 75, 255, 0.2)' }}>
                        {calculationResult.incomeRange}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', color: '#b69fff', borderBottom: '1px solid rgba(138, 75, 255, 0.2)' }}>
                        Tax Bracket
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(138, 75, 255, 0.2)' }}>
                        {calculationResult.taxBracket}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', color: '#b69fff', borderBottom: '1px solid rgba(138, 75, 255, 0.2)' }}>
                        Tax Rate
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(138, 75, 255, 0.2)' }}>
                        {calculationResult.taxRate}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', color: '#b69fff', borderBottom: '1px solid rgba(138, 75, 255, 0.2)' }}>
                        Estimated Tax
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', borderBottom: '1px solid rgba(138, 75, 255, 0.2)' }}>
                        {calculationResult.estimatedTax.toLocaleString()} BDT
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', color: '#b69fff' }}>
                        Calculated At
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        {new Date(calculationResult.calculatedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Alert severity="success" sx={{ mb: 3 }}>
                <AlertTitle>Tax Calculation Successful</AlertTitle>
                Your tax has been calculated based on your income range. You can now proceed to payment.
              </Alert>
              
              <Button
                variant="contained"
                fullWidth
                onClick={handleProceedToPayment}
                sx={{ 
                  py: 1.5, 
                  bgcolor: '#8a4bff',
                  '&:hover': {
                    bgcolor: '#7a3bef',
                  }
                }}
              >
                Proceed to Tax Payment
              </Button>
            </Box>
          )}
        </Paper>
        
          <Paper elevation={3} sx={{ 
            p: 4, 
            bgcolor: '#3a2a5a',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(138, 75, 255, 0.2)'
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
              Tax Brackets for Fiscal Year 2024-2025
            </Typography>
            
            <TableContainer sx={{ 
              borderRadius: 2,
              border: '1px solid rgba(138, 75, 255, 0.2)',
              overflow: 'hidden'
            }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(138, 75, 255, 0.2)' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', borderBottom: '1px solid rgba(138, 75, 255, 0.2)' }}>
                      Income Range (BDT)
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', borderBottom: '1px solid rgba(138, 75, 255, 0.2)' }}>
                      Tax Rate
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taxBrackets.map((bracket, index) => (
                    <TableRow key={index} sx={{ 
                      '&:nth-of-type(odd)': { bgcolor: 'rgba(138, 75, 255, 0.05)' },
                      '&:hover': { bgcolor: 'rgba(138, 75, 255, 0.1)' }
                    }}>
                      <TableCell sx={{ color: 'white', borderBottom: index === taxBrackets.length - 1 ? 'none' : '1px solid rgba(138, 75, 255, 0.2)' }}>
                        {bracket.max === 'Above' 
                          ? `Above ${bracket.min.toLocaleString()}`
                          : `${bracket.min.toLocaleString()} to ${bracket.max.toLocaleString()}`}
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'white', 
                        fontWeight: 'medium',
                        borderBottom: index === taxBrackets.length - 1 ? 'none' : '1px solid rgba(138, 75, 255, 0.2)'
                      }}>
                        {bracket.rate}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default TaxCalculation;
