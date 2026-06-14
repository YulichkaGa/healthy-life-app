const router = require('express').Router()
const auth   = require('../middleware/auth')
const { query, db } = require('../services/db')

db.exec(`
  CREATE TABLE IF NOT EXISTS body_measurements (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date   TEXT NOT NULL DEFAULT (date('now')),
    waist      REAL,
    chest      REAL,
    hips       REAL,
    left_arm   REAL,
    right_arm  REAL,
    thighs     REAL,
    notes      TEXT,
    logged_at  TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, log_date)
  );
  CREATE INDEX IF NOT EXISTS idx_measurements_user ON body_measurements(user_id);
`)

router.get('/history', auth, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM body_measurements WHERE user_id=$1 ORDER BY log_date DESC LIMIT 50',
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) { next(err) }
})

router.post('/log', auth, async (req, res, next) => {
  try {
    const { waist, chest, hips, left_arm, right_arm, thighs, notes, log_date } = req.body
    const date = log_date || new Date().toISOString().slice(0, 10)
    const result = await query(
      `INSERT INTO body_measurements (user_id, log_date, waist, chest, hips, left_arm, right_arm, thighs, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, log_date)
       DO UPDATE SET waist=EXCLUDED.waist, chest=EXCLUDED.chest, hips=EXCLUDED.hips,
         left_arm=EXCLUDED.left_arm, right_arm=EXCLUDED.right_arm, thighs=EXCLUDED.thighs,
         notes=EXCLUDED.notes
       RETURNING *`,
      [req.user.id, date,
       waist     ? Number(waist)     : null,
       chest     ? Number(chest)     : null,
       hips      ? Number(hips)      : null,
       left_arm  ? Number(left_arm)  : null,
       right_arm ? Number(right_arm) : null,
       thighs    ? Number(thighs)    : null,
       notes?.trim() || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { next(err) }
})

router.delete('/:id', auth, async (req, res, next) => {
  try {
    await query('DELETE FROM body_measurements WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

module.exports = router
