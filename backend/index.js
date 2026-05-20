const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const uploadRoutes = require('./routes/upload');
const shareRoutes = require('./routes/share');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/share', shareRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Wait for sql.js WASM to load before accepting connections
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`DocuFlow backend running on http://localhost:${PORT}`);
    console.log('Seeded users: alice@docuflow.dev / bob@docuflow.dev / carol@docuflow.dev (password: password123)');
  });
}).catch(err => {
  console.error('Failed to initialise database:', err);
  process.exit(1);
});
