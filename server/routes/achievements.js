const router = require('express').Router()
const auth = require('../middleware/auth')
const { query } = require('../services/db')

const DEFINITIONS = [
  // Streaks
  { id: 'streak_3',      icon: '🔥', category: 'רצף',    title: '3 ימי רצף',          desc: 'עקבת אחרי הבריאות שלך 3 ימים רצופים' },
  { id: 'streak_7',      icon: '🔥', category: 'רצף',    title: 'שבוע שלם',            desc: 'שבוע רצוף של מעקב בריאות' },
  { id: 'streak_30',     icon: '🏆', category: 'רצף',    title: 'חודש של הרגלים',      desc: '30 ימי רצף — מחויבות אמיתית!' },
  // Nutrition
  { id: 'first_meal',    icon: '🥗', category: 'תזונה',  title: 'ארוחה ראשונה',        desc: 'רשמת את הארוחה הראשונה שלך' },
  { id: 'meals_10',      icon: '🍽', category: 'תזונה',  title: '10 ארוחות',           desc: 'רשמת 10 ארוחות' },
  { id: 'meals_50',      icon: '🌟', category: 'תזונה',  title: '50 ארוחות',           desc: 'מחויבות אמיתית לתזונה!' },
  { id: 'cal_goal',      icon: '🎯', category: 'תזונה',  title: 'יעד קלוריות',         desc: 'הגעת ליעד הקלוריות 5 פעמים' },
  // Fitness
  { id: 'first_workout', icon: '💪', category: 'כושר',   title: 'אימון ראשון',         desc: 'השלמת את האימון הראשון שלך' },
  { id: 'workouts_5',    icon: '💪', category: 'כושר',   title: '5 אימונים',           desc: 'השלמת 5 אימונים' },
  { id: 'workouts_20',   icon: '🏋', category: 'כושר',   title: '20 אימונים',          desc: 'אתלט אמיתי!' },
  { id: 'steps_goal',    icon: '👟', category: 'כושר',   title: 'יעד הצעדים',          desc: 'הגעת ליעד הצעדים 5 פעמים' },
  { id: 'water_goal',    icon: '💧', category: 'כושר',   title: 'שתייה מושלמת',        desc: 'הגעת ליעד המים 5 פעמים' },
  // Sleep & Mood
  { id: 'first_sleep',   icon: '😴', category: 'שינה',   title: 'שינה ראשונה',         desc: 'רשמת את השינה הראשונה שלך' },
  { id: 'sleep_7',       icon: '😴', category: 'שינה',   title: 'שבוע שינה',           desc: 'עקבת אחרי שינה 7 לילות' },
  { id: 'first_mood',    icon: '😊', category: 'מצב רוח', title: 'מצב רוח ראשון',      desc: 'עקבת אחרי מצב הרוח בפעם הראשונה' },
  { id: 'mood_7',        icon: '😄', category: 'מצב רוח', title: 'שבוע רגשות',         desc: 'רשמת מצב רוח 7 ימים' },
]

router.get('/', auth, async (req, res, next) => {
  try {
    const uid = req.user.id

    const [
      mealsRes, workoutsRes, sleepRes, moodRes,
      streakRes, goalsRes,
    ] = await Promise.all([
      query('SELECT COUNT(*) as cnt FROM meals WHERE user_id=$1', [uid]),
      query('SELECT COUNT(*) as cnt FROM workouts WHERE user_id=$1', [uid]),
      query('SELECT COUNT(*) as cnt FROM sleep_logs WHERE user_id=$1', [uid]),
      query('SELECT COUNT(*) as cnt FROM daily_logs WHERE user_id=$1 AND mood IS NOT NULL', [uid]),
      query(
        `SELECT log_date FROM daily_logs WHERE user_id=$1 AND (calories > 0 OR steps > 0)
         ORDER BY log_date DESC LIMIT 60`,
        [uid]
      ),
      query('SELECT * FROM user_goals WHERE user_id=$1', [uid]),
    ])

    const mealCount    = Number(mealsRes.rows[0].cnt)
    const workoutCount = Number(workoutsRes.rows[0].cnt)
    const sleepCount   = Number(sleepRes.rows[0].cnt)
    const moodCount    = Number(moodRes.rows[0].cnt)

    // Compute current streak
    let streak = 0
    const today = new Date()
    for (const row of streakRes.rows) {
      const diff = Math.floor((today - new Date(row.log_date)) / 86400000)
      if (diff === streak) streak++
      else break
    }

    const userGoals = goalsRes.rows[0] || { calories: 2000, water: 8, steps: 10000 }

    const [calRes, waterRes, stepsRes] = await Promise.all([
      query(
        'SELECT COUNT(*) as cnt FROM daily_logs WHERE user_id=$1 AND calories >= $2',
        [uid, userGoals.calories]
      ),
      query(
        'SELECT COUNT(*) as cnt FROM daily_logs WHERE user_id=$1 AND water >= $2',
        [uid, userGoals.water]
      ),
      query(
        'SELECT COUNT(*) as cnt FROM daily_logs WHERE user_id=$1 AND steps >= $2',
        [uid, userGoals.steps]
      ),
    ])

    const calGoalCount   = Number(calRes.rows[0].cnt)
    const waterGoalCount = Number(waterRes.rows[0].cnt)
    const stepsGoalCount = Number(stepsRes.rows[0].cnt)

    const earned = {
      streak_3:      streak >= 3,
      streak_7:      streak >= 7,
      streak_30:     streak >= 30,
      first_meal:    mealCount >= 1,
      meals_10:      mealCount >= 10,
      meals_50:      mealCount >= 50,
      cal_goal:      calGoalCount >= 5,
      first_workout: workoutCount >= 1,
      workouts_5:    workoutCount >= 5,
      workouts_20:   workoutCount >= 20,
      steps_goal:    stepsGoalCount >= 5,
      water_goal:    waterGoalCount >= 5,
      first_sleep:   sleepCount >= 1,
      sleep_7:       sleepCount >= 7,
      first_mood:    moodCount >= 1,
      mood_7:        moodCount >= 7,
    }

    const achievements = DEFINITIONS.map(def => ({ ...def, earned: !!earned[def.id] }))
    const earnedCount  = achievements.filter(a => a.earned).length

    res.json({ streak, earnedCount, total: DEFINITIONS.length, achievements })
  } catch (err) { next(err) }
})

module.exports = router
