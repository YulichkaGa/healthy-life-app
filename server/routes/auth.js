const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { query } = require('../services/db')
const auth = require('../middleware/auth')

const sign = (user) =>
    jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' })

router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password } = req.body
        if (!name || !email || !password) return res.status(400).json({ message: 'כל השדות נדרשים' })

        const exists = await query('SELECT id FROM users WHERE email=$1', [email])
        if (exists.rows.length) return res.status(409).json({ message: 'אימייל כבר קיים' })

        const hash = await bcrypt.hash(password, 12)
        const result = await query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email, onboarding_done',
            [name, email, hash]
        )
        const user = result.rows[0]
        res.status(201).json({ token: sign(user), user })
    } catch (err) { next(err) }
})

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body
        const result = await query('SELECT * FROM users WHERE email=$1', [email])
        const user = result.rows[0]
        if (!user || !await bcrypt.compare(password, user.password_hash))
            return res.status(401).json({ message: 'אימייל או סיסמה שגויים' })

        const { password_hash, ...safe } = user
        res.json({ token: sign(safe), user: safe })
    } catch (err) { next(err) }
})

router.get('/me', auth, async (req, res, next) => {
    try {
        const result = await query(
            'SELECT id, name, email, onboarding_done, created_at FROM users WHERE id=$1',
            [req.user.id]
        )
        res.json(result.rows[0])
    } catch (err) { next(err) }
})

router.put('/profile', auth, async (req, res, next) => {
    try {
        const { name, email } = req.body
        if (!name?.trim() || !email?.trim())
            return res.status(400).json({ message: 'שם ואימייל נדרשים' })

        const taken = await query(
            'SELECT id FROM users WHERE email=$1 AND id != $2',
            [email.trim(), req.user.id]
        )
        if (taken.rows.length)
            return res.status(409).json({ message: 'אימייל כבר בשימוש' })

        const result = await query(
            `UPDATE users SET name=$1, email=$2 WHERE id=$3
             RETURNING id, name, email, onboarding_done, created_at`,
            [name.trim(), email.trim(), req.user.id]
        )
        res.json(result.rows[0])
    } catch (err) { next(err) }
})

router.put('/password', auth, async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body
        if (!current_password || !new_password)
            return res.status(400).json({ message: 'כל השדות נדרשים' })
        if (new_password.length < 6)
            return res.status(400).json({ message: 'הסיסמה חייבת להכיל לפחות 6 תווים' })

        const result = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id])
        const valid = await bcrypt.compare(current_password, result.rows[0]?.password_hash)
        if (!valid)
            return res.status(401).json({ message: 'הסיסמה הנוכחית שגויה' })

        const hash = await bcrypt.hash(new_password, 12)
        await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id])
        res.json({ ok: true })
    } catch (err) { next(err) }
})

module.exports = router