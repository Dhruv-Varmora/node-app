const express = require('express');
const { all, run, get } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
    // If admin/superadmin, show all tasks with user info, else show only own tasks
    const me = await get('SELECT role FROM users WHERE id = ?', [req.session.userId]);
    const isAdmin = me && (me.role === 'admin' || me.role === 'superadmin');
    if (isAdmin) {
        const rows = await all(
            `SELECT t.id, t.title, t.completed, t.created_at,
                    u.id AS user_id, u.name AS user_name, u.email AS user_email, u.role AS user_role
             FROM todos t
             JOIN users u ON t.user_id = u.id
             ORDER BY t.created_at DESC`
        );
        return res.render('todos', { title: 'All Tasks', todos: rows, allTasks: true });
    }

    const rows = await all('SELECT id, title, completed, created_at FROM todos WHERE user_id = ? ORDER BY created_at DESC', [req.session.userId]);
    res.render('todos', { title: 'Assigned Tasks', todos: rows, allTasks: false });
});

router.post('/', async (req, res) => {
    const { title } = req.body;
    if (!title) return res.redirect('/todos');
    await run('INSERT INTO todos (user_id, title) VALUES (?, ?)', [req.session.userId, title]);
    res.redirect('/todos');
});

router.post('/:id/toggle', async (req, res) => {
    await run('UPDATE todos SET completed = 1 - completed WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
    res.redirect('/todos');
});

router.delete('/:id', async (req, res) => {
    await run('DELETE FROM todos WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
    res.redirect('/todos');
});

module.exports = router;


