const express = require('express');
const cors = require('cors');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { clientOrigin } = require('./config/env');

const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const endpointRoutes = require('./routes/endpoint.routes');

const app = express();

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json());
app.use(requestLogger);

// Health check - useful for Docker healthchecks and quick sanity checks
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'APIInsight backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/endpoints', endpointRoutes);

// Unknown route handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Must be last: converts thrown/forwarded errors into JSON responses
app.use(errorHandler);

module.exports = app;
