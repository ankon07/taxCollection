const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const taxRoutes = require('./routes/taxRoutes');
const zkpRoutes = require('./routes/zkpRoutes');
const blockchainRoutes = require('./routes/blockchainRoutes');

// Initialize Express app
const app = express();

// Middleware
// Configure CORS based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [/\.vercel\.app$/, /localhost/] // Allow Vercel domains and localhost
    : process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://ankonahamed:Meraxix@7@tax-collector.igqblay.mongodb.net/?retryWrites=true&w=majority&appName=tax-collector', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Continuing without database connection. Some features may not work properly.');
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/zkp', zkpRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('ZKP Tax System API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
