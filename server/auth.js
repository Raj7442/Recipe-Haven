const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const TOKEN_EXP = '7d';

async function createUser(username, password) {
  const client = await pool.connect();
  try {
    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await client.query('INSERT INTO users (username, password_hash) VALUES ($1,$2) RETURNING id, username', [username, hashed]);
    return rows[0];
  } finally {
    client.release();
  }
}

async function findUserByUsername(username) {
  if (!pool) return null;
  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query('SELECT id, username, password_hash FROM users WHERE username=$1', [username]);
      return rows[0];
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database query failed:', err.message);
    return null;
  }
}

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXP });
}

function authenticateMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { createUser, findUserByUsername, signToken, authenticateMiddleware };
