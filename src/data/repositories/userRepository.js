
const db = require('../../config/database');
const User = require('../../business/models/User');

class UserRepository {

    // MAP DATABASE RECORD TO USER MODEL
    mapUser(row) {
        return new User({
            id: row.user_id,
            roleId: row.role_id,
            role: row.role_name,
            fullName: row.full_name,
            username: row.username,
            email: row.email,
            accountStatus: row.account_status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }

    // FIND USER BY USERNAME OR EMAIL
    async findByUsernameOrEmail(identifier) {
        const sql = `
            SELECT
                u.user_id,
                u.role_id,
                r.role_name,
                u.full_name,
                u.username,
                u.email,
                u.password_hash,
                u.account_status,
                u.created_at,
                u.updated_at
            FROM users u
            INNER JOIN roles r
                ON u.role_id = r.role_id
            WHERE u.username = ?
                OR u.email = ?
            LIMIT 1
        `;

        const [rows] = await db.execute(sql, [
            identifier,
            identifier
        ]);

        if (rows.length === 0) {
            return null;
        }

        return {
            user: this.mapUser(rows[0]),
            passwordHash: rows[0].password_hash
        };
    }

    // GET ALL USERS
    // Includes both Active and Inactive accounts
    async findAll() {
        const sql = `
            SELECT
                u.user_id,
                u.role_id,
                r.role_name,
                u.full_name,
                u.username,
                u.email,
                u.account_status,
                u.created_at,
                u.updated_at
            FROM users u
            INNER JOIN roles r
                ON u.role_id = r.role_id
            ORDER BY u.user_id ASC
        `;

        const [rows] = await db.execute(sql);

        return rows.map(row => this.mapUser(row));
    }

    // GET USER BY ID
    async findById(id) {
        const sql = `
            SELECT
                u.user_id,
                u.role_id,
                r.role_name,
                u.full_name,
                u.username,
                u.email,
                u.account_status,
                u.created_at,
                u.updated_at
            FROM users u
            INNER JOIN roles r
                ON u.role_id = r.role_id
            WHERE u.user_id = ?
            LIMIT 1
        `;

        const [rows] = await db.execute(sql, [id]);

        if (rows.length === 0) {
            return null;
        }

        return this.mapUser(rows[0]);
    }

    // CREATE USER
    async create(userData) {
        const sql = `
            INSERT INTO users (
                role_id,
                full_name,
                username,
                email,
                password_hash,
                account_status
            )
            VALUES (
                (SELECT role_id FROM roles WHERE role_name = ?),
                ?,
                ?,
                ?,
                ?,
                'Active'
            )
        `;

        const [result] = await db.execute(sql, [
            userData.role,
            userData.fullName,
            userData.username,
            userData.email,
            userData.passwordHash
        ]);

        return await this.findById(result.insertId);
    }

    // UPDATE USER
    async update(id, userData) {
        const fields = [
            'full_name = ?',
            'username = ?',
            'email = ?',
            'role_id = (SELECT role_id FROM roles WHERE role_name = ?)'
        ];

        const values = [
            userData.fullName,
            userData.username,
            userData.email,
            userData.role
        ];

        // Update password only when provided
        if (userData.passwordHash) {
            fields.push('password_hash = ?');
            values.push(userData.passwordHash);
        }

        const sql = `
            UPDATE users
            SET ${fields.join(', ')}
            WHERE user_id = ?
        `;

        values.push(id);

        await db.execute(sql, values);

        return await this.findById(id);
    }

    // UPDATE PASSWORD
    async updatePassword(id, passwordHash) {
        const sql = `
            UPDATE users
            SET password_hash = ?
            WHERE user_id = ?
        `;

        const [result] = await db.execute(sql, [
            passwordHash,
            id
        ]);

        return result.affectedRows > 0;
    }

    // REACTIVATE USER
    async reactivate(id) {
        const sql = `
            UPDATE users
            SET account_status = 'Active'
            WHERE user_id = ?
                AND account_status = 'Inactive'
        `;

        const [result] = await db.execute(sql, [id]);

        if (result.affectedRows === 0) {
            return null;
        }

        return await this.findById(id);
    }

    // DEACTIVATE USER
    async delete(id) {
        const sql = `
            UPDATE users
            SET account_status = 'Inactive'
            WHERE user_id = ?
        `;

        const [result] = await db.execute(sql, [id]);

        return result.affectedRows > 0;
    }
}

module.exports = new UserRepository();
