import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const Dashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    bankAccounts: [],
    taxHistory: [],
    pendingActions: [],
    stats: {
      totalTaxPaid: 0,
      currentFiscalYear: '',
      taxStatus: 'Not Paid',
      lastPayment: null
    }
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch bank accounts
        const bankAccountsResponse = await axios.get('/users/bank-accounts');
        const bankAccounts = bankAccountsResponse.data;
        
        // Fetch tax history
        const taxHistoryResponse = await axios.get('/tax/history');
        const taxHistory = taxHistoryResponse.data;
        
        // Calculate pending actions based on user data
        const pendingActions = [];
        
        // Check if user needs to declare income
        // This is a simplified example - in a real app, you would check against the current fiscal year
        if (!taxHistory.some(payment => payment.fiscalYear === '2024-2025')) {
          pendingActions.push({
            id: 'pa1',
            type: 'income_declaration',
            message: 'You need to declare your income for the current fiscal year',
            action: '/income-declaration'
          });
        }
        
        // Check if user needs to link a bank account
        if (bankAccounts.length === 0) {
          pendingActions.push({
            id: 'pa2',
            type: 'bank_account',
            message: 'Link a bank account for automated tax deduction',
            action: '/add-bank-account'
          });
        }
        
        // Calculate stats
        const totalTaxPaid = taxHistory
          .filter(payment => payment.status === 'completed')
          .reduce((total, payment) => total + payment.amount, 0);
        
        const lastPayment = taxHistory.length > 0 
          ? (taxHistory[0].createdAt || taxHistory[0].date) 
          : null;
        
        const currentFiscalYear = '2024-2025'; // This could be determined dynamically
        
        // Determine tax status based on payments for current fiscal year
        const currentYearPayments = taxHistory.filter(
          payment => payment.fiscalYear === currentFiscalYear && payment.status === 'completed'
        );
        
        let taxStatus = 'Not Paid';
        if (currentYearPayments.length > 0) {
          taxStatus = 'Partially Paid'; // This is simplified - in a real app, you would check against the required amount
        }
        
        // Combine all data
        const dashboardData = {
          bankAccounts,
          taxHistory,
          pendingActions,
          stats: {
            totalTaxPaid,
            currentFiscalYear,
            taxStatus,
            lastPayment
          }
        };
        
        setDashboardData(dashboardData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);
  
  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 128px)">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      bgcolor: '#2a1a4a', 
      minHeight: 'calc(100vh - 64px)',
      color: 'white',
      pt: 4,
      pb: 6
    }}>
      <Container maxWidth="lg">
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'light' }}>
            Welcome, {user?.fullName}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
        
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3} sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 4,
                bgcolor: '#3a2a5a',
                color: 'white',
                boxShadow: '0 4px 20px rgba(138, 75, 255, 0.2)'
              }}>
                <Typography variant="subtitle2" sx={{ color: '#b69fff', fontWeight: 'medium', mb: 1 }}>
                  Total Tax Paid
                </Typography>
                <Typography variant="h4" component="div" sx={{ mt: 1, color: 'white', fontWeight: 'bold' }}>
                  {dashboardData.stats.totalTaxPaid.toLocaleString()} BDT
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: '#b69fff' }}>
                  Fiscal Year: {dashboardData.stats.currentFiscalYear}
                </Typography>
                <Box sx={{ 
                  mt: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  position: 'relative',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  border: '4px solid #8a4bff',
                  mx: 'auto'
                }}>
                  <Typography variant="h6" sx={{ color: '#8a4bff', fontWeight: 'bold' }}>
                    +12%
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3} sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 4,
                bgcolor: '#3a2a5a',
                color: 'white',
                boxShadow: '0 4px 20px rgba(138, 75, 255, 0.2)'
              }}>
                <Typography variant="subtitle2" sx={{ color: '#b69fff', fontWeight: 'medium', mb: 1 }}>
                  Tax Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {dashboardData.stats.taxStatus === 'Paid' ? (
                    <CheckCircleIcon sx={{ mr: 1, color: '#4caf50' }} />
                  ) : (
                    <WarningIcon sx={{ mr: 1, color: '#ff9800' }} />
                  )}
                  <Typography variant="h6" component="div" sx={{ color: 'white' }}>
                    {dashboardData.stats.taxStatus}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1, color: '#b69fff' }}>
                  Last Payment: {dashboardData.stats.lastPayment 
                    ? (new Date(dashboardData.stats.lastPayment).toString() !== 'Invalid Date' 
                        ? new Date(dashboardData.stats.lastPayment).toLocaleDateString() 
                        : 'Invalid Date')
                    : 'None'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3} sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 4,
                bgcolor: '#3a2a5a',
                color: 'white',
                boxShadow: '0 4px 20px rgba(138, 75, 255, 0.2)'
              }}>
                <Typography variant="subtitle2" sx={{ color: '#b69fff', fontWeight: 'medium', mb: 1 }}>
                  Bank Accounts
                </Typography>
                <Typography variant="h4" component="div" sx={{ mt: 1, color: 'white', fontWeight: 'bold' }}>
                  {dashboardData.bankAccounts.length}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: '#b69fff' }}>
                  {dashboardData.bankAccounts.length > 0 
                    ? 'Accounts linked for tax deduction' 
                    : 'No accounts linked yet'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3} sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 4,
                bgcolor: '#3a2a5a',
                color: 'white',
                boxShadow: '0 4px 20px rgba(138, 75, 255, 0.2)'
              }}>
                <Typography variant="subtitle2" sx={{ color: '#b69fff', fontWeight: 'medium', mb: 1 }}>
                  Pending Actions
                </Typography>
                <Typography variant="h4" component="div" sx={{ mt: 1, color: 'white', fontWeight: 'bold' }}>
                  {dashboardData.pendingActions.length}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: '#b69fff' }}>
                  {dashboardData.pendingActions.length > 0 
                    ? 'Actions requiring your attention' 
                    : 'No pending actions'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        
          {/* Main Content */}
          <Grid container spacing={4}>
            {/* Pending Actions */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                borderRadius: 4, 
                bgcolor: '#3a2a5a', 
                boxShadow: '0 4px 20px rgba(138, 75, 255, 0.2)',
                overflow: 'hidden'
              }}>
                <CardContent sx={{ color: 'white' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'medium' }}>
                    Pending Actions
                  </Typography>
                  
                  {dashboardData.pendingActions.length === 0 ? (
                    <Typography variant="body1" sx={{ color: '#b69fff' }}>
                      No pending actions. You're all caught up!
                    </Typography>
                  ) : (
                    <Box sx={{ maxHeight: 300, overflow: 'auto', pr: 1 }}>
                      <List sx={{ 
                        '& .MuiListItem-root': { 
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: 'rgba(138, 75, 255, 0.1)'
                        } 
                      }}>
                        {dashboardData.pendingActions.map((action) => (
                          <React.Fragment key={action.id}>
                            <ListItem>
                              <ListItemIcon>
                                {action.type === 'income_declaration' ? (
                                  <CalculateIcon sx={{ color: '#8a4bff' }} />
                                ) : action.type === 'bank_account' ? (
                                  <AccountBalanceIcon sx={{ color: '#8a4bff' }} />
                                ) : (
                                  <WarningIcon sx={{ color: '#ff9800' }} />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={action.message}
                                primaryTypographyProps={{ color: 'white' }}
                              />
                              <Button
                                size="small"
                                endIcon={<ArrowForwardIcon />}
                                onClick={() => navigate(action.action)}
                                sx={{ 
                                  bgcolor: '#8a4bff', 
                                  color: 'white',
                                  '&:hover': {
                                    bgcolor: '#7a3bef'
                                  }
                                }}
                              >
                                Take Action
                              </Button>
                            </ListItem>
                          </React.Fragment>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'flex-end', p: 2, bgcolor: 'rgba(0,0,0,0.1)' }}>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/income-declaration')}
                    sx={{ 
                      color: '#b69fff',
                      '&:hover': {
                        bgcolor: 'rgba(138, 75, 255, 0.1)'
                      }
                    }}
                  >
                    Declare Income
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/tax-calculation')}
                    sx={{ 
                      color: '#b69fff',
                      '&:hover': {
                        bgcolor: 'rgba(138, 75, 255, 0.1)'
                      }
                    }}
                  >
                    Calculate Tax
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            {/* Recent Tax Payments */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                borderRadius: 4, 
                bgcolor: '#3a2a5a', 
                boxShadow: '0 4px 20px rgba(138, 75, 255, 0.2)',
                overflow: 'hidden'
              }}>
                <CardContent sx={{ color: 'white' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'medium' }}>
                    Recent Tax Payments
                  </Typography>
                  
                  {dashboardData.taxHistory.length === 0 ? (
                    <Typography variant="body1" sx={{ color: '#b69fff' }}>
                      No tax payment history found.
                    </Typography>
                  ) : (
                    <Box sx={{ maxHeight: 300, overflow: 'auto', pr: 1 }}>
                      <List sx={{ 
                        '& .MuiListItem-root': { 
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: 'rgba(138, 75, 255, 0.1)'
                        } 
                      }}>
                        {dashboardData.taxHistory.map((payment) => (
                          <React.Fragment key={payment._id}>
                            <ListItem>
                              <ListItemIcon>
                                <ReceiptIcon sx={{ color: '#8a4bff' }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={`${payment.amount.toLocaleString()} BDT`}
                                primaryTypographyProps={{ color: 'white', fontWeight: 'bold' }}
                                secondary={
                                  <>
                                    <Typography variant="caption" component="span" display="block" sx={{ color: '#b69fff' }}>
                                      Payment Date: {new Date(payment.createdAt || payment.date).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="caption" component="span" display="block" sx={{ color: '#b69fff' }}>
                                      Transaction Date: {payment.transactionDate 
                                        ? new Date(payment.transactionDate).toLocaleDateString() 
                                        : payment.status === 'completed' 
                                          ? new Date(payment.updatedAt || payment.date).toLocaleDateString()
                                          : 'Pending'}
                                    </Typography>
                                    <Typography variant="caption" component="span" display="block" sx={{ color: '#b69fff' }}>
                                      Receipt: {payment.receiptId || 'Pending'}
                                    </Typography>
                                  </>
                                }
                              />
                              <Button
                                size="small"
                                onClick={() => navigate(`/tax-receipt/${payment._id}`)}
                                disabled={payment.status !== 'completed'}
                                sx={{ 
                                  bgcolor: '#8a4bff', 
                                  color: 'white',
                                  '&:hover': {
                                    bgcolor: '#7a3bef'
                                  },
                                  '&.Mui-disabled': {
                                    bgcolor: 'rgba(138, 75, 255, 0.3)',
                                    color: 'rgba(255, 255, 255, 0.5)'
                                  }
                                }}
                              >
                                View Receipt
                              </Button>
                            </ListItem>
                          </React.Fragment>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'flex-end', p: 2, bgcolor: 'rgba(0,0,0,0.1)' }}>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/tax-payment')}
                    sx={{ 
                      color: '#b69fff',
                      '&:hover': {
                        bgcolor: 'rgba(138, 75, 255, 0.1)'
                      }
                    }}
                  >
                    Pay Tax
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/tax-history')}
                    sx={{ 
                      color: '#b69fff',
                      '&:hover': {
                        bgcolor: 'rgba(138, 75, 255, 0.1)'
                      }
                    }}
                  >
                    View All History
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            {/* Quick Actions */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ 
                p: 3, 
                borderRadius: 4,
                bgcolor: '#3a2a5a',
                boxShadow: '0 4px 20px rgba(138, 75, 255, 0.2)'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'medium' }}>
                  Quick Actions
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6} sm={3}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<CalculateIcon />}
                      onClick={() => navigate('/income-declaration')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        py: 1.5,
                        bgcolor: '#8a4bff',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: '#7a3bef'
                        }
                      }}
                    >
                      Declare Income
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<AccountBalanceIcon />}
                      onClick={() => navigate('/bank-accounts')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        py: 1.5,
                        bgcolor: '#8a4bff',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: '#7a3bef'
                        }
                      }}
                    >
                      Manage Bank Accounts
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<PaymentIcon />}
                      onClick={() => navigate('/tax-payment')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        py: 1.5,
                        bgcolor: '#8a4bff',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: '#7a3bef'
                        }
                      }}
                    >
                      Pay Tax
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<ReceiptIcon />}
                      onClick={() => navigate('/tax-history')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        py: 1.5,
                        bgcolor: '#8a4bff',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: '#7a3bef'
                        }
                      }}
                    >
                      View Tax History
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;
