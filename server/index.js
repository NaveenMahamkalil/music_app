require('dotenv').config()

const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { randomUUID } = require('crypto')
const mysql = require('mysql2/promise')

const PORT = Number(process.env.PORT || 5000)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const TOKEN_TTL = process.env.JWT_TTL || '30d'

const app = express()

app.use(
  cors({
    origin: ['http://localhost:5173'],
    credentials: false,
  }),
)
app.use(express.json())

function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

function authRequired(req, res, next) {
  const header = req.header('authorization') || ''
  const [type, token] = header.split(' ')
  if (type !== 'Bearer' || !token) return res.status(401).json({ error: 'unauthorized' })

  try {
    req.auth = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }
}

let db

async function initDb() {
  const {
    DB_HOST = 'localhost',
    DB_PORT = '3306',
    DB_USER = 'root',
    DB_PASSWORD = '',
    DB_DATABASE = 'music',
  } = process.env

  db = await mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      passwordHash VARCHAR(255) NOT NULL,
      createdAt DATETIME(6) NOT NULL,
      baseGenre VARCHAR(64) NOT NULL,
      moodGenres JSON NOT NULL,
      mode VARCHAR(16) NOT NULL,
      mood VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

async function findUserByEmail(email) {
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email])
  return rows[0] || null
}

async function findUserById(id) {
  const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id])
  return rows[0] || null
}

async function createUser(user) {
  const moodGenresJson = JSON.stringify(user.moodGenres)
  await db.execute(
    'INSERT INTO users (id, name, email, passwordHash, createdAt, baseGenre, moodGenres, mode, mood) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      user.id,
      user.name,
      user.email,
      user.passwordHash,
      user.createdAt,
      user.baseGenre,
      moodGenresJson,
      user.mode,
      user.mood,
    ],
  )
}

async function updateUserPreferences(userId, { baseGenre, moodGenres, mode, mood }) {
  await db.execute(
    'UPDATE users SET baseGenre = ?, moodGenres = ?, mode = ?, mood = ? WHERE id = ?',
    [baseGenre, JSON.stringify(moodGenres), mode, mood, userId],
  )
}

function parseUser(row) {
  if (!row) return null
  const moodGenres =
    row.moodGenres == null
      ? null
      : typeof row.moodGenres === 'string'
        ? JSON.parse(row.moodGenres)
        : row.moodGenres
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.createdAt,
    preferences: {
      baseGenre: row.baseGenre,
      moodGenres,
      mode: row.mode,
      mood: row.mood,
    },
  }
}

app.post('/api/auth/signup', async (req, res) => {
  const name = String(req.body?.name || '').trim()
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  if (!name || !email || !password) return res.status(400).json({ error: 'missing_fields' })
  if (password.length < 6) return res.status(400).json({ error: 'weak_password' })

  const existing = await findUserByEmail(email)
  if (existing) return res.status(409).json({ error: 'email_in_use' })

  const passwordHash = await bcrypt.hash(password, 10)
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const user = {
    id: randomUUID(),
    name,
    email,
    passwordHash,
    createdAt: now,
    baseGenre: 'pop',
    moodGenres: { happy: 'pop', sad: 'pop', relaxed: 'pop', energetic: 'pop', chill: 'pop', angry: 'pop' },
    mode: 'on',
    mood: 'happy',
  }

  await createUser(user)

  const token = signToken(user)
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
})

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  if (!email || !password) return res.status(400).json({ error: 'missing_fields' })

  const row = await findUserByEmail(email)
  if (!row) return res.status(401).json({ error: 'invalid_credentials' })

  const ok = await bcrypt.compare(password, row.passwordHash)
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' })

  const user = parseUser(row)
  const token = signToken(user)
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
})

app.get('/api/auth/me', authRequired, async (req, res) => {
  const userId = req.auth?.sub
  const row = await findUserById(userId)
  if (!row) return res.status(401).json({ error: 'unauthorized' })

  const user = parseUser(row)
  res.json({ user: { id: user.id, name: user.name, email: user.email } })
})

app.get('/api/user/preferences', authRequired, async (req, res) => {
  const userId = req.auth?.sub
  const row = await findUserById(userId)
  if (!row) return res.status(401).json({ error: 'unauthorized' })

  const user = parseUser(row)
  res.json({ preferences: user.preferences })
})

app.post('/api/user/preferences', authRequired, async (req, res) => {
  const userId = req.auth?.sub
  const row = await findUserById(userId)
  if (!row) return res.status(401).json({ error: 'unauthorized' })

  const baseGenre = String(req.body?.baseGenre || 'pop')
  const mood = String(req.body?.mood || 'happy')
  const mode = req.body?.mode === 'off' ? 'off' : 'on'
  const moodGenres = {
    happy: String(req.body?.moodGenres?.happy || 'pop'),
    sad: String(req.body?.moodGenres?.sad || 'pop'),
    relaxed: String(req.body?.moodGenres?.relaxed || 'pop'),
    energetic: String(req.body?.moodGenres?.energetic || 'pop'),
    chill: String(req.body?.moodGenres?.chill || 'pop'),
    angry: String(req.body?.moodGenres?.angry || 'pop'),
  }

  await updateUserPreferences(userId, { baseGenre, moodGenres, mode, mood })
  res.json({ preferences: { baseGenre, moodGenres, mode, mood } })
})

initDb()
  .then(() => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize database', err)
    process.exit(1)
  })

