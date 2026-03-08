const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

/**
 * Helper: run a single query.
 */
const query = (text, params) => pool.query(text, params);

/**
 * Helper: get a client from the pool (for transactions).
 */
const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
