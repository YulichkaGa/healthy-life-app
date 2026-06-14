const router = require('express').Router()
const Anthropic = require('@anthropic-ai/sdk')
const auth = require('../middleware/auth')
const { query } = require('../services/db')

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `אתה AI Coach אישי לבריאות הוליסטית. אתה מדבר בעברית, בטון חם, תומך ומעודד.
אתה מומחה בתזונה, כושר, שינה ובריאות נפשית. 
תמיד תן עצות ספציפיות, מעשיות וריאליות.
אל תהיה רובוטי — דבר כמו חבר שמבין בריאות.
כשיש נתונים על המשתמש, התייחס אליהם ספציפית.`

// Helper: Fetch today's data for a user
async function getTodayData(userId) {
    const result = await query(
        `SELECT calories, protein, water, steps, sleep_hours, mood 
         FROM daily_logs WHERE user_id=$1 AND log_date=CURRENT_DATE`,
        [userId]
    )
    return result.rows[0]
}

// Helper: Extract text from Claude response
function extractClaudeText(response) {
    if (!response.content || !Array.isArray(response.content) || response.content.length === 0) {
        throw new Error('empty_response')
    }
    const firstContent = response.content[0]
    if (!firstContent.text) {
        throw new Error('no_text_content')
    }
    return firstContent.text
}

// Helper: Handle Claude API errors
function handleClaudeError(err) {
    if (err.status === 401 || err.status === 403) {
        return 'שגיאה בחיבור ל-AI — בדוק את מפתח ה-API'
    }
    throw err
}

router.post('/chat', auth, async (req, res, next) => {
    try {
        const { messages } = req.body
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ message: 'הודעות נדרשות' })
        }
        
        const today = await getTodayData(req.user.id)
        const contextMsg = today
            ? `\n\n[נתוני המשתמש להיום: קלוריות ${today.calories}, חלבון ${today.protein}g, מים ${today.water} כוסות, צעדים ${today.steps}, שינה ${today.sleep_hours} שעות, מצב רוח ${today.mood}/5]`
            : ''

        const response = await claude.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1000,
            system: SYSTEM_PROMPT + contextMsg,
            messages,
        })
        
        const text = extractClaudeText(response)
        res.json({ message: text })
    } catch (err) {
        try {
            const errorMsg = handleClaudeError(err)
            return res.status(503).json({ message: errorMsg })
        } catch {
            next(err)
        }
    }
})

router.get('/insight', auth, async (req, res, next) => {
    try {
        const today = await getTodayData(req.user.id)
        if (!today) return res.json({ insight: 'בוקר טוב! התחל לתעד את היום שלך כדי לקבל תובנות אישיות.' })

        const response = await claude.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 150,
            system: SYSTEM_PROMPT,
            messages: [{
                role: 'user',
                content: `בהתבסס על הנתונים שלי להיום: קלוריות ${today.calories}/2000, חלבון ${today.protein}g/120g, מים ${today.water} כוסות/8, צעדים ${today.steps}/10000, שינה ${today.sleep_hours} שעות/8, מצב רוח ${today.mood}/5 — אנא ספק תובנה קצרה (2-3 משפטים) והמלצה מעשית אחת שאוכל ליישם היום.`
            }],
        })

        const text = extractClaudeText(response)
        res.json({ insight: text })
    } catch (err) {
        try {
            const errorMsg = handleClaudeError(err)
            return res.status(503).json({ message: errorMsg })
        } catch {
            next(err)
        }
    }
})

module.exports = router
