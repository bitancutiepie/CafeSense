/**
 * User Domain Model / Entity
 */
class User {
    constructor({
        id,
        roleId,
        role,
        fullName,
        username,
        email,
        accountStatus = 'Active',
        createdAt = new Date(),
        updatedAt = new Date()
    }) {
        this.id = id;
        this.roleId = roleId;
        this.role = role;
        this.fullName = fullName;
        this.username = username;
        this.email = email;
        this.accountStatus = accountStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

module.exports = User;