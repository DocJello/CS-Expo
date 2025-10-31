const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { pool, initializeDatabase } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
// FIX: Implemented a more robust and explicit CORS configuration to resolve persistent CORS errors.
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true,
};
app.use(cors(corsOptions));
// This explicit options handler can resolve edge cases on some platforms.
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));


// --- AUTH ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT id, name, email, role, password_hash FROM users WHERE email = $1', [email]);
        if (result.rowCount === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const { password_hash, ...userToSend } = user;
        res.json(userToSend);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- USERS ---
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/users', async (req, res) => {
    const { name, email, role, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const result = await pool.query(
            'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, role, password_hash]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // unique_violation
            return res.status(409).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, role, password } = req.body;
    try {
        let password_hash;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            password_hash = await bcrypt.hash(password, salt);
        }

        const currentUser = await pool.query('SELECT password_hash FROM users WHERE id = $1', [id]);
        
        const result = await pool.query(
            `UPDATE users SET name = $1, email = $2, role = $3 ${password ? ', password_hash = $4' : ''} WHERE id = $5 RETURNING id, name, email, role`,
            password ? [name, email, role, password_hash, id] : [name, email, role, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/users/bulk-create', async (req, res) => {
    const usersToCreate = req.body;
    let addedCount = 0;
    let skippedCount = 0;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash('password', salt);
        
        for (const user of usersToCreate) {
             const existing = await client.query('SELECT 1 FROM users WHERE email = $1 OR name = $2', [user.email, user.name]);
             if (existing.rowCount === 0) {
                 await client.query(
                     'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4)',
                     [user.name, user.email, user.role, password_hash]
                 );
                 addedCount++;
             } else {
                 skippedCount++;
             }
        }
        await client.query('COMMIT');
        res.json({ addedCount, skippedCount });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

app.post('/api/users/bulk-update-emails', async (req, res) => {
    const updates = req.body;
    let updatedCount = 0;
    let notFoundCount = 0;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const update of updates) {
            const result = await client.query('UPDATE users SET email = $1 WHERE name = $2', [update.email, update.name]);
            if (result.rowCount > 0) {
                updatedCount++;
            } else {
                notFoundCount++;
            }
        }
        await client.query('COMMIT');
        res.json({ updatedCount, notFoundCount });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

app.post('/api/users/:id/change-password', async (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
    try {
        const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }
        const salt = await bcrypt.genSalt(10);
        const new_password_hash = await bcrypt.hash(newPassword, salt);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [new_password_hash, id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- GROUPS ---
app.get('/api/groups', async (req, res) => {
    try {
        const groupsResult = await pool.query('SELECT * FROM groups ORDER BY name');
        const gradesResult = await pool.query('SELECT * FROM panel_grades');

        const groups = groupsResult.rows.map(group => {
            const groupGrades = gradesResult.rows.filter(grade => grade.group_id === group.id).map(g => ({
                panelistId: g.panelist_id,
                presenterScores: g.presenter_scores,
                thesisScores: g.thesis_scores,
                submitted: g.submitted,
            }));
            return {
                ...group,
                grades: groupGrades,
                panel1Id: group.panel1_id,
                panel2Id: group.panel2_id,
                externalPanelId: group.external_panel_id,
                projectTitle: group.project_title
            };
        });
        res.json(groups);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/groups/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const groupResult = await pool.query('SELECT * FROM groups WHERE id = $1', [id]);
        if (groupResult.rowCount === 0) return res.status(404).json({ message: 'Group not found' });
        
        const gradesResult = await pool.query('SELECT * FROM panel_grades WHERE group_id = $1', [id]);
        
        const groupGrades = gradesResult.rows.map(g => ({
            panelistId: g.panelist_id,
            presenterScores: g.presenter_scores,
            thesisScores: g.thesis_scores,
            submitted: g.submitted,
        }));
        
        const rawGroup = groupResult.rows[0];
        const group = {
            ...rawGroup,
            grades: groupGrades,
            panel1Id: rawGroup.panel1_id,
            panel2Id: rawGroup.panel2_id,
            externalPanelId: rawGroup.external_panel_id,
            projectTitle: rawGroup.project_title
        };
        res.json(group);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


app.post('/api/groups', async (req, res) => {
    const { name, projectTitle, members, panel1Id, panel2Id, externalPanelId } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO groups (name, project_title, members, status, panel1_id, panel2_id, external_panel_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, projectTitle, members || [], 'Not Started', panel1Id || null, panel2Id || null, externalPanelId || null]
        );
        res.status(201).json({ ...result.rows[0], grades: [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/groups/:id', async (req, res) => {
    const { id } = req.params;
    const { name, projectTitle, members, panel1Id, panel2Id, externalPanelId, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE groups SET name = $1, project_title = $2, members = $3, panel1_id = $4, panel2_id = $5, external_panel_id = $6, status = $7 WHERE id = $8 RETURNING *',
            [name, projectTitle, members, panel1Id || null, panel2Id || null, externalPanelId || null, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/groups/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM groups WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/groups/bulk-create', async (req, res) => {
    const groupsToCreate = req.body;
    let addedCount = 0;
    let skippedCount = 0;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const group of groupsToCreate) {
             const existing = await client.query('SELECT 1 FROM groups WHERE name = $1', [group.name]);
             if (existing.rowCount === 0) {
                 await client.query(
                     'INSERT INTO groups (name, project_title, status, members) VALUES ($1, $2, $3, $4)',
                     [group.name, group.projectTitle || 'TBA', 'Not Started', []]
                 );
                 addedCount++;
             } else {
                 skippedCount++;
             }
        }
        await client.query('COMMIT');
        res.json({ addedCount, skippedCount });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

app.delete('/api/groups/all', async (req, res) => {
    try {
        await pool.query('DELETE FROM groups');
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- GRADING ---
app.post('/api/grades/:groupId', async (req, res) => {
    const { groupId } = req.params;
    const { panelistId, presenterScores, thesisScores } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Upsert grade
        await client.query(`
            INSERT INTO panel_grades (group_id, panelist_id, presenter_scores, thesis_scores, submitted)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT (group_id, panelist_id)
            DO UPDATE SET presenter_scores = $3, thesis_scores = $4, submitted = true;
        `, [groupId, panelistId, presenterScores, thesisScores]);

        // Check if group grading is complete
        const groupRes = await client.query('SELECT panel1_id, panel2_id, external_panel_id FROM groups WHERE id = $1', [groupId]);
        const group = groupRes.rows[0];
        const panelistIds = [group.panel1_id, group.panel2_id, group.external_panel_id].filter(Boolean);
        
        const gradesRes = await client.query('SELECT panelist_id FROM panel_grades WHERE group_id = $1 AND submitted = true', [groupId]);
        const submittedPanelistIds = new Set(gradesRes.rows.map(r => r.panelist_id));
        
        const allSubmitted = panelistIds.every(id => submittedPanelistIds.has(id));

        let newStatus = 'In Progress';
        if (allSubmitted && panelistIds.length > 0) {
            newStatus = 'Completed';
        } else if (submittedPanelistIds.size > 0) {
             newStatus = 'In Progress';
        } else {
             newStatus = 'Not Started';
        }

        await client.query('UPDATE groups SET status = $1 WHERE id = $2', [newStatus, groupId]);

        await client.query('COMMIT');

        const finalGroup = await client.query('SELECT * FROM groups WHERE id = $1', [groupId]);
        res.json(finalGroup.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});


// --- SYSTEM ---
app.get('/api/system/backup', async (req, res) => {
    try {
        const users = await pool.query('SELECT id, name, email, role, password_hash FROM users');
        const groups = await pool.query('SELECT * FROM groups');
        const grades = await pool.query('SELECT * FROM panel_grades');
        
        // Combine grades into groups
        const groupData = groups.rows.map(g => ({
            ...g,
            grades: grades.rows.filter(gr => gr.group_id === g.id)
        }));

        res.json({ users: users.rows, groups: groupData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/system/restore', async (req, res) => {
    const { users, groups } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Clear tables
        await client.query('TRUNCATE panel_grades, groups, users RESTART IDENTITY CASCADE');

        // Restore users
        for (const user of users) {
             await client.query(
                'INSERT INTO users (id, name, email, role, password_hash) VALUES ($1, $2, $3, $4, $5)',
                [user.id, user.name, user.email, user.role, user.password_hash]
            );
        }

        // Restore groups and grades
        for (const group of groups) {
            const { grades, ...groupData } = group;
            await client.query(
                'INSERT INTO groups (id, name, project_title, members, status, panel1_id, panel2_id, external_panel_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [groupData.id, groupData.name, groupData.project_title, groupData.members, groupData.status, groupData.panel1_id, groupData.panel2_id, groupData.external_panel_id]
            );
            if (grades) {
                for (const grade of grades) {
                    await client.query(
                        'INSERT INTO panel_grades (id, group_id, panelist_id, presenter_scores, thesis_scores, submitted) VALUES ($1, $2, $3, $4, $5, $6)',
                        [grade.id, grade.group_id, grade.panelist_id, grade.presenter_scores, grade.thesis_scores, grade.submitted]
                    );
                }
            }
        }
        
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

// Start server
const startServer = async () => {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
