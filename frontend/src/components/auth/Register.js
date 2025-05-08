import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Box,
  Link,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { AuthContext } from '../../context/AuthContext';

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    nidNumber: '',
    tinNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nidVerified, setNidVerified] = useState(false);

  const { register, verifyNID, isAuthenticated, loading, error } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Set error from context
  useEffect(() => {
    if (error) {
      setSubmitError(error);
    }
  }, [error]);

  const steps = ['Personal Information', 'Identity Verification', 'Create Account'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
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
      // Validate personal information
      if (!formData.fullName) {
        errors.fullName = 'Full name is required';
      }
      
      if (!formData.email) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Email is invalid';
      }
      
      if (!formData.mobile) {
        errors.mobile = 'Mobile number is required';
      } else if (!/^01[3-9]\d{8}$/.test(formData.mobile)) {
        errors.mobile = 'Mobile number must be a valid Bangladesh number (e.g., 01712345678)';
      }
    } else if (step === 1) {
      // Validate identity information
      if (!formData.nidNumber) {
        errors.nidNumber = 'NID number is required';
      } else if (!/^[A-Z]{2}\d{8}$/.test(formData.nidNumber)) {
        errors.nidNumber = 'NID number must be in the format: BD12345678';
      }
      
      if (!formData.tinNumber) {
        errors.tinNumber = 'TIN number is required';
      } else if (!/^\d{12}$/.test(formData.tinNumber)) {
        errors.tinNumber = 'TIN number must be 12 digits';
      }
    } else if (step === 2) {
      // Validate password
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async (e) => {
    // Prevent default form submission behavior
    if (e) e.preventDefault();
    
    if (validateStep(activeStep)) {
      if (activeStep === 1) {
        // Verify NID before proceeding to the final step
        setIsSubmitting(true);
        try {
          const result = await verifyNID(formData.nidNumber, formData.fullName);
          if (result.verified) {
            setNidVerified(true);
            setActiveStep(activeStep + 1);
          } else {
            setFormErrors({
              ...formErrors,
              nidNumber: 'NID verification failed. Please check your information.'
            });
          }
        } catch (err) {
          setSubmitError('NID verification failed. Please try again.');
        } finally {
          setIsSubmitting(false);
        }
      } else if (activeStep === 0) {
        // Move from Personal Information to Identity Verification
        setActiveStep(activeStep + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous submit error
    setSubmitError('');
    
    // Validate final step
    if (!validateStep(activeStep)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Make sure NID is verified before registration
      if (!nidVerified) {
        setSubmitError('NID must be verified before registration');
        setIsSubmitting(false);
        return;
      }
      
      const success = await register(formData);
      if (success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              margin="normal"
              error={!!formErrors.fullName}
              helperText={formErrors.fullName}
              disabled={isSubmitting}
            />
            
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={isSubmitting}
            />
            
            <TextField
              fullWidth
              label="Mobile Number"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              margin="normal"
              error={!!formErrors.mobile}
              helperText={formErrors.mobile}
              disabled={isSubmitting}
              placeholder="01712345678"
            />
          </>
        );
      case 1:
        return (
          <>
            <TextField
              fullWidth
              label="NID Number"
              name="nidNumber"
              value={formData.nidNumber}
              onChange={handleChange}
              margin="normal"
              error={!!formErrors.nidNumber}
              helperText={formErrors.nidNumber}
              disabled={isSubmitting || nidVerified}
              placeholder="BD12345678"
              InputProps={{
                endAdornment: nidVerified ? (
                  <Box sx={{ color: 'success.main', display: 'flex', alignItems: 'center', mr: 1 }}>
                    <Typography variant="caption" sx={{ mr: 0.5 }}>Verified</Typography>
                    <span role="img" aria-label="verified">✅</span>
                  </Box>
                ) : null
              }}
            />
            
            <TextField
              fullWidth
              label="TIN Number"
              name="tinNumber"
              value={formData.tinNumber}
              onChange={handleChange}
              margin="normal"
              error={!!formErrors.tinNumber}
              helperText={formErrors.tinNumber}
              disabled={isSubmitting}
              placeholder="123456789012"
            />
            
            {!nidVerified && (
              <Button
                variant="contained"
                color="secondary"
                disabled={isSubmitting || !formData.nidNumber || !formData.fullName}
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    const result = await verifyNID(formData.nidNumber, formData.fullName);
                    if (result.verified) {
                      setNidVerified(true);
                    } else {
                      setFormErrors({
                        ...formErrors,
                        nidNumber: 'NID verification failed. Please check your information.'
                      });
                    }
                  } catch (err) {
                    setSubmitError('NID verification failed. Please try again.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                sx={{ mt: 2, mb: 2 }}
                fullWidth
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Verify NID'}
              </Button>
            )}
            
            {nidVerified && (
              <Alert severity="success" sx={{ mt: 2 }}>
                NID verification successful! You can now proceed to create your account.
              </Alert>
            )}
            
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Note: For demo purposes, NID numbers starting with "BD" will be verified successfully.
            </Typography>
          </>
        );
      case 2:
        return (
          <>
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              error={!!formErrors.password}
              helperText={formErrors.password}
              disabled={isSubmitting}
            />
            
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              disabled={isSubmitting}
            />
          </>
        );
      default:
        return null;
    }
  };

  if (loading && !isSubmitting) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 128px)">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Register
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          
          <form onSubmit={activeStep === steps.length - 1 ? handleSubmit : handleNext}>
            {renderStepContent(activeStep)}
            
            <Box mt={3} display="flex" justifyContent="space-between">
              <Button
                disabled={activeStep === 0 || isSubmitting}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} />
                ) : activeStep === steps.length - 1 ? (
                  'Register'
                ) : (
                  'Next'
                )}
              </Button>
            </Box>
            
            <Box mt={2} textAlign="center">
              <Typography variant="body2">
                Already have an account?{' '}
                <Link href="/login" underline="hover">
                  Login here
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
