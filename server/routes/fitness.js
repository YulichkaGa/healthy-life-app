const router = require('express').Router()
const auth = require('../middleware/auth')
const { query } = require('../services/db')

router.post('/workouts', auth, async (req, res, next) => {
    try {
        const { name, duration, calories = 0, notes } = req.body
        const result = await query(
            `INSERT INTO workouts (user_id, name, duration, calories, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [req.user.id, name, duration, calories, notes]
        )
        res.status(201).json(result.rows[0])
    } catch (err) { next(err) }
})

router.get('/workouts', auth, async (req, res, next) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0]
        const result = await query(
            `SELECT * FROM workouts WHERE user_id=$1 AND log_date=$2 ORDER BY logged_at`,
            [req.user.id, date]
        )
        res.json(result.rows)
    } catch (err) { next(err) }
})

router.patch('/steps', auth, async (req, res, next) => {
    try {
        const { steps } = req.body
        await query(
            `INSERT INTO daily_logs (user_id, log_date, steps) VALUES ($1, CURRENT_DATE, $2)
       ON CONFLICT (user_id, log_date) DO UPDATE SET steps = EXCLUDED.steps`,
            [req.user.id, steps]
        )
        res.json({ steps })
    } catch (err) { next(err) }
})

module.exports = router