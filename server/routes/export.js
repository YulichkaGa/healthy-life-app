const router = require('express').Router()
const auth = require('../middleware/auth')
const { query } = require('../services/db')

router.get('/', auth, async (req, res, next) => {
  try {
    const uid = req.user.id

    const [meals, workouts, sleep, daily] = await Promise.all([
      query(
        `SELECT log_date, meal_type, name, calories, protein, carbs, fat
         FROM meals WHERE user_id=$1 ORDER BY log_date, logged_at`,
        [uid]
      ),
      query(
        `SELECT log_date, name, duration, calories, notes
         FROM workouts WHERE user_id=$1 ORDER BY log_date, logged_at`,
        [uid]
      ),
      query(
        `SELECT sleep_date, bedtime, wake_time, duration, quality, notes
         FROM sleep_logs WHERE user_id=$1 ORDER BY sleep_date`,
        [uid]
      ),
      query(
        `SELECT log_date, calories, protein, carbs, fat, water, steps, sleep_hours, mood
         FROM daily_logs WHERE user_id=$1 ORDER BY log_date`,
        [uid]
      ),
    ])

    res.json({
      meals:    meals.rows,
      workouts: workouts.rows,
      sleep:    sleep.rows,
      daily:    daily.rows,
    })
  } catch (err) { next(err) }
})

module.exports = router
