import { db } from '#config/database.js';
import logger from '#config/logger.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';
import { hashPassword } from '#services/auth.service.js';

export const getAllUsers = async () => {
  try {
    return await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users);
  } catch (e) {
    logger.error('Error getting users', e);
    throw e;
  }
};

export const getUserById = async id => {
  try {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return rows[0] || null;
  } catch (e) {
    logger.error('Error getting user by id', e);
    throw e;
  }
};

export const updateUser = async (id, updates) => {
  try {
    // Ensure the user exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (existing.length === 0) {
      throw new Error('User not found');
    }

    const dataToUpdate = {};

    if (typeof updates.name === 'string') dataToUpdate.name = updates.name;
    if (typeof updates.email === 'string') dataToUpdate.email = updates.email;
    if (typeof updates.role === 'string') dataToUpdate.role = updates.role;
    if (typeof updates.password === 'string' && updates.password.length > 0) {
      dataToUpdate.password = await hashPassword(updates.password);
    }

    // Always bump the updated_at timestamp when updating
    dataToUpdate.updated_at = new Date();

    const [updated] = await db
      .update(users)
      .set(dataToUpdate)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    logger.info(`User ${updated.email} updated successfully`);
    return updated;
  } catch (e) {
    logger.error('Error updating user', e);
    throw e;
  }
};

export const deleteUser = async id => {
  try {
    const deleted = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id, email: users.email });

    if (deleted.length === 0) {
      throw new Error('User not found');
    }

    logger.info(`User ${deleted[0].email} deleted successfully`);
    return { id: deleted[0].id };
  } catch (e) {
    logger.error('Error deleting user', e);
    throw e;
  }
};
