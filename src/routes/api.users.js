const express = require('express');
const bcrypt = require('bcryptjs');
const { get, run, all } = require('../db');
const { apiRequireAuth } = require('../middleware/apiAuth');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(apiRequireAuth);

// Admin: list users
router.get('/', async (req, res) => {
    try {
        const me = await get('SELECT role FROM users WHERE id = ?', [req.session.userId]);
        if (!me || (me.role !== 'admin' && me.role !== 'superadmin')) return res.status(403).json({ error: 'forbidden' });
        const users = await all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (e) {
        return res.status(500).json({ error: 'db error' });
    }
});

// Admin: create new user with specific role
router.post('/', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'name, email, password required' });
    }
    if (!role || !['admin', 'superadmin'].includes(role)) {
        return res.status(400).json({ error: 'valid role required (admin or superadmin)' });
    }
    try {
        const me = await get('SELECT role FROM users WHERE id = ?', [req.session.userId]);
        if (!me || me.role !== 'superadmin') return res.status(403).json({ error: 'forbidden' });
        
        const hash = await bcrypt.hash(password, 10);
        const result = await run('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [name, email, hash, role]);
        res.status(201).json({ id: result.insertId, name, email, role });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'email already exists' });
        }
        return res.status(500).json({ error: 'db error' });
    }
});

// Admin: update user role
router.put('/:id/role', async (req, res) => {
    const { role } = req.body; // 'admin' | 'superadmin'
    if (!role || !['admin','superadmin'].includes(role)) return res.status(400).json({ error: 'invalid role' });
    try {
        const me = await get('SELECT role FROM users WHERE id = ?', [req.session.userId]);
        if (!me || me.role !== 'superadmin') return res.status(403).json({ error: 'forbidden' });
        const result = await run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        res.json({ ok: true, updated: result.affectedRows });
    } catch (e) {
        return res.status(500).json({ error: 'db error' });
    }
});

// Admin: delete user
router.delete('/:id', async (req, res) => {
    try {
        const me = await get('SELECT role FROM users WHERE id = ?', [req.session.userId]);
        if (!me || me.role !== 'superadmin') return res.status(403).json({ error: 'forbidden' });
        const result = await run('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ ok: true, deleted: result.affectedRows });
    } catch (e) {
        return res.status(500).json({ error: 'db error' });
    }
});
router.get('/me', async (req, res) => {
    try {
        const user = await get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.session.userId]);
        res.json(user || null);
    } catch (e) {
        return res.status(500).json({ error: 'db error' });
    }
});

router.put('/me', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            const result = await run('UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?', [name, email, hash, req.session.userId]);
            return res.json({ ok: true, updated: result.affectedRows });
        } else {
            const result = await run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.session.userId]);
            return res.json({ ok: true, updated: result.affectedRows });
        }
    } catch (e) {
        return res.status(500).json({ error: 'db error' });
    }
});

router.delete('/me', async (req, res) => {
    try {
        const result = await run('DELETE FROM users WHERE id = ?', [req.session.userId]);
        const deleted = result.affectedRows;
        req.session.destroy(() => res.json({ ok: true, deleted }));
    } catch (e) {
        return res.status(500).json({ error: 'db error' });
    }
});

module.exports = router;


