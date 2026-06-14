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
        const mealResult = await query('SELECT * FROM meals WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])
        if (!mealResult.rows.length) return res.status(404).json({ message: 'לא נמצא' })
        const mealData = mealResult.rows[0]
        await query('DELETE FROM meals WHERE id=$1', [req.params.id])
        await query(
            `UPDATE daily_logs SET
                calories = MAX(0, calories - $2),
                protein  = MAX(0, protein  - $3),
                carbs    = MAX(0, carbs    - $4),
                fat      = MAX(0, fat      - $5)
             WHERE user_id=$1 AND log_date=$6`,
            [req.user.id, mealData.calories, mealData.protein, mealData.carbs, mealData.fat, mealData.log_date]
        )
        res.json({ ok: true })
    } catch (err) { next(err) }
})

router.post('/analyze', auth, async (req, res, next) => {
    try {
        const { image } = req.body
        if (!image) return res.status(400).json({ message: 'התמונה נדרשת' })
        
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
        
        if (!response.content || !Array.isArray(response.content) || response.content.length === 0) {
            return res.status(422).json({ message: 'תשובה לא חוקית מ-AI' })
        }
        
        const firstContent = response.content[0]
        if (!firstContent.text) {
            return res.status(422).json({ message: 'לא ניתן לקבל תשובה מ-AI' })
        }
        
        const text = firstContent.text.replace(/```json|```/g, '').trim()
        try {
            const parsedResult = JSON.parse(text)
            res.json(parsedResult)
        } catch {
            res.status(422).json({ message: 'לא ניתן לפרסר את תשובת ה-AI' })
        }
    } catch (err) { next(err) }
})

router.get('/search', auth, async (req, res, next) => {
    try {
        const { q } = req.query
        if (!q?.trim()) return res.json([])

        const url = 'https://world.openfoodfacts.org/cgi/search.pl?' +
            `search_terms=${encodeURIComponent(q)}&json=1&action=process` +
            `&page_size=10&fields=product_name,nutriments`

        const response = await fetch(url, { signal: AbortSignal.timeout(6000) })
        if (!response.ok) return res.json([])

        const data = await response.json()
        const results = (data.products || [])
            .filter(p => p.product_name && p.nutriments?.['energy-kcal_100g'])
            .map(p => ({
                name:     p.product_name,
                calories: Math.round(p.nutriments['energy-kcal_100g']   || 0),
                protein:  Math.round(p.nutriments['proteins_100g']       || 0),
                carbs:    Math.round(p.nutriments['carbohydrates_100g']  || 0),
                fat:      Math.round(p.nutriments['fat_100g']            || 0),
            }))
            .filter(p => p.calories > 0)
            .slice(0, 6)

        res.json(results)
    } catch (err) { next(err) }
})

module.exports = router