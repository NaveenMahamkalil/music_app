const fs = require('fs/promises')
const path = require('path')

const dataDir = path.join(__dirname, '..', 'data')
const usersFile = path.join(dataDir, 'users.json')

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true })
  try {
    await fs.access(usersFile)
  } catch {
    await fs.writeFile(usersFile, JSON.stringify([], null, 2), 'utf8')
  }
}

async function readUsers() {
  await ensureStore()
  const raw = await fs.readFile(usersFile, 'utf8')
  try {
    const users = JSON.parse(raw)
    return Array.isArray(users) ? users : []
  } catch {
    return []
  }
}

async function writeUsers(users) {
  await ensureStore()
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8')
}

module.exports = { readUsers, writeUsers }

