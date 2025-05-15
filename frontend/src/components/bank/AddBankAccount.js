import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Grid,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AddBankAccount = () => {
  const { loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountType: '',
    branchName: '',
    ifscCode: '',
    termsAccepted: false
  });
  
  const [formErrors, setFormErrors] = useState({});
  
  const steps = [
    'Enter Bank Details',
    'Verify Account',
    'Confirmation'
  ];
  
  const bankList = [
    'Bangladesh Bank',
    'Sonali Bank',
    'Janata Bank',
    'Agrani Bank',
    'Rupali Bank',
    'BRAC Bank',
    'Dutch-Bangla Bank',
    'Eastern Bank',
    'Islami Bank Bangladesh',
    'Pubali Bank'
  ];
  
  const accountTypes = [
    'Savings',
    'Current',
    'Salary'
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
      // Validate bank details
      if (!formData.bankName) {
        errors.bankName = 'Bank name is required';
      }
      
      if (!formData.accountNumber) {
        errors.accountNumber = 'Account number is required';
      } else if (!/^\d{10,16}$/.test(formData.accountNumber)) {
        errors.accountNumber = 'Account number must be 10-16 digits';
      }
      
      if (!formData.accountType) {
        errors.accountType = 'Account type is required';
      }
      
      if (!formData.branchName) {
        errors.branchName = 'Branch name is required';
      }
    } else if (step === 1) {
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
        setActiveStep(1);
      } else if (activeStep === 1) {
        // Submit bank account
        await handleSubmit();
      }
    }
  };
  
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };
  
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare data for API
      const bankAccountData = {
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountType: formData.accountType,
        branchName: formData.branchName,
        ifscCode: formData.ifscCode || undefined
      };
      
      // Call API to add bank account with timeout
      const fetchWithTimeout = async (promise, timeoutMs = 10000) => {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
        });
        return Promise.race([promise, timeoutPromise]);
      };
      
      await fetchWithTimeout(axios.post('/users/link-bank', bankAccountData));
      
      // Update state on success
      setActiveStep(2);
      
      toast.success('Bank account added successfully!');
    } catch (err) {
      console.error('Error adding bank account:', err);
      if (err.message === 'Request timed out') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to add bank account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleFinish = () => {
    navigate('/bank-accounts');
  };
  
  const handleCancel = () => {
    navigate('/bank-accounts');
  };
  
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Please enter your bank account details. This information will be used for automated tax deduction.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.bankName}>
                  <InputLabel id="bank-name-label">Bank Name</InputLabel>
                  <Select
                    labelId="bank-name-label"
                    id="bank-name"
                    name="bankName"
                    value={formData.bankName}
                    label="Bank Name"
                    onChange={handleChange}
                    disabled={loading}
                  >
                    {bankList.map((bank) => (
                      <MenuItem key={bank} value={bank}>{bank}</MenuItem>
                    ))}
                  </Select>
                  {formErrors.bankName && (
                    <FormHelperText>{formErrors.bankName}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Account Number"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  error={!!formErrors.accountNumber}
                  helperText={formErrors.accountNumber}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.accountType}>
                  <InputLabel id="account-type-label">Account Type</InputLabel>
                  <Select
                    labelId="account-type-label"
                    id="account-type"
                    name="accountType"
                    value={formData.accountType}
                    label="Account Type"
                    onChange={handleChange}
                    disabled={loading}
                  >
                    {accountTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                  {formErrors.accountType && (
                    <FormHelperText>{formErrors.accountType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Branch Name"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                  error={!!formErrors.branchName}
                  helperText={formErrors.branchName}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="IFSC Code (Optional)"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
            </Grid>
            
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                Your bank account information is securely stored and only used for tax payment purposes.
              </Typography>
            </Alert>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Verify Account Details
            </Typography>
            
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Bank Name:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">
                    {formData.bankName}
                  </Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Account Number:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">
                    {formData.accountNumber}
                  </Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Account Type:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">
                    {formData.accountType}
                  </Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Branch Name:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">
                    {formData.branchName}
                  </Typography>
                </Grid>
                
                {formData.ifscCode && (
                  <>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">
                        IFSC Code:
                      </Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body1">
                        {formData.ifscCode}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
            
            <Typography variant="body1" paragraph>
              Please verify that the above information is correct. By adding this bank account, you authorize the tax system to deduct tax payments from this account.
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="I confirm that the information provided is accurate and I authorize the tax system to deduct tax payments from this account."
            />
            {formErrors.termsAccepted && (
              <Typography color="error" variant="caption" display="block">
                {formErrors.termsAccepted}
              </Typography>
            )}
            
            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body2">
                For security reasons, bank account verification may take up to 24 hours. Once verified, your account can be used for tax payments.
              </Typography>
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
              Bank Account Added Successfully!
            </Typography>
            
            <Typography variant="body1" paragraph align="center">
              Your bank account has been added and is pending verification.
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                You will be notified once your bank account is verified and ready for tax payments.
              </Typography>
            </Alert>
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={handleFinish}
              >
                View Bank Accounts
              </Button>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };
  
  if (authLoading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="calc(100vh - 128px)">
        <CircularProgress size={60} thickness={4} sx={{ color: '#8a4bff', mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          Loading...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Add Bank Account
          </Typography>
        </Box>
        
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
          
          {activeStep < 2 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0 || loading}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : activeStep === steps.length - 2 ? (
                  'Submit'
                ) : (
                  'Next'
                )}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default AddBankAccount;
