require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true }));
app.use(express.json({ limit: '50mb' }));

// New routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/ai',       require('./routes/ai'));
app.use('/api/business', require('./routes/business'));
app.use('/api/tracker',  require('./routes/tracker'));
app.use('/api/social',   require('./routes/social'));
app.use('/api/oauth',    require('./routes/oauth'));
app.use('/api/posts',    require('./routes/posts'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Start after DB sync
const { syncDatabase } = require('./models');
syncDatabase()
  .then(() => app.listen(PORT, () => console.log(`IGS Server → http://localhost:${PORT}`)))
  .catch(err => { console.error('DB sync failed:', err.message); process.exit(1); });
