/**
 * Product Domain Model / Entity
 */
class Product {
    constructor({ id, name, category, price, stock = 0, status = 'Available', createdAt = new Date() }) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = Number(price);
        this.stock = Number(stock);
        this.status = status;
        this.createdAt = createdAt;
    }
}

module.exports = Product;
