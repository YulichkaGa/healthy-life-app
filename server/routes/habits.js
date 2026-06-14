const router = require('express').Router()
const auth   = require('../middleware/auth')
const { query, db } = require('../services/db')

db.exec(`
  CREATE TABLE IF NOT EXISTS habits (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    icon       TEXT DEFAULT '✅',
    color      TEXT DEFAULT '#16a34a',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS habit_logs (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date TEXT NOT NULL DEFAULT (date('now')),
    UNIQUE(habit_id, log_date)
  );
  CREATE INDEX IF NOT EXISTS idx_habits_user      ON habits(user_id);
  CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);
`)

router.get('/', auth, async (req, res, next) => {
  try {
    const result = await query(`
      SELECT h.*,
        CASE WHEN hl.id IS NOT NULL THEN 1 ELSE 0 END AS done_today,
        (SELECT COUNT(*) FROM habit_logs WHERE habit_id = h.id) AS total_done
      FROM habits h
      LEFT JOIN habit_logs hl
        ON hl.habit_id = h.id AND hl.log_date = date('now') AND hl.user_id = $1
      WHERE h.user_id = $1
      ORDER BY h.created_at ASC
    `, [req.user.id])
    res.json(result.rows)
  } catch (err) { next(err) }
})

router.post('/', auth, async (req, res, next) => {
  try {
    const { name, icon = '✅', color = '#16a34a' } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'שם ההרגל הוא שדה חובה' })
    const result = await query(
      'INSERT INTO habits (user_id, name, icon, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, name.trim(), icon, color]
    )
    res.status(201).json({ ...result.rows[0], done_today: 0, total_done: 0 })
  } catch (err) { next(err) }
})

router.delete('/:id', auth, async (req, res, next) => {
  try {
    await query('DELETE FROM habits WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

router.post('/:id/toggle', auth, async (req, res, next) => {
  try {
    const existing = await query(
      `SELECT id FROM habit_logs WHERE habit_id=$1 AND user_id=$2 AND log_date=date('now')`,
      [req.params.id, req.user.id]
    )
    if (existing.rows.length > 0) {
      await query(
        `DELETE FROM habit_logs WHERE habit_id=$1 AND user_id=$2 AND log_date=date('now')`,
        [req.params.id, req.user.id]
      )
      res.json({ done_today: false })
    } else {
      await query('INSERT INTO habit_logs (habit_id, user_id) VALUES ($1, $2)', [req.params.id, req.user.id])
      res.json({ done_today: true })
    }
  } catch (err) { next(err) }
})

router.get('/:id/history', auth, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT log_date FROM habit_logs WHERE habit_id=$1 AND user_id=$2 ORDER BY log_date DESC LIMIT 30',
      [req.params.id, req.user.id]
    )
    res.json(result.rows.map(r => r.log_date))
  } catch (err) { next(err) }
})

module.exports = router
