const express = require('express');
const bcrypt = require('bcryptjs');
const { get, run } = require('../db');

const router = express.Router();

router.post('/register', async (req, res) => {
	const { name, email, password } = req.body;
	if (!name || !email || !password) {
		return res.status(400).json({ error: 'name, email, password required' });
	}
    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await run('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, hash]);
        req.session.userId = result.insertId;
        return res.status(201).json({ id: result.insertId, name, email });
    } catch (e) {
        return res.status(409).json({ error: 'email already exists' });
    }
});

router.post('/login', async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    req.session.userId = user.id;
    return res.json({ id: user.id, name: user.name, email: user.email });
});

router.post('/logout', (req, res) => {
	req.session.destroy(() => res.json({ ok: true }));
});

module.exports = router;


