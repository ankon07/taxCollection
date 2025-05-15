import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import {
  VerifiedUser as VerifiedUserIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const TaxReceipt = () => {
  const { id } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);
  
  // Fetch receipt data on component mount
  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        
        // Fetch the receipt data from the backend
        const response = await axios.get(`/tax/receipt/${id}`);
        
        if (!response.data || !response.data.receipt) {
          throw new Error('Receipt data not found');
        }
        
        // Get the receipt data from the response
        const receiptData = response.data.receipt;
        
        // Check if there's a verification error
        const verificationStatus = response.data.verificationStatus;
        
        // Set the receipt data directly from the backend
        setReceipt({
          ...receiptData,
          // Add some display-only fields that don't affect the actual data
          fiscalYear: '2024-2025',
          receiptNumber: `RCPT-${id.substring(0, 8)}`,
          taxAuthority: 'National Board of Revenue, Bangladesh',
          status: 'completed',
          // Add verification status if available
          verificationStatus: verificationStatus
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching receipt:', err);
        setError('Failed to load receipt. Please try again.');
        setLoading(false);
      }
    };
    
    if (isAuthenticated && id) {
      fetchReceipt();
    }
  }, [isAuthenticated, id, user]);
  
  const handlePrint = () => {
    window.print();
  };
  
  const receiptRef = useRef(null);

  const handleDownload = () => {
    try {
      // Show loading toast
      toast.info('Preparing your receipt for download...', { autoClose: 2000 });
      
      // Use the ref to get the receipt container element
      if (!receiptRef.current) {
        throw new Error('Receipt element not found');
      }
      
      // Use html2canvas to capture the receipt as an image
      html2canvas(receiptRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#2a1a4a' // Match the background color
      }).then(canvas => {
        // Create a new PDF document
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Calculate dimensions to fit the image on the page
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add the image to the PDF
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // If the image is taller than the page, add more pages
        let heightLeft = imgHeight;
        let position = 0;
        
        // Remove the first page that was automatically added
        if (heightLeft < pageHeight) {
          // Save the PDF
          doc.save(`Tax_Receipt_${receipt.receiptId || receipt.paymentId}.pdf`);
          toast.success('Receipt downloaded as PDF');
          return;
        }
        
        // Add additional pages if needed
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        // Save the PDF
        doc.save(`Tax_Receipt_${receipt.receiptId || receipt.paymentId}.pdf`);
        toast.success('Receipt downloaded as PDF');
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download receipt. Please try again.');
    }
  };
  
  const handleBack = () => {
    navigate('/tax-history');
  };
  
  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 128px)">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md">
        <Box my={4}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Tax History
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (!receipt) {
    return (
      <Container maxWidth="md">
        <Box my={4}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Receipt not found
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Tax History
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Box sx={{ 
      bgcolor: '#2a1a4a', 
      minHeight: 'calc(100vh - 128px)',
      py: 4
    }}>
      <Container maxWidth="md">
        <Box className="receipt-page">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ color: 'white' }}>
              Tax Payment Receipt
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ 
                  color: '#b69fff',
                  borderColor: '#8a4bff',
                  '&:hover': {
                    borderColor: '#b69fff',
                    bgcolor: 'rgba(138, 75, 255, 0.1)'
                  }
                }}
              >
                Print
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ 
                  bgcolor: '#8a4bff',
                  '&:hover': {
                    bgcolor: '#7a3bef'
                  }
                }}
              >
                Download
              </Button>
            </Box>
          </Box>
        
          <Paper 
            ref={receiptRef}
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 4,
              bgcolor: '#2a1a4a',
              boxShadow: '0 4px 20px rgba(138, 75, 255, 0.3)',
              color: 'white'
            }} 
            className="receipt-container"
          >
            {/* Receipt Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                National Board of Revenue
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ color: '#b69fff' }}>
                Government of the People's Republic of Bangladesh
              </Typography>
              <Typography variant="body1" sx={{ color: '#b69fff' }}>
                Tax Payment Receipt for Fiscal Year {receipt.fiscalYear}
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 4, borderColor: 'rgba(138, 75, 255, 0.2)' }} />
            
            {/* Payment Details */}
            <Typography variant="h6" sx={{ 
              color: 'white', 
              fontWeight: 'bold', 
              mb: 2,
              pl: 2,
              borderLeft: '4px solid #8a4bff'
            }}>
              Payment Details:
            </Typography>
            
            <Box sx={{ 
              bgcolor: '#3a2a5a', 
              borderRadius: 3, 
              p: 3, 
              mb: 4,
              boxShadow: '0 4px 20px rgba(138, 75, 255, 0.2)',
              border: '1px solid rgba(138, 75, 255, 0.2)'
            }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body1" sx={{ color: '#b69fff', fontWeight: 'medium' }}>
                    Payment ID:
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body1" sx={{ color: 'white', fontFamily: 'monospace' }}>
                    {receipt.paymentId}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body1" sx={{ color: '#b69fff', fontWeight: 'medium' }}>
                    Amount:
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {receipt.amount.toLocaleString()} BDT
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body1" sx={{ color: '#b69fff', fontWeight: 'medium' }}>
                    Bank Account:
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  {receipt.bankAccount ? (
                    <Typography variant="body1" sx={{ color: 'white' }}>
                      {receipt.bankAccount.bankName} - {receipt.bankAccount.accountNumber}
                    </Typography>
                  ) : (
                    <Typography variant="body1" sx={{ color: 'white' }}>
                      Not specified
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body1" sx={{ color: '#b69fff', fontWeight: 'medium' }}>
                    Transaction Hash:
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body1" sx={{ color: 'white', fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                    {receipt.transactionHash === 'Not available' ? 'Not available' : receipt.transactionHash}
                  </Typography>
                  {receipt.transactionHash !== 'Not available' && (
                    <Button 
                      size="small" 
                      sx={{ 
                        mt: 0.5,
                        color: '#b69fff',
                        '&:hover': {
                          bgcolor: 'rgba(138, 75, 255, 0.2)'
                        }
                      }}
                      onClick={() => window.open(`${process.env.REACT_APP_BLOCKCHAIN_EXPLORER_URL || 'https://sepolia.etherscan.io'}/tx/${receipt.transactionHash}`, '_blank')}
                    >
                      View on Blockchain Explorer
                    </Button>
                  )}
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body1" sx={{ color: '#b69fff', fontWeight: 'medium' }}>
                    Date:
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    {new Date(receipt.date).toLocaleString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body1" sx={{ color: '#b69fff', fontWeight: 'medium' }}>
                    Status:
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body1" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                    {receipt.status.toUpperCase()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          
            {/* Blockchain Verification */}
            <Typography variant="h6" sx={{ 
              color: 'white', 
              fontWeight: 'bold', 
              mb: 2,
              pl: 2,
              borderLeft: '4px solid #8a4bff'
            }}>
              Blockchain Verification:
            </Typography>
            
            <Paper elevation={0} sx={{ 
              p: 3, 
              bgcolor: '#3a2a5a', 
              mb: 4,
              borderRadius: 3,
              border: receipt.blockchainVerified ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255, 152, 0, 0.3)',
              boxShadow: '0 4px 20px rgba(138, 75, 255, 0.2)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VerifiedUserIcon 
                  color={receipt.blockchainVerified ? "success" : "warning"} 
                  sx={{ mr: 1, fontSize: '2rem' }} 
                />
                <Typography variant="h6" sx={{ color: receipt.blockchainVerified ? '#4caf50' : '#ff9800' }}>
                  {receipt.blockchainVerified ? 'Verified on Blockchain' : 'Verification Pending'}
                </Typography>
              </Box>
              
              <Typography variant="body2" paragraph sx={{ color: 'white' }}>
                {receipt.blockchainVerified 
                  ? "This tax payment has been verified and recorded on the blockchain for transparency and immutability."
                  : "This tax payment record exists in our system, but blockchain verification is currently unavailable."}
              </Typography>
              
              {receipt.verificationStatus && !receipt.blockchainVerified && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Verification Issue: {receipt.verificationStatus.error || "Unable to verify on blockchain"}
                </Alert>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" sx={{ color: '#8a4bff', fontWeight: 'medium' }}>
                    Block Number:
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'white' }}>
                    {receipt.blockchainData?.blockNumber || 'Not available'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" sx={{ color: '#8a4bff', fontWeight: 'medium' }}>
                    Proof ID:
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'white' }}>
                    {receipt.proofId || 'Not available'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" sx={{ color: '#8a4bff', fontWeight: 'medium' }}>
                    Verification Status:
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: receipt.blockchainVerified ? '#4caf50' : '#ff9800', 
                      fontWeight: 'bold' 
                    }}
                  >
                    {receipt.blockchainVerified ? 'VERIFIED' : 'UNVERIFIED'}
                  </Typography>
                </Grid>
                
                {receipt.blockchainData?.timestamp && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" sx={{ color: '#8a4bff', fontWeight: 'medium' }}>
                        Blockchain Timestamp:
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        {new Date(receipt.blockchainData.timestamp).toLocaleString()}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
          
            {/* Footer */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#b69fff', mb: 1 }}>
                This is an electronically generated receipt and does not require a physical signature.
              </Typography>
              <Typography variant="body2" sx={{ color: '#b69fff' }}>
                For any queries, please contact the National Board of Revenue at support@nbr.gov.bd
              </Typography>
            </Box>
          </Paper>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ 
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.5)',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Back to Tax History
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default TaxReceipt;
