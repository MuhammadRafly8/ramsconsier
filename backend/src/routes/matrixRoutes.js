const { Router } = require('express');
const router = Router();
const { getAllMatrices, getUserMatrices, getMatrixById, createMatrix, updateMatrix, deleteMatrix } = require('../controllers/matrixController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authenticate);

// Get all matrices (admin only)
router.get('/all', isAdmin, getAllMatrices);

// Get matrices for current user
router.get('/', getUserMatrices);

// Get matrix by ID
router.get('/:id', getMatrixById);

// Create new matrix
router.post('/', createMatrix);

// Update matrix
router.put('/:id', updateMatrix);

// Delete matrix
router.delete('/:id', deleteMatrix);

// Verify matrix access with keyword
router.post('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { keyword } = req.body;
    const userId = req.user.id;
    
    // Get the matrix from database
    const matrix = await req.app.get('models').Matrix.findByPk(id);
    
    if (!matrix) {
      return res.status(404).json({ error: 'Matrix not found' });
    }
    
    // Check if keyword matches
    const authorized = matrix.keyword === keyword;
    
    if (authorized) {
      // Optional: Store authorization in database
      // For example, add user to authorizedUsers array in matrix model
      // or create a separate table for matrix authorizations
      
      // For now, just return success
      return res.json({ authorized: true });
    } else {
      return res.json({ authorized: false });
    }
  } catch (error) {
    console.error('Error verifying matrix access:', error);
    return res.status(500).json({ error: 'Failed to verify access' });
  }
});

module.exports = router;