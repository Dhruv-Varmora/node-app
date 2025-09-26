const express = require('express');
const bcrypt = require('bcryptjs');
const { get, run } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Read profile
router.get('/me', async (req, res) => {
    const user = await get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.session.userId]);
    if (!user) return res.status(404).send('User not found');
    res.render('users', { title: 'My Profile', user });
});

// Update profile
router.post('/me', async (req, res) => {
    const { name, email, password } = req.body;
    if (password) {
        const hash = await bcrypt.hash(password, 10);
        await run('UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?', [name, email, hash, req.session.userId]);
    } else {
        await run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.session.userId]);
    }
    res.redirect('/users/me');
});

// Delete account
router.post('/me/delete', async (req, res) => {
    await run('DELETE FROM users WHERE id = ?', [req.session.userId]);
    req.session.destroy(() => res.redirect('/register'));
});

// Admin panel (only for superadmin)
router.get('/admin', requireRole('superadmin'), (req, res) => {
    res.render('admin', { title: 'Admin Panel' });
});

// User list (for admin and superadmin)
router.get('/list', requireRole('admin', 'superadmin'), (req, res) => {
    res.render('user-list', { title: 'User List' });
});

// Assign task page (for admin and superadmin)
router.get('/assign-task', requireRole('admin', 'superadmin'), (req, res) => {
    res.render('assign-task', { title: 'Assign Task' });
});

module.exports = router;


