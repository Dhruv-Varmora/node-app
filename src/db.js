require('dotenv').config();
const mysql = require('mysql2/promise');

let pool;

function getPool() {
	if (!pool) {
		pool = mysql.createPool({
			host: process.env.DB_HOST || 'localhost',
			user: process.env.DB_USER || 'root',
			password: process.env.DB_PASSWORD || '',
			database: process.env.DB_NAME || 'node_app',
			port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
			connectionLimit: process.env.DB_CONNECTION_LIMIT ? Number(process.env.DB_CONNECTION_LIMIT) : 10,
			multipleStatements: false,
		});
	}
	return pool;
}

async function run(sql, params = []) {
	const [result] = await getPool().execute(sql, params);
	return {
		insertId: result.insertId || 0,
		affectedRows: result.affectedRows || 0,
	};
}

async function get(sql, params = []) {
	const [rows] = await getPool().execute(sql, params);
	return rows && rows[0] ? rows[0] : null;
}

async function all(sql, params = []) {
	const [rows] = await getPool().execute(sql, params);
	return rows || [];
}

async function initDb() {
	await run(
		`CREATE TABLE IF NOT EXISTS users (
			id INT NOT NULL AUTO_INCREMENT,
			name VARCHAR(255) NOT NULL,
			email VARCHAR(255) NOT NULL UNIQUE,
			password_hash VARCHAR(255) NOT NULL,
			role VARCHAR(50) NOT NULL DEFAULT 'admin',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
	);

	await run(
		`CREATE TABLE IF NOT EXISTS todos (
			id INT NOT NULL AUTO_INCREMENT,
			user_id INT NOT NULL,
			title VARCHAR(255) NOT NULL,
			completed TINYINT(1) DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY idx_todos_user_id (user_id),
			CONSTRAINT fk_todos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
	);
}

module.exports = {
	run,
	get,
	all,
	initDb,
};

