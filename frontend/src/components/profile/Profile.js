import React, { useState, useContext, useEffect } from 'react';
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
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Key as KeyIcon,
  AccountBalance as AccountBalanceIcon,
  VerifiedUser as VerifiedUserIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, loading: authLoading, updateProfile, generateBlockchainKeys } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [generatingKeys, setGeneratingKeys] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: ''
  });
  
  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        mobile: user.mobile || ''
      });
    }
  }, [user]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleEdit = () => {
    setEditMode(true);
  };
  
  const handleCancel = () => {
    // Reset form data to user data
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        mobile: user.mobile || ''
      });
    }
    setEditMode(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const success = await updateProfile(formData);
      
      if (success) {
        setEditMode(false);
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateKeys = async () => {
    try {
      setGeneratingKeys(true);
      setError(null);
      
      const publicKey = await generateBlockchainKeys();
      
      if (publicKey) {
        toast.success('Blockchain keys generated successfully!');
      }
    } catch (err) {
      console.error('Error generating blockchain keys:', err);
      setError('Failed to generate blockchain keys. Please try again.');
    } finally {
      setGeneratingKeys(false);
    }
  };
  
  const handleManageBankAccounts = () => {
    navigate('/bank-accounts');
  };
  
  if (authLoading) {
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
          My Profile
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={4}>
          {/* Profile Information */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Personal Information
                </Typography>
                
                {!editMode ? (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                  </Box>
                )}
              </Box>
              
              <form>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={!editMode || loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!editMode || loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mobile Number"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      disabled={!editMode || loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="NID Number"
                      value={user?.nidNumber || ''}
                      disabled
                      InputProps={{
                        endAdornment: user?.isVerified && (
                          <Tooltip title="Verified">
                            <VerifiedUserIcon color="success" />
                          </Tooltip>
                        )
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="TIN Number"
                      value={user?.tinNumber || ''}
                      disabled
                    />
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>
          
          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* User Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    margin: '0 auto 16px',
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem'
                  }}
                >
                  {user?.fullName?.charAt(0) || 'U'}
                </Avatar>
                
                <Typography variant="h5" gutterBottom>
                  {user?.fullName}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {user?.email}
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <Chip
                    icon={<VerifiedUserIcon />}
                    label="Verified"
                    color="success"
                    variant="outlined"
                  />
                  
                  <Chip
                    label="Taxpayer"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
            
            {/* Blockchain Keys */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Blockchain Keys
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SecurityIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {user?.hasBlockchainKeys 
                      ? 'You have generated blockchain keys for secure transactions.' 
                      : 'Generate blockchain keys to enable secure transactions.'}
                  </Typography>
                </Box>
                
                {user?.hasBlockchainKeys && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Your blockchain identity is active and verified.
                  </Alert>
                )}
              </CardContent>
              
              <CardActions>
                <Button
                  fullWidth
                  variant={user?.hasBlockchainKeys ? 'outlined' : 'contained'}
                  startIcon={<KeyIcon />}
                  onClick={handleGenerateKeys}
                  disabled={generatingKeys}
                >
                  {generatingKeys 
                    ? <CircularProgress size={24} /> 
                    : user?.hasBlockchainKeys 
                      ? 'Regenerate Keys' 
                      : 'Generate Keys'}
                </Button>
              </CardActions>
            </Card>
            
            {/* Bank Accounts */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bank Accounts
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Manage your bank accounts for tax payments.
                  </Typography>
                </Box>
              </CardContent>
              
              <CardActions>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleManageBankAccounts}
                >
                  Manage Bank Accounts
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Profile;
