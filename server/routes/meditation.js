const router = require('express').Router()
const auth   = require('../middleware/auth')
const { query, db } = require('../services/db')

db.exec(`
  CREATE TABLE IF NOT EXISTS meditation_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date    TEXT NOT NULL DEFAULT (date('now')),
    duration    INTEGER NOT NULL,
    type        TEXT DEFAULT 'mindfulness',
    mood_before INTEGER,
    mood_after  INTEGER,
    notes       TEXT,
    logged_at   TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_meditation_user ON meditation_logs(user_id);
`)

router.get('/history', auth, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM meditation_logs WHERE user_id=$1 ORDER BY log_date DESC, logged_at DESC LIMIT 30',
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) { next(err) }
})

router.get('/stats', auth, async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*)            AS sessions,
        COALESCE(SUM(duration), 0)  AS total_minutes,
        ROUND(AVG(duration), 1)     AS avg_duration,
        MAX(duration)               AS best_session
      FROM meditation_logs WHERE user_id = $1
    `, [req.user.id])
    res.json(result.rows[0])
  } catch (err) { next(err) }
})

router.post('/log', auth, async (req, res, next) => {
  try {
    const { duration, type = 'mindfulness', mood_before, mood_after, notes } = req.body
    if (!duration || Number(duration) < 1)
      return res.status(400).json({ message: 'יש להזין משך זמן' })
    const result = await query(
      `INSERT INTO meditation_logs (user_id, duration, type, mood_before, mood_after, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, Number(duration), type,
       mood_before ? Number(mood_before) : null,
       mood_after  ? Number(mood_after)  : null,
       notes?.trim() || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { next(err) }
})

router.delete('/:id', auth, async (req, res, next) => {
  try {
    await query('DELETE FROM meditation_logs WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

module.exports = router
