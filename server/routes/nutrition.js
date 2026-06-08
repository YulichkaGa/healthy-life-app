const router = require('express').Router()
const Anthropic = require('@anthropic-ai/sdk')
const auth = require('../middleware/auth')
const { query } = require('../services/db')

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

router.post('/meals', auth, async (req, res, next) => {
    try {
        const { name, calories, protein = 0, carbs = 0, fat = 0, meal_type, image_url } = req.body
        const result = await query(
            `INSERT INTO meals (user_id, name, calories, protein, carbs, fat, meal_type, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [req.user.id, name, calories, protein, carbs, fat, meal_type, image_url]
        )
        await query(
            `INSERT INTO daily_logs (user_id, log_date, calories, protein, carbs, fat)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
       ON CONFLICT (user_id, log_date) DO UPDATE SET
         calories = daily_logs.calories + EXCLUDED.calories,
         protein  = daily_logs.protein  + EXCLUDED.protein,
         carbs    = daily_logs.carbs    + EXCLUDED.carbs,
         fat      = daily_logs.fat      + EXCLUDED.fat`,
            [req.user.id, calories, protein, carbs, fat]
        )
        res.status(201).json(result.rows[0])
    } catch (err) { next(err) }
})

router.get('/meals', auth, async (req, res, next) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0]
        const result = await query(
            `SELECT * FROM meals WHERE user_id=$1 AND log_date=$2 ORDER BY logged_at`,
            [req.user.id, date]
        )
        res.json(result.rows)
    } catch (err) { next(err) }
})

router.delete('/meals/:id', auth, async (req, res, next) => {
    try {
        const meal = await query('SELECT * FROM meals WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])
        if (!meal.rows.length) return res.status(404).json({ message: 'לא נמצא' })
        const m = meal.rows[0]
        await query('DELETE FROM meals WHERE id=$1', [req.params.id])
        await query(
            `UPDATE daily_logs SET
                calories = GREATEST(0, calories - $2),
                protein  = GREATEST(0, protein  - $3),
                carbs    = GREATEST(0, carbs    - $4),
                fat      = GREATEST(0, fat      - $5)
             WHERE user_id=$1 AND log_date=$6`,
            [req.user.id, m.calories, m.protein, m.carbs, m.fat, m.log_date]
        )
        res.json({ ok: true })
    } catch (err) { next(err) }
})

router.post('/analyze', auth, async (req, res, next) => {
    try {
        const { image } = req.body
        const response = await claude.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 500,
            messages: [{
                role: 'user',
                content: [
                    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
                    { type: 'text', text: 'זהה את האוכל בתמונה. החזר JSON בלבד (ללא markdown): { "name": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "confidence": "high/medium/low" }' }
                ]
            }]
        })
        const text = response.content[0].text.replace(/```json|```/g, '').trim()
        try {
            res.json(JSON.parse(text))
        } catch {
            res.status(422).json({ message: 'לא ניתן לפרסר את תשובת ה-AI' })
        }
    } catch (err) { next(err) }
})

router.get('/search', auth, async (req, res, next) => {
    try {
        const { q } = req.query
        res.json([{ name: q, calories: 200, protein: 10, carbs: 30, fat: 5 }])
    } catch (err) { next(err) }
})

module.exports = router