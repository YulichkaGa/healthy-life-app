const router = require('express').Router()
const auth = require('../middleware/auth')
const { query, db } = require('../services/db')

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id);
`)

router.get('/todos', auth, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM todos WHERE user_id=$1 ORDER BY createdAt DESC',
      [req.user.id]
    )
    res.json({ success: true, data: result.rows })
  } catch (err) { next(err) }
})

router.get('/todos/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid todo ID' })
    const result = await query(
      'SELECT * FROM todos WHERE id=$1 AND user_id=$2',
      [id, req.user.id]
    )
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Todo not found' })
    res.json({ success: true, data: result.rows[0] })
  } catch (err) { next(err) }
})

router.post('/todos', auth, async (req, res, next) => {
  try {
    const { title, description } = req.body
    if (!title || typeof title !== 'string' || !title.trim())
      return res.status(400).json({ success: false, error: 'Title is required' })
    const result = await query(
      'INSERT INTO todos (user_id, title, description, completed) VALUES ($1,$2,$3,0) RETURNING *',
      [req.user.id, title.trim(), description?.trim() || null]
    )
    res.status(201).json({ success: true, data: result.rows[0], message: 'Todo created successfully' })
  } catch (err) { next(err) }
})

router.put('/todos/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params
    const { title, description, completed } = req.body
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid todo ID' })

    const existing = await query(
      'SELECT * FROM todos WHERE id=$1 AND user_id=$2',
      [id, req.user.id]
    )
    if (!existing.rows.length) return res.status(404).json({ success: false, error: 'Todo not found' })

    if (title !== undefined && (typeof title !== 'string' || !title.trim()))
      return res.status(400).json({ success: false, error: 'Title must be a non-empty string' })
    if (completed !== undefined && typeof completed !== 'boolean')
      return res.status(400).json({ success: false, error: 'Completed must be a boolean' })

    const cur = existing.rows[0]
    const newTitle     = title       !== undefined ? title.trim()               : cur.title
    const newDesc      = description !== undefined ? (description?.trim() || null) : cur.description
    const newCompleted = completed   !== undefined ? (completed ? 1 : 0)        : cur.completed

    const result = await query(
      `UPDATE todos SET title=$1, description=$2, completed=$3, updatedAt=CURRENT_TIMESTAMP
       WHERE id=$4 AND user_id=$5 RETURNING *`,
      [newTitle, newDesc, newCompleted, id, req.user.id]
    )
    res.json({ success: true, data: result.rows[0], message: 'Todo updated successfully' })
  } catch (err) { next(err) }
})

router.delete('/todos/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid todo ID' })
    const existing = await query(
      'SELECT id FROM todos WHERE id=$1 AND user_id=$2',
      [id, req.user.id]
    )
    if (!existing.rows.length) return res.status(404).json({ success: false, error: 'Todo not found' })
    await query('DELETE FROM todos WHERE id=$1 AND user_id=$2', [id, req.user.id])
    res.json({ success: true, data: null, message: 'Todo deleted successfully' })
  } catch (err) { next(err) }
})

module.exports = router