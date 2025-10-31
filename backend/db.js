const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// The connection to a production database like Render's requires SSL.
// This configuration is more explicit and reliable than checking NODE_ENV.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        project_title TEXT,
        members TEXT[],
        panel1_id UUID REFERENCES users(id) ON DELETE SET NULL,
        panel2_id UUID REFERENCES users(id) ON DELETE SET NULL,
        external_panel_id UUID REFERENCES users(id) ON DELETE SET NULL,
        status TEXT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS panel_grades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        panelist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        presenter_scores JSONB,
        thesis_scores JSONB,
        submitted BOOLEAN NOT NULL DEFAULT false,
        UNIQUE (group_id, panelist_id)
      );
    `);

    // Seed initial admin user using an UPSERT to guarantee it exists.
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('123', salt);
    await client.query(
      `INSERT INTO users (name, email, role, password_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email)
       DO UPDATE SET
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         password_hash = EXCLUDED.password_hash;`,
      ['User Admin', 'admin@example.com', 'Admin', password_hash]
    );
    console.log('Admin user ensured to exist.');


    console.log('Database tables verified/created successfully.');
  } catch (err) {
    console.error('Error initializing database', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, initializeDatabase };
