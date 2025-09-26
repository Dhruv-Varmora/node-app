const express = require('express');
const bcrypt = require('bcryptjs');
const { get, run } = require('../db');

const router = express.Router();

router.get('/register', (req, res) => {
	res.render('register', { title: 'Register' });
});

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        req.session.flash = { type: 'danger', message: 'All fields are required.' };
        return res.redirect('/register');
    }
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        // If first user, make them superadmin
        const existing = await get('SELECT id FROM users LIMIT 1', []);
        const role = existing ? 'admin' : 'superadmin';
        const result = await run(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, passwordHash, role]
        );
        req.session.userId = result.insertId;
        res.redirect('/todos');
    } catch (e) {
        req.session.flash = { type: 'danger', message: 'Email already in use.' };
        res.redirect('/register');
    }
});

router.get('/login', (req, res) => {
	res.render('login', { title: 'Login' });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        req.session.flash = { type: 'danger', message: 'Email and password required.' };
        return res.redirect('/login');
    }
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
        req.session.flash = { type: 'danger', message: 'Invalid credentials.' };
        return res.redirect('/login');
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
        req.session.flash = { type: 'danger', message: 'Invalid credentials.' };
        return res.redirect('/login');
    }
    req.session.userId = user.id;
    res.redirect('/todos');
});

router.post('/logout', (req, res) => {
	req.session.destroy(() => {
		res.redirect('/login');
	});
});

module.exports = router;


