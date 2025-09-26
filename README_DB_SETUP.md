Environment variables (create a .env file at project root):

PORT=3000
SESSION_SECRET=supersecret

# MySQL connection
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=node_app
DB_CONNECTION_LIMIT=10

Create database if not exists:

CREATE DATABASE IF NOT EXISTS node_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

