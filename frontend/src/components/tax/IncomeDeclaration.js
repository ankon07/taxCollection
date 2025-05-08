import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Divider,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Info as InfoIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const IncomeDeclaration = () => {
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    income: '',
    randomSecret: '',
    termsAccepted: false
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [commitment, setCommitment] = useState(null);
  const [proofId, setProofId] = useState(null);
  
  // Generate a random secret when component mounts
  useEffect(() => {
    const generateRandomSecret = () => {
      const randomBytes = new Uint8Array(16);
      window.crypto.getRandomValues(randomBytes);
      return Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    };
    
    setFormData(prev => ({
      ...prev,
      randomSecret: generateRandomSecret()
    }));
  }, []);
  
  const steps = [
    'Enter Income Information',
    'Generate Commitment',
    'Confirmation'
  ];
  
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear field error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const validateStep = (step) => {
    const errors = {};
    
    if (step === 0) {
      // Validate income
      if (!formData.income) {
        errors.income = 'Income is required';
      } else if (isNaN(formData.income) || parseFloat(formData.income) <= 0) {
        errors.income = 'Income must be a positive number';
      }
      
      // Validate terms acceptance
      if (!formData.termsAccepted) {
        errors.termsAccepted = 'You must accept the terms to continue';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleNext = async () => {
    if (validateStep(activeStep)) {
      if (activeStep === 0) {
        // Generate commitment
        try {
          setLoading(true);
          setError(null);
          
          // Make API call to generate commitment
          const response = await axios.post('/zkp/generate-commitment', {
            income: parseFloat(formData.income),
            randomSecret: formData.randomSecret
          });
          
          if (response.data && response.data.commitment && response.data.proofId) {
            setCommitment(response.data.commitment);
            setProofId(response.data.proofId);
            setActiveStep(activeStep + 1);
          } else {
            setError('Invalid response from server. Please try again.');
          }
        } catch (err) {
          console.error('Error generating commitment:', err);
          setError(err.response?.data?.message || 'Failed to generate commitment. Please try again.');
        } finally {
          setLoading(false);
        }
      } else if (activeStep === 1) {
        // Generate proof and store on blockchain
        try {
          setLoading(true);
          setError(null);
          
          // First, generate a ZKP proof
          // Find the appropriate income range based on the income amount
          const incomeAmount = parseFloat(formData.income);
          let incomeRange = '';
          
          if (incomeAmount > 1600000) {
            incomeRange = 'Income > 1,600,000 BDT';
          } else if (incomeAmount > 1100000) {
            incomeRange = 'Income > 1,100,000 BDT';
          } else if (incomeAmount > 700000) {
            incomeRange = 'Income > 700,000 BDT';
          } else if (incomeAmount > 400000) {
            incomeRange = 'Income > 400,000 BDT';
          } else if (incomeAmount > 300000) {
            incomeRange = 'Income > 300,000 BDT';
          } else {
            incomeRange = 'Income > 0 BDT';
          }
          
          // Generate the proof
          const proofResponse = await axios.post('/zkp/generate-proof', {
            proofId,
            income: incomeAmount,
            randomSecret: formData.randomSecret,
            incomeRange
          });
          
          if (!proofResponse.data || !proofResponse.data.proofId) {
            throw new Error('Failed to generate proof');
          }
          
          // Verify the proof
          const verifyResponse = await axios.post('/zkp/verify-proof', {
            proofId
          });
          
          if (!verifyResponse.data || verifyResponse.data.status !== 'proof_verified') {
            throw new Error('Failed to verify proof');
          }
          
          setSuccess(true);
          setActiveStep(activeStep + 1);
          
          // Show success toast
          toast.success('Income commitment stored successfully on the blockchain!');
        } catch (err) {
          console.error('Error processing proof:', err);
          setError(err.response?.data?.message || 'Failed to process proof. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    }
  };
  
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };
  
  const handleFinish = () => {
    navigate('/tax-calculation');
  };
  
  
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Please enter your annual income for the current fiscal year. This information will be kept private through Zero-Knowledge Proofs.
            </Typography>
            
            <TextField
              fullWidth
              label="Annual Income"
              name="income"
              type="number"
              value={formData.income}
              onChange={handleChange}
              margin="normal"
              error={!!formErrors.income}
              helperText={formErrors.income}
              disabled={loading}
              InputProps={{
                startAdornment: <InputAdornment position="start">BDT</InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Your exact income amount will not be revealed to the tax authority. Only a proof that your income falls within a specific tax bracket will be shared.">
                      <IconButton edge="end">
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
            
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
              <LockIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2" color="textSecondary">
                A random secret has been generated to secure your income information.
              </Typography>
            </Box>
            
            <TextField
              fullWidth
              label="Random Secret (Auto-generated)"
              name="randomSecret"
              value={formData.randomSecret}
              margin="normal"
              disabled={true}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <SecurityIcon color="primary" />
                  </InputAdornment>
                )
              }}
            />
            
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label="I declare that the income information provided is accurate and complete."
              />
              {formErrors.termsAccepted && (
                <Typography color="error" variant="caption" display="block">
                  {formErrors.termsAccepted}
                </Typography>
              )}
            </Box>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              A cryptographic commitment of your income has been generated. This commitment will be stored on the blockchain without revealing your actual income.
            </Typography>
            
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Income Commitment:
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {commitment}
              </Paper>
              <Typography variant="caption" color="textSecondary">
                This is a cryptographic hash that securely represents your income without revealing the actual amount.
              </Typography>
            </Box>
            
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Proof ID:
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', fontFamily: 'monospace' }}>
                {proofId}
              </Paper>
              <Typography variant="caption" color="textSecondary">
                Keep this ID for your records. You'll need it for tax calculations and payments.
              </Typography>
            </Box>
            
            <Alert severity="info" sx={{ mt: 3 }}>
              In the next step, this commitment will be stored on the blockchain. This operation cannot be undone.
            </Alert>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
            </Box>
            
            <Typography variant="h6" align="center" gutterBottom>
              Income Declaration Successful!
            </Typography>
            
            <Typography variant="body1" paragraph align="center">
              Your income commitment has been securely stored on the blockchain.
            </Typography>
            
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Transaction Details:
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Proof ID:</strong> {proofId}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Status:</strong> Verified
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Timestamp:</strong> {new Date().toLocaleString()}
                </Typography>
              </Paper>
            </Box>
            
            <Typography variant="body1" paragraph>
              You can now proceed to calculate your tax based on this income declaration. The system will generate a Zero-Knowledge Proof that proves your income falls within a specific tax bracket without revealing your exact income.
            </Typography>
            
            <Alert severity="success" sx={{ mt: 3 }}>
              Your privacy is protected! The tax authority can verify your tax bracket without knowing your exact income.
            </Alert>
          </Box>
        );
      default:
        return null;
    }
  };
  
  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 128px)">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Income Declaration
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {renderStepContent(activeStep)}
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0 || loading || success}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleFinish}
              >
                Proceed to Tax Calculation
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : activeStep === 0 ? (
                  'Generate Commitment'
                ) : (
                  'Store on Blockchain'
                )}
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default IncomeDeclaration;
