const router = require('express').Router()
const auth = require('../middleware/auth')
const { query } = require('../services/db')

router.post('/log', auth, async (req, res, next) => {
    try {
        const { mood } = req.body
        await query(
            `INSERT INTO daily_logs (user_id, log_date, mood) VALUES ($1, CURRENT_DATE, $2)
       ON CONFLICT (user_id, log_date) DO UPDATE SET mood = EXCLUDED.mood`,
            [req.user.id, mood]
        )
        res.json({ mood })
    } catch (err) { next(err) }
})

router.get('/history', auth, async (req, res, next) => {
    try {
        const result = await query(
            `SELECT log_date, mood FROM daily_logs WHERE user_id=$1 AND mood IS NOT NULL
       ORDER BY log_date DESC LIMIT 30`,
            [req.user.id]
        )
        res.json(result.rows)
    } catch (err) { next(err) }
})

module.exports = router