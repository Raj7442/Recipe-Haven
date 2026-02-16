const express = require('express');
const cors = require('cors');
const db = require('./server/db');
const { findUserByUsername, signToken, authenticateMiddleware } = require('./server/auth');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3002;

// CORS for Vercel frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', dbReady: db.dbReady });
});

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const existing = await findUserByUsername(username);
    if (existing) return res.status(409).json({ error: 'username taken' });
    const client = await db.pool.connect();
    try {
      const hashed = await bcrypt.hash(password, 10);
      const { rows } = await client.query('INSERT INTO users (username, password_hash) VALUES ($1,$2) RETURNING id, username', [username, hashed]);
      const user = rows[0];
      const token = signToken(user);
      res.status(201).json({ token, id: user.id, username: user.username });
    } finally { client.release(); }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const user = await findUserByUsername(username);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = signToken(user);
    res.json({ token, id: user.id, username: user.username });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/auth/me', authenticateMiddleware, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

// Recipe routes
app.get('/api/recipes', authenticateMiddleware, async (req, res) => {
  if (!db.dbReady) return res.status(503).json({ error: 'database unavailable' });
  try {
    const { rows } = await db.pool.query('SELECT * FROM recipes WHERE owner_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.get('/api/recipes/count', authenticateMiddleware, async (req, res) => {
  if (!db.dbReady) return res.status(503).json({ error: 'database unavailable' });
  try {
    const { rows } = await db.pool.query('SELECT COUNT(*)::int AS count FROM recipes WHERE owner_id = $1', [req.user.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.post('/api/recipes', authenticateMiddleware, async (req, res) => {
  if (!db.dbReady) return res.status(503).json({ error: 'database unavailable' });
  const { title, image, calories, ingredients } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const { rows } = await db.pool.query(
      'INSERT INTO recipes (owner_id, title, image, calories, ingredients) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, title, image, calories, ingredients]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.put('/api/recipes/:id', authenticateMiddleware, async (req, res) => {
  if (!db.dbReady) return res.status(503).json({ error: 'database unavailable' });
  const { title, image, calories, ingredients } = req.body;
  try {
    const { rows: existing } = await db.pool.query('SELECT * FROM recipes WHERE id=$1', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'not found' });
    if (String(existing[0].owner_id) !== String(req.user.id)) return res.status(403).json({ error: 'forbidden' });
    const { rows } = await db.pool.query(
      'UPDATE recipes SET title=$1,image=$2,calories=$3,ingredients=$4 WHERE id=$5 RETURNING *',
      [title || existing[0].title, image || existing[0].image, calories || existing[0].calories, ingredients || existing[0].ingredients, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.delete('/api/recipes/:id', authenticateMiddleware, async (req, res) => {
  if (!db.dbReady) return res.status(503).json({ error: 'database unavailable' });
  try {
    const { rows: existing } = await db.pool.query('SELECT * FROM recipes WHERE id=$1', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'not found' });
    if (String(existing[0].owner_id) !== String(req.user.id)) return res.status(403).json({ error: 'forbidden' });
    await db.pool.query('DELETE FROM recipes WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

db.init().then(() => {
  app.listen(PORT, () => console.log(`API server on ${PORT}`));
}).catch((err) => {
  console.error('DB init failed', err);
  app.listen(PORT, () => console.log(`API server on ${PORT} (degraded)`));
});
