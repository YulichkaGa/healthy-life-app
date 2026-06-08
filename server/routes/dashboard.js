const router = require('express').Router()
const auth = require('../middleware/auth')
const { query } = require('../services/db')

router.get('/today', auth, async (req, res, next) => {
    try {
        const [log, meals, workouts] = await Promise.all([
            query(`SELECT * FROM daily_logs WHERE user_id=$1 AND log_date=CURRENT_DATE`, [req.user.id]),
            query(`SELECT * FROM meals WHERE user_id=$1 AND log_date=CURRENT_DATE ORDER BY logged_at`, [req.user.id]),
            query(`SELECT * FROM workouts WHERE user_id=$1 AND log_date=CURRENT_DATE ORDER BY logged_at`, [req.user.id]),
        ])
        res.json({
            ...(log.rows[0] || {}),
            meals: meals.rows,
            workouts: workouts.rows,
        })
    } catch (err) { next(err) }
})

router.get('/weekly', auth, async (req, res, next) => {
    try {
        const result = await query(
            `SELECT log_date, calories, protein, water, steps, sleep_hours, mood
       FROM daily_logs WHERE user_id=$1 AND log_date >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY log_date`,
            [req.user.id]
        )
        res.json(result.rows)
    } catch (err) { next(err) }
})

router.get('/streak', auth, async (req, res, next) => {
    try {
        const result = await query(
            `SELECT log_date FROM daily_logs 
       WHERE user_id=$1 AND (calories > 0 OR steps > 0)
       ORDER BY log_date DESC LIMIT 60`,
            [req.user.id]
        )
        let streak = 0
        const today = new Date()
        for (const row of result.rows) {
            const diff = Math.floor((today - new Date(row.log_date)) / 86400000)
            if (diff === streak) streak++
            else break
        }
        res.json({ streak })
    } catch (err) { next(err) }
})

module.exports = router