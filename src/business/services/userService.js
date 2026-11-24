
const bcrypt = require('bcrypt');

const userRepository = require('../../data/repositories/userRepository');
const UserValidator = require('../validators/userValidator');
const AppError = require('../../config/utils/appError');

class UserService {

    // GET ALL USERS
    async getAllUsers() {
        return await userRepository.findAll();
    }

    // GET USER BY ID
    async getUserById(id) {
        const user = await userRepository.findById(id);

        if (!user) {
            throw new AppError(
                `User with ID '${id}' not found.`,
                404
            );
        }

        return user;
    }

    // CREATE USER
    async createUser(userData) {
        const { isValid, errors } = UserValidator.validate(
            userData,
            false
        );

        if (!isValid) {
            throw new AppError('Validation Failed', 400, errors);
        }

        // Check duplicates across Active and Inactive accounts
        const existingUsers = await userRepository.findAll();

        const duplicateUsername = existingUsers.some(user =>
            user.username.toLowerCase() ===
            userData.username.trim().toLowerCase()
        );

        if (duplicateUsername) {
            throw new AppError(
                'Username is already registered.',
                409
            );
        }

        const duplicateEmail = existingUsers.some(user =>
            user.email.toLowerCase() ===
            userData.email.trim().toLowerCase()
        );

        if (duplicateEmail) {
            throw new AppError(
                'Email is already registered.',
                409
            );
        }

        const passwordHash = await bcrypt.hash(
            userData.password,
            12
        );

        return await userRepository.create({
            ...userData,
            fullName: userData.fullName.trim(),
            username: userData.username.trim(),
            email: userData.email.trim().toLowerCase(),
            passwordHash
        });
    }

    // UPDATE USER
    async updateUser(id, userData, currentUserId) {
        const existingUser = await this.getUserById(id);

        const { isValid, errors } = UserValidator.validate(
            userData,
            true
        );

        if (!isValid) {
            throw new AppError('Validation Failed', 400, errors);
        }

        // Prevent Owner from removing their own Owner role
        if (
            Number(id) === Number(currentUserId) &&
            userData.role !== 'Owner'
        ) {
            throw new AppError(
                'You cannot remove the Owner role from your own account.',
                400
            );
        }

        const existingUsers = await userRepository.findAll();

        // Check duplicate username
        const duplicateUsername = existingUsers.some(user =>
            user.id !== Number(id) &&
            user.username.toLowerCase() ===
            userData.username.trim().toLowerCase()
        );

        if (duplicateUsername) {
            throw new AppError(
                'Username is already registered.',
                409
            );
        }

        // Check duplicate email
        const duplicateEmail = existingUsers.some(user =>
            user.id !== Number(id) &&
            user.email.toLowerCase() ===
            userData.email.trim().toLowerCase()
        );

        if (duplicateEmail) {
            throw new AppError(
                'Email is already registered.',
                409
            );
        }

        // Count active Owners
        const ownerCount = existingUsers.filter(user =>
            String(user.role).toLowerCase() === 'owner' &&
            user.accountStatus === 'Active'
        ).length;

        // Prevent removing the last active Owner
        if (
            existingUser.accountStatus === 'Active' &&
            String(existingUser.role).toLowerCase() === 'owner' &&
            userData.role !== 'Owner' &&
            ownerCount <= 1
        ) {
            throw new AppError(
                'You cannot remove the role of the last active Owner.',
                400
            );
        }

        const updatedData = {
            fullName: userData.fullName.trim(),
            username: userData.username.trim(),
            email: userData.email.trim().toLowerCase(),
            role: userData.role
        };

        // Update password only when a new password is provided
        if (userData.password) {
            updatedData.passwordHash = await bcrypt.hash(
                userData.password,
                12
            );
        }

        return await userRepository.update(id, updatedData);
    }

    // REACTIVATE USER
    async reactivateUser(id) {
        const user = await this.getUserById(id);

        if (user.accountStatus === 'Active') {
            throw new AppError(
                'This user account is already active.',
                400
            );
        }

        const reactivatedUser = await userRepository.reactivate(id);

        if (!reactivatedUser) {
            throw new AppError(
                'Unable to reactivate this user account.',
                400
            );
        }

        return reactivatedUser;
    }

    // DEACTIVATE USER
    async deleteUser(id, currentUserId) {
        const user = await this.getUserById(id);

        // Prevent self-deactivation
        if (Number(id) === Number(currentUserId)) {
            throw new AppError(
                'You cannot deactivate your own account.',
                400
            );
        }

        const users = await userRepository.findAll();

        const ownerCount = users.filter(account =>
            String(account.role).toLowerCase() === 'owner' &&
            account.accountStatus === 'Active'
        ).length;

        // Prevent deactivation of the last active Owner
        if (
            user.accountStatus === 'Active' &&
            String(user.role).toLowerCase() === 'owner' &&
            ownerCount <= 1
        ) {
            throw new AppError(
                'You cannot deactivate the last active Owner.',
                400
            );
        }

        return await userRepository.delete(id);
    }
}

module.exports = new UserService();
