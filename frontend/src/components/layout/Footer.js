import React from 'react';
import { Box, Typography, Container, Link, Divider } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: '#2a1a4a',
        borderTop: '1px solid rgba(138, 75, 255, 0.2)',
        color: 'white'
      }}
    >
      <Container maxWidth="lg">
        <Divider sx={{ mb: 3, borderColor: 'rgba(138, 75, 255, 0.2)' }} />
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', md: 'flex-start' }
          }}
        >
          <Box sx={{ mb: { xs: 2, md: 0 } }}>
            <Typography variant="h6" gutterBottom sx={{ 
              color: 'white',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Box 
                component="span" 
                sx={{ 
                  color: '#8a4bff', 
                  mr: 1, 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold' 
                }}
              >
                ZKP
              </Box>
              Tax System
            </Typography>
            <Typography variant="body2" sx={{ color: '#b69fff' }}>
              A blockchain-powered tax collection system with Zero-Knowledge Proofs
            </Typography>
          </Box>
          
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 2, sm: 4 }
            }}
          >
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                Resources
              </Typography>
              <Link href="#" display="block" underline="hover" sx={{ 
                color: '#b69fff',
                '&:hover': {
                  color: '#8a4bff'
                }
              }}>
                Help Center
              </Link>
              <Link href="#" display="block" underline="hover" sx={{ 
                color: '#b69fff',
                '&:hover': {
                  color: '#8a4bff'
                }
              }}>
                Privacy Policy
              </Link>
              <Link href="#" display="block" underline="hover" sx={{ 
                color: '#b69fff',
                '&:hover': {
                  color: '#8a4bff'
                }
              }}>
                Terms of Service
              </Link>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                Contact
              </Typography>
              <Typography variant="body2" sx={{ color: '#b69fff' }}>
                National Board of Revenue
              </Typography>
              <Typography variant="body2" sx={{ color: '#b69fff' }}>
                Dhaka, Bangladesh
              </Typography>
              <Typography variant="body2" sx={{ color: '#b69fff' }}>
                Email: support@zkptax.gov.bd
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box mt={3} textAlign="center">
          <Typography variant="body2" sx={{ color: '#b69fff' }}>
            {'© '}
            {new Date().getFullYear()}
            {' ZKP Tax System. All rights reserved.'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#b69fff', mt: 1, display: 'block' }}>
            This is a demo application for educational purposes only.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
