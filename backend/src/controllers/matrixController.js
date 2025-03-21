import { Matrix, User } from '../models';
import { Op } from 'sequelize';

// Get all matrices (admin only)
export async function getAllMatrices(req, res) {
  try {
    const matrices = await Matrix.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ]
    });
    
    return res.status(200).json(matrices);
  } catch (error) {
    console.error('Error fetching matrices:', error);
    return res.status(500).json({ error: 'Failed to fetch matrices' });
  }
}

// Get matrices created by user or shared with user
export async function getUserMatrices(req, res) {
  try {
    const userId = req.user.id;
    
    const matrices = await Matrix.findAll({
      where: {
        [Op.or]: [
          { createdBy: userId },
          { sharedWith: { [Op.contains]: [userId] } }
        ]
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ]
    });
    
    return res.status(200).json(matrices);
  } catch (error) {
    console.error('Error fetching user matrices:', error);
    return res.status(500).json({ error: 'Failed to fetch matrices' });
  }
}

// Get matrix by ID
export async function getMatrixById(req, res) {
  try {
    const { id } = req.params;
    
    const matrix = await Matrix.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ]
    });
    
    if (!matrix) {
      return res.status(404).json({ error: 'Matrix not found' });
    }
    
    return res.status(200).json(matrix);
  } catch (error) {
    console.error('Error fetching matrix:', error);
    return res.status(500).json({ error: 'Failed to fetch matrix' });
  }
}

// Create new matrix
export async function createMatrix(req, res) {
  try {
    const { title, description, keyword, data } = req.body;
    const userId = req.user.id;
    
    const newMatrix = await Matrix.create({
      title,
      description,
      keyword,
      data: data || {
        rows: [],
        columns: [],
        dependencies: {}
      },
      createdBy: userId
    });
    
    return res.status(201).json(newMatrix);
  } catch (error) {
    console.error('Error creating matrix:', error);
    return res.status(500).json({ error: 'Failed to create matrix' });
  }
}

// Update matrix
export async function updateMatrix(req, res) {
  try {
    const { id } = req.params;
    const { title, description, keyword, data, sharedWith } = req.body;
    const userId = req.user.id;
    
    const matrix = await Matrix.findByPk(id);
    
    if (!matrix) {
      return res.status(404).json({ error: 'Matrix not found' });
    }
    
    // Check if user is the creator or admin
    if (matrix.createdBy !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this matrix' });
    }
    
    await matrix.update({
      title: title || matrix.title,
      description: description !== undefined ? description : matrix.description,
      keyword: keyword || matrix.keyword,
      data: data || matrix.data,
      sharedWith: sharedWith || matrix.sharedWith
    });
    
    return res.status(200).json(matrix);
  } catch (error) {
    console.error('Error updating matrix:', error);
    return res.status(500).json({ error: 'Failed to update matrix' });
  }
}

// Delete matrix
export async function deleteMatrix(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const matrix = await Matrix.findByPk(id);
    
    if (!matrix) {
      return res.status(404).json({ error: 'Matrix not found' });
    }
    
    // Check if user is the creator or admin
    if (matrix.createdBy !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this matrix' });
    }
    
    await matrix.destroy();
    
    return res.status(200).json({ message: 'Matrix deleted successfully' });
  } catch (error) {
    console.error('Error deleting matrix:', error);
    return res.status(500).json({ error: 'Failed to delete matrix' });
  }
}