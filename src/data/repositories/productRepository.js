const db = require('../../config/database');
const Product = require('../../business/models/Product');

/**
 * Product Repository (Layer 3: Data Access Layer)
 * Handles product data access through MySQL.
 */
class ProductRepository {

    // Retrieve all products, with optional category filtering
    async findAll(filter = {}) {
        let sql = `
            SELECT
                p.product_id,
                p.product_name,
                pc.category_name,
                p.price,
                p.stock_quantity,
                p.availability,
                p.created_at
            FROM products p
            LEFT JOIN product_categories pc
                ON p.category_id = pc.category_id
        `;

        const params = [];

        if (filter.category) {
            sql += ` WHERE LOWER(pc.category_name) = LOWER(?)`;
            params.push(filter.category);
        }

        sql += ` ORDER BY p.product_id ASC`;

        const [rows] = await db.execute(sql, params);

        return rows.map(row => new Product({
            id: row.product_id,
            name: row.product_name,
            category: row.category_name,
            price: row.price,
            stock: row.stock_quantity,
            status: row.availability,
            createdAt: row.created_at
        }));
    }

    // Retrieve one product by ID
    async findById(id) {
        const sql = `
            SELECT
                p.product_id,
                p.product_name,
                pc.category_name,
                p.price,
                p.stock_quantity,
                p.availability,
                p.created_at
            FROM products p
            LEFT JOIN product_categories pc
                ON p.category_id = pc.category_id
            WHERE p.product_id = ?
        `;

        const [rows] = await db.execute(sql, [id]);

        if (rows.length === 0) return null;

        const row = rows[0];

        return new Product({
            id: row.product_id,
            name: row.product_name,
            category: row.category_name,
            price: row.price,
            stock: row.stock_quantity,
            status: row.availability,
            createdAt: row.created_at
        });
    }

    // Find category ID using its name
    async findCategoryId(categoryName) {
        const sql = `
            SELECT category_id
            FROM product_categories
            WHERE LOWER(category_name) = LOWER(?)
        `;

        const [rows] = await db.execute(sql, [categoryName]);

        if (rows.length === 0) {
            throw new Error(`Category '${categoryName}' does not exist.`);
        }

        return rows[0].category_id;
    }

    // Generate the next product code (P016, P017, etc.)
    async generateProductCode() {
        const sql = `
            SELECT COALESCE(
                MAX(CAST(SUBSTRING(product_code, 2) AS UNSIGNED)),
                0
            ) + 1 AS next_number
            FROM products
            WHERE product_code REGEXP '^P[0-9]+$'
        `;

        const [rows] = await db.execute(sql);

        return `P${String(rows[0].next_number).padStart(3, '0')}`;
    }

    // Create a new product
    async create(productData) {
        const categoryId = await this.findCategoryId(productData.category);
        const productCode = await this.generateProductCode();

        const sql = `
            INSERT INTO products (
                product_code,
                category_id,
                product_name,
                price,
                stock_quantity,
                availability
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.execute(sql, [
            productCode,
            categoryId,
            productData.name,
            productData.price,
            productData.stock ?? 0,
            productData.status || 'Available'
        ]);

        return this.findById(result.insertId);
    }

    // Update an existing product
    async update(id, updateData) {
        const fields = [];
        const values = [];

        const columnMap = {
            name: 'product_name',
            price: 'price',
            stock: 'stock_quantity',
            status: 'availability'
        };

        for (const [key, column] of Object.entries(columnMap)) {
            if (updateData[key] !== undefined) {
                fields.push(`${column} = ?`);
                values.push(updateData[key]);
            }
        }

        // Convert category name into its database ID
        if (updateData.category !== undefined) {
            const categoryId = await this.findCategoryId(updateData.category);

            fields.push('category_id = ?');
            values.push(categoryId);
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `
            UPDATE products
            SET ${fields.join(', ')}
            WHERE product_id = ?
        `;

        const [result] = await db.execute(sql, values);

        if (result.affectedRows === 0) return null;

        return this.findById(id);
    }

    // Adjust product stock and record inventory movement
    async adjustStock(id, adjustmentData) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const { action, quantity, reason } = adjustmentData;

            // Temporary demo user: Owner account
            const userId = adjustmentData.userId || 1;

            // Lock product record to prevent conflicting stock updates
            const [rows] = await connection.execute(
                `SELECT stock_quantity
                 FROM products
                 WHERE product_id = ?
                 FOR UPDATE`,
                [id]
            );

            if (rows.length === 0) {
                throw new Error(`Product with ID '${id}' not found.`);
            }

            const currentStock = Number(rows[0].stock_quantity);

            // Determine stock adjustment
            let movementType;
            let quantityChange;

            if (action === 'add') {
                movementType = 'Adjustment In';
                quantityChange = Number(quantity);
            } else if (action === 'remove') {
                movementType = 'Adjustment Out';
                quantityChange = -Number(quantity);
            } else {
                throw new Error('Invalid stock adjustment action.');
            }

            const newStock = currentStock + quantityChange;

            if (newStock < 0) {
                throw new Error('Insufficient stock for this adjustment.');
            }

            // Update product stock
            await connection.execute(
                `UPDATE products
                 SET stock_quantity = ?,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE product_id = ?`,
                [newStock, id]
            );

            // Record inventory movement
            await connection.execute(
                `INSERT INTO inventory_movements (
                    product_id,
                    user_id,
                    transaction_id,
                    movement_type,
                    quantity_change,
                    stock_before,
                    stock_after,
                    reason
                )
                VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
                [
                    id,
                    userId,
                    movementType,
                    quantityChange,
                    currentStock,
                    newStock,
                    reason
                ]
            );

            await connection.commit();

            return await this.findById(id);

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    }

    // Retrieve inventory movement history
    async getInventoryMovements(filter = {}) {
        let sql = `
            SELECT
                im.movement_id AS movementId,
                im.product_id AS productId,
                p.product_name AS productName,
                im.user_id AS userId,
                u.full_name AS performedBy,
                im.transaction_id AS transactionId,
                im.movement_type AS movementType,
                im.quantity_change AS quantityChange,
                im.stock_before AS stockBefore,
                im.stock_after AS stockAfter,
                im.reason,
                im.movement_date AS movementDate
            FROM inventory_movements im
            INNER JOIN products p
                ON im.product_id = p.product_id
            INNER JOIN users u
                ON im.user_id = u.user_id
        `;

        const params = [];

        // Optional product filter
        if (filter.productId) {
            sql += ` WHERE im.product_id = ?`;
            params.push(filter.productId);
        }

        // Display newest movements first
        sql += `
            ORDER BY im.movement_date DESC, im.movement_id DESC
        `;

        const [rows] = await db.execute(sql, params);

        return rows;
    }

    // Delete a product
    async delete(id) {
        const sql = `
            DELETE FROM products
            WHERE product_id = ?
        `;

        const [result] = await db.execute(sql, [id]);

        return result.affectedRows > 0;
    }
}

module.exports = new ProductRepository();