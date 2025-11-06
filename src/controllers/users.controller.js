import logger from '#config/logger.js';
import {
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '#services/users.service.js';
import { userIdSchema, updateUserSchema } from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';
import { jwttoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users...');

    const allUsers = await getAllUsers();

    res.json({
      message: 'Successfully retrieved users',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const validation = userIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json({
        ereror: 'validation failed',
        details: formatValidationError(validation.error),
      });
    }

    const { id } = validation.data;

    logger.info(`Getting user by id: ${id}`);

    const user = await getUserByIdService(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Successfully retrieved user', user });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    // Validate params
    const paramsValidation = userIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      return res.status(400).json({
        ereror: 'validation failed',
        details: formatValidationError(paramsValidation.error),
      });
    }

    // Validate body
    const bodyValidation = updateUserSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({
        ereror: 'validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramsValidation.data;
    const updates = bodyValidation.data;

    // Authenticate
    const token = cookies.get(req, 'token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let authUser;
    try {
      authUser = jwttoken.verify(token);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Authorization: users can update only themselves unless admin
    const isSelf = Number(authUser.id) === Number(id);
    const isAdmin = authUser.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Only admin can change role
    if (updates.role && !isAdmin) {
      return res
        .status(403)
        .json({ error: 'Forbidden', message: 'Only admin can change role' });
    }

    const updated = await updateUserService(id, updates);

    res.json({ message: 'User updated successfully', user: updated });
  } catch (e) {
    logger.error(e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const paramsValidation = userIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      return res.status(400).json({
        ereror: 'validation failed',
        details: formatValidationError(paramsValidation.error),
      });
    }

    const { id } = paramsValidation.data;

    // Authenticate
    const token = cookies.get(req, 'token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let authUser;
    try {
      authUser = jwttoken.verify(token);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Authorization: users can delete only themselves; admin can delete anyone
    const isSelf = Number(authUser.id) === Number(id);
    const isAdmin = authUser.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await deleteUserService(id);

    res.json({ message: 'User deleted successfully' });
  } catch (e) {
    logger.error(e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};
