// MUST BE FIRST - Load environment variables BEFORE any other requires
require('dotenv').config();

const express = require('express');
const path = require('path');
const db = require('./server/db');
const { createUser, findUserByUsername, signToken, authenticateMiddleware } = require('./server/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3002;

// Verify JWT_SECRET is loaded
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET not found in environment variables');
  console.error('Make sure .env file exists in project root with JWT_SECRET=your_secret_key');
  process.exit(1);
}

app.use(express.json());

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
  
  // Validate input
  if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters long' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  
  // Check if database is available
  if (!db.dbReady) {
    return res.status(503).json({ error: 'Database unavailable. Please try again later.' });
  }
  
  try {
    const existing = await findUserByUsername(username);
    if (existing) return res.status(409).json({ error: 'Username already taken. Please choose a different username.' });
    
    const user = await (async () => {
      const client = await db.pool.connect();
      try {
        const hashed = await bcrypt.hash(password, 10);
        const { rows } = await client.query('INSERT INTO users (username, password_hash) VALUES ($1,$2) RETURNING id, username', [username, hashed]);
        return rows[0];
      } finally { client.release(); }
    })();
    
    const token = signToken(user);
    res.status(201).json({ token, id: user.id, username: user.username });
  } catch (e) {
    console.error('Signup error:', e.message, e.code);
    if (e.code === '23505') { // PostgreSQL unique violation
      res.status(409).json({ error: 'Username already taken' });
    } else {
      res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  
  try {
    // Always try database first if available
    if (db.dbReady) {
      const user = await findUserByUsername(username);
      if (!user) return res.status(401).json({ error: 'User not found. Please sign up first.' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid password' });
      const token = signToken(user);
      return res.json({ token, id: user.id, username: user.username });
    } else {
      // Database not available - check localStorage fallback users
      // This should only work for users who signed up in this session
      return res.status(503).json({ error: 'Database unavailable. Please try again later or contact support.' });
    }
  } catch (e) {
    console.error('Login error:', e.message, e.code);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/auth/me', authenticateMiddleware, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

// Protected recipe routes
app.get('/api/recipes', authenticateMiddleware, async (req, res) => {
  if (!db.dbReady) return res.status(503).json({ error: 'database unavailable' });
  const ownerId = String(req.user.id); // Ensure consistent string type
  try {
    const { rows } = await db.pool.query('SELECT * FROM recipes WHERE owner_id = $1 ORDER BY created_at DESC', [ownerId]);
    res.json(rows);
  } catch (e) {
    console.error('Error fetching recipes:', e);
    res.status(500).json({ error: 'db error' });
  }
});

// Count
app.get('/api/recipes/count', authenticateMiddleware, async (req, res) => {
  if (!db.dbReady) return res.status(503).json({ error: 'database unavailable' });
  const ownerId = String(req.user.id); // Ensure consistent string type
  try {
    const { rows } = await db.pool.query('SELECT COUNT(*)::int AS count FROM recipes WHERE owner_id = $1', [ownerId]);
    res.json(rows[0]);
  } catch (e) {
    console.error('Error counting recipes:', e);
    res.status(500).json({ error: 'db error' });
  }
});

app.post('/api/recipes', async (req, res) => {
  if (!db.dbReady) return res.status(503).json({ error: 'database unavailable' });

  const tokenHeader = req.headers.authorization;
  let ownerId = req.body.ownerId;
  
  if (tokenHeader && tokenHeader.startsWith('Bearer ')) {
    try {
      const token = tokenHeader.slice(7);
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET environment variable is missing');
        return res.status(500).json({ error: 'server configuration error' });
      }
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      ownerId = String(payload.id); // Ensure consistent string type
    } catch (e) {
      console.error('Token verification failed:', e.message);
      // Continue with ownerId from body if token is invalid
    }
  }

  const { title, image, calories, ingredients } = req.body;
  if (!ownerId || !title) return res.status(400).json({ error: 'ownerId and title required' });

  try {
    const { rows } = await db.pool.query(
      'INSERT INTO recipes (owner_id, title, image, calories, ingredients) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [String(ownerId), title, image, calories, ingredients] // Ensure ownerId is string
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Error saving recipe:', e);
    res.status(500).json({ error: 'db error' });
  }
});

app.put('/api/recipes/:id', authenticateMiddleware, async (req, res) => {
  if (!db.dbReady) return res.status(503).json({ error: 'database unavailable' });
  const id = req.params.id;
  const { title, image, calories, ingredients } = req.body;
  const ownerId = String(req.user.id); // Ensure consistent string type

  try {
    const { rows: existing } = await db.pool.query('SELECT * FROM recipes WHERE id=$1', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'not found' });
    if (String(existing[0].owner_id) !== ownerId) return res.status(403).json({ error: 'forbidden' });

    const { rows } = await db.pool.query(
      'UPDATE recipes SET title=$1,image=$2,calories=$3,ingredients=$4 WHERE id=$5 RETURNING *',
      [title || existing[0].title, image || existing[0].image, calories || existing[0].calories, ingredients || existing[0].ingredients, id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('Error updating recipe:', e);
    res.status(500).json({ error: 'db error' });
  }
});

app.delete('/api/recipes/:id', authenticateMiddleware, async (req, res) => {
  if (!db.dbReady) return res.status(503).json({ error: 'database unavailable' });
  const id = req.params.id;
  const ownerId = String(req.user.id); // Ensure consistent string type

  try {
    const { rows: existing } = await db.pool.query('SELECT * FROM recipes WHERE id=$1', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'not found' });
    if (String(existing[0].owner_id) !== ownerId) return res.status(403).json({ error: 'forbidden' });
    await db.pool.query('DELETE FROM recipes WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Error deleting recipe:', e);
    res.status(500).json({ error: 'db error' });
  }
});

// Serve static files from the React app build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  // Fallback to index.html for client-side routing (SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Global error handlers
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// PERMANENT FIX: Auto-select available port if busy
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`✅ Server listening on http://localhost:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
};

// Initialize database and start server
db.init().then(() => {
  console.log('✅ Database initialized successfully');
  console.log('📝 Users can now sign up and login');
  startServer(PORT);
}).catch((err) => {
  console.error('❌ Database initialization failed:', err.message);
  console.log('⚠️  Starting server in limited mode - authentication disabled');
  console.log('🔧 Please ensure PostgreSQL is running and DATABASE_URL is correct');
  startServer(PORT);
});