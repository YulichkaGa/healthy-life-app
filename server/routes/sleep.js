const router = require('express').Router()
const auth = require('../middleware/auth')
const { query } = require('../services/db')

router.post('/log', auth, async (req, res, next) => {
    try {
        const { bedtime, wake_time, duration, quality, notes } = req.body
        const result = await query(
            `INSERT INTO sleep_logs (user_id, sleep_date, bedtime, wake_time, duration, quality, notes)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6) RETURNING *`,
            [req.user.id, bedtime, wake_time, duration, quality, notes]
        )
        await query(
            `INSERT INTO daily_logs (user_id, log_date, sleep_hours) VALUES ($1, CURRENT_DATE, $2)
       ON CONFLICT (user_id, log_date) DO UPDATE SET sleep_hours = EXCLUDED.sleep_hours`,
            [req.user.id, duration]
        )
        res.status(201).json(result.rows[0])
    } catch (err) { next(err) }
})

router.get('/history', auth, async (req, res, next) => {
    try {
        const result = await query(
            `SELECT * FROM sleep_logs WHERE user_id=$1 ORDER BY sleep_date DESC LIMIT 14`,
            [req.user.id]
        )
        res.json(result.rows)
    } catch (err) { next(err) }
})

module.exports = router