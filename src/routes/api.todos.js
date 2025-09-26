const express = require('express');
const { all, run, get } = require('../db');
const { apiRequireAuth } = require('../middleware/apiAuth');

const router = express.Router();

router.use(apiRequireAuth);

// List
router.get('/', async (req, res) => {
    try {
        const rows = await all('SELECT id, title, completed, created_at FROM todos WHERE user_id = ? ORDER BY created_at DESC', [req.session.userId]);
        res.json(rows);
    } catch (e) {
        return res.status(500).json({ error: 'db error' });
    }
});

// Create
router.post('/', async (req, res) => {
    const { title, userId } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    try {
        let targetUserId = req.session.userId;
        if (userId) {
            const me = await get('SELECT role FROM users WHERE id = ?', [req.session.userId]);
            if (!me || (me.role !== 'admin' && me.role !== 'superadmin')) return res.status(403).json({ error: 'forbidden' });
            targetUserId = userId;
        }
        const result = await run('INSERT INTO todos (user_id, title) VALUES (?, ?)', [targetUserId, title]);
        res.status(201).json({ id: result.insertId, title, completed: 0, user_id: targetUserId });
    } catch (e) {
        return res.status(500).json({ error: 'db error' });
    }
});

// Admin: Get all todos for all users
router.get('/all', async (req, res) => {
    try {
        const me = await get('SELECT role FROM users WHERE id = ?', [req.session.userId]);
        if (!me || (me.role !== 'admin' && me.role !== 'superadmin')) return res.status(403).json({ error: 'forbidden' });
        
        const rows = await all(`
            SELECT t.id, t.title, t.completed, t.created_at, u.name as user_name, u.email as user_email, u.id as user_id, u.role as user_role 
            FROM todos t 
            JOIN users u ON t.user_id = u.id 
            ORDER BY t.created_at DESC
        `);
        res.json(rows);
    } catch (e) {
        return res.status(500).json({ error: 'db error' });
    }
});

// Admin: Get todos for specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const me = await get('SELECT role FROM users WHERE id = ?', [req.session.userId]);
        if (!me || (me.role !== 'admin' && me.role !== 'superadmin')) return res.status(403).json({ error: 'forbidden' });
        
        const rows = await all('SELECT id, title, completed, created_at FROM todos WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId]);
        res.json(rows);
    } catch (e) {
        return res.status(500).json({ error: 'db error' });
    }
});

// Toggle
router.post('/:id/toggle', async (req, res) => {
    try {
        const result = await run('UPDATE todos SET completed = 1 - completed WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
        res.json({ ok: true, updated: result.affectedRows });
    } catch (e) {
        return res.status(500).json({ error: 'db error' });
    }
});

// Delete
router.delete('/:id', async (req, res) => {
    try {
        const result = await run('DELETE FROM todos WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
        res.json({ ok: true, deleted: result.affectedRows });
    } catch (e) {
        return res.status(500).json({ error: 'db error' });
    }
});

module.exports = router;


