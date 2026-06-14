const router = require('express').Router()
const auth = require('../middleware/auth')
const { query, db } = require('../services/db')

db.exec(`
  CREATE TABLE IF NOT EXISTS weight_logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date  TEXT NOT NULL DEFAULT (date('now')),
    weight_kg REAL NOT NULL,
    notes     TEXT,
    logged_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, log_date)
  );
  CREATE INDEX IF NOT EXISTS idx_weight_user ON weight_logs(user_id);

  CREATE TABLE IF NOT EXISTS user_profile (
    user_id   INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    height_cm REAL DEFAULT 170
  );
`)

router.get('/history', auth, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM weight_logs WHERE user_id=$1 ORDER BY log_date DESC LIMIT 90',
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) { next(err) }
})

router.post('/log', auth, async (req, res, next) => {
  try {
    const { weight_kg, notes } = req.body
    if (!weight_kg || Number(weight_kg) <= 0)
      return res.status(400).json({ message: 'משקל לא תקין' })
    const result = await query(
      `INSERT INTO weight_logs (user_id, log_date, weight_kg, notes)
       VALUES ($1, date('now'), $2, $3)
       ON CONFLICT (user_id, log_date)
       DO UPDATE SET weight_kg=EXCLUDED.weight_kg, notes=EXCLUDED.notes
       RETURNING *`,
      [req.user.id, Number(weight_kg), notes?.trim() || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { next(err) }
})

router.delete('/:id', auth, async (req, res, next) => {
  try {
    await query('DELETE FROM weight_logs WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

router.get('/profile', auth, async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM user_profile WHERE user_id=$1', [req.user.id])
    res.json(result.rows[0] || { user_id: req.user.id, height_cm: 170 })
  } catch (err) { next(err) }
})

router.put('/profile', auth, async (req, res, next) => {
  try {
    const { height_cm } = req.body
    const result = await query(
      `INSERT INTO user_profile (user_id, height_cm) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET height_cm=EXCLUDED.height_cm
       RETURNING *`,
      [req.user.id, Number(height_cm) || 170]
    )
    res.json(result.rows[0])
  } catch (err) { next(err) }
})

module.exports = router
