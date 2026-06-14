require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes      = require('./routes/auth')
const nutritionRoutes = require('./routes/nutrition')
const fitnessRoutes   = require('./routes/fitness')
const sleepRoutes     = require('./routes/sleep')
const moodRoutes      = require('./routes/mood')
const aiRoutes        = require('./routes/ai')
const dashboardRoutes = require('./routes/dashboard')
const todosRoutes     = require('./routes/todos')
const goalsRoutes        = require('./routes/goals')
const achievementsRoutes = require('./routes/achievements')
const exportRoutes       = require('./routes/export')
const weightRoutes       = require('./routes/weight')
const favoritesRoutes    = require('./routes/favorites')
const habitsRoutes       = require('./routes/habits')
const measurementsRoutes = require('./routes/measurements')
const meditationRoutes   = require('./routes/meditation')

const app = express()

app.use(cors({
  origin: (origin, cb) => cb(null, !origin || /^http:\/\/localhost:\d+$/.test(origin)),
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

app.use('/api/auth',      authRoutes)
app.use('/api/nutrition', nutritionRoutes)
app.use('/api/fitness',   fitnessRoutes)
app.use('/api/sleep',     sleepRoutes)
app.use('/api/mood',      moodRoutes)
app.use('/api/ai',        aiRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api',           todosRoutes)
app.use('/api/goals',        goalsRoutes)
app.use('/api/achievements', achievementsRoutes)
app.use('/api/export',       exportRoutes)
app.use('/api/weight',       weightRoutes)
app.use('/api/favorites',    favoritesRoutes)
app.use('/api/habits',       habitsRoutes)
app.use('/api/measurements', measurementsRoutes)
app.use('/api/meditation',   meditationRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use((err, req, res, next) => {
    console.error(err)
    res.status(err.status || 500).json({ message: err.message || 'שגיאת שרת' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🌿 Server running on port ${PORT}`))