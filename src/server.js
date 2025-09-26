require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const MySQLStore = require('express-mysql-session')(session);
const methodOverride = require('method-override');
const { initDb } = require('./db');

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const userRoutes = require('./routes/users');
const apiAuthRoutes = require('./routes/api.auth');
const apiTodoRoutes = require('./routes/api.todos');
const apiUserRoutes = require('./routes/api.users');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Sessions (MySQL store)
const sessionStore = new MySQLStore({
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'node_app',
});

app.use(
	session({
		store: sessionStore,
		secret: process.env.SESSION_SECRET || 'supersecret',
		resave: false,
		saveUninitialized: false,
		cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 days
	})
);

// Locals for views
app.use(async (req, res, next) => {
	res.locals.currentUserId = req.session.userId || null;
	res.locals.flash = req.session.flash || null;
	
	// Add user role for navigation
	if (req.session.userId) {
		try {
			const { get } = require('./db');
			const user = await get('SELECT role FROM users WHERE id = ?', [req.session.userId]);
			res.locals.userRole = user ? user.role : null;
		} catch (e) {
			res.locals.userRole = null;
		}
	} else {
		res.locals.userRole = null;
	}
	
	delete req.session.flash;
	next();
});

// Initialize database
initDb();

// Routes
app.use('/', authRoutes);
app.use('/todos', todoRoutes);
app.use('/users', userRoutes);
app.use('/api/auth', apiAuthRoutes);
app.use('/api/todos', apiTodoRoutes);
app.use('/api/users', apiUserRoutes);

app.get('/', (req, res) => {
	res.render('index', { title: 'Home' });
});

// 404 handler
app.use((req, res) => {
	res.status(404).render('index', { title: 'Not Found' });
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});


