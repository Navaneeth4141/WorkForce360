import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import path from 'path';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static storage for payslips and invoices
app.use('/storage', express.static(path.resolve('storage')));

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'WorkForce360 API Server is running.' });
});


// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
