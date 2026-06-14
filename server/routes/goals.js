const router = require('express').Router()
const auth = require('../middleware/auth')
const { query, db } = require('../services/db')

db.exec(`
  CREATE TABLE IF NOT EXISTS user_goals (
    user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    calories    INTEGER DEFAULT 2000,
    protein     INTEGER DEFAULT 120,
    carbs       INTEGER DEFAULT 250,
    water       INTEGER DEFAULT 8,
    steps       INTEGER DEFAULT 10000,
    sleep_hours REAL    DEFAULT 8
  )
`)

const DEFAULTS = { calories: 2000, protein: 120, carbs: 250, water: 8, steps: 10000, sleep_hours: 8 }

router.get('/', auth, async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM user_goals WHERE user_id=$1', [req.user.id])
    res.json(result.rows[0] || { user_id: req.user.id, ...DEFAULTS })
  } catch (err) { next(err) }
})

router.put('/', auth, async (req, res, next) => {
  try {
    const { calories, protein, carbs, water, steps, sleep_hours } = req.body
    const result = await query(
      `INSERT INTO user_goals (user_id, calories, protein, carbs, water, steps, sleep_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id) DO UPDATE SET
         calories    = EXCLUDED.calories,
         protein     = EXCLUDED.protein,
         carbs       = EXCLUDED.carbs,
         water       = EXCLUDED.water,
         steps       = EXCLUDED.steps,
         sleep_hours = EXCLUDED.sleep_hours
       RETURNING *`,
      [req.user.id,
       Number(calories)    || DEFAULTS.calories,
       Number(protein)     || DEFAULTS.protein,
       Number(carbs)       || DEFAULTS.carbs,
       Number(water)       || DEFAULTS.water,
       Number(steps)       || DEFAULTS.steps,
       Number(sleep_hours) || DEFAULTS.sleep_hours]
    )
    res.json(result.rows[0])
  } catch (err) { next(err) }
})

module.exports = router