function requireAuth(req, res, next) {
	if (!req.session.userId) {
		req.session.flash = { type: 'warning', message: 'Please login first.' };
		return res.redirect('/login');
	}
	next();
}

function requireRole(...allowedRoles) {
	return async function roleCheck(req, res, next) {
		try {
			const { get } = require('../db');
			const user = await get('SELECT id, role FROM users WHERE id = ?', [req.session.userId]);
			if (!user || !allowedRoles.includes(user.role)) {
				return res.status(403).send('Forbidden');
			}
			return next();
		} catch (e) {
			return res.status(500).send('Server error');
		}
	};
}

module.exports = { requireAuth, requireRole };


