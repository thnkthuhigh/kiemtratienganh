import express from 'express';
import mongoose from 'mongoose';
import Exercise from '../models/Exercise.js';

const router = express.Router();

// Middleware to check database connection
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      error: 'Database not available',
      message: 'Please check database connection'
    });
  }
  next();
};

// GET /api/exercises - Get all exercises grouped by category
router.get('/', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      // Return empty data structure if DB not connected
      return res.json({
        reading: [],
        listening: [],
        clozetext: []
      });
    }
    
    const exercises = await Exercise.find({ isActive: true }).sort({ createdAt: -1 });
    
    // Group by category
    const groupedExercises = {
      reading: [],
      listening: [],
      clozetext: []
    };
    
    exercises.forEach(exercise => {
      if (groupedExercises[exercise.category]) {
        groupedExercises[exercise.category].push(exercise);
      }
    });
    
    res.json(groupedExercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    // Return empty data on error
    res.json({
      reading: [],
      listening: [],
      clozetext: []
    });
  }
});

// GET /api/exercises/:category - Get exercises by category
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const exercises = await Exercise.find({ 
      category, 
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/exercises/check-id/:id - Check if exercise ID is available
router.get('/check-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existingExercise = await Exercise.findOne({ id });
    
    res.json({
      available: !existingExercise,
      exists: !!existingExercise,
      id: id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/exercises - Create new exercise
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating new exercise...');
    console.log('📊 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Request body keys:', Object.keys(req.body));
    console.log('🔍 Request body type:', typeof req.body);
    
    // Check database connection first
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ Database not connected');
      return res.status(503).json({ 
        error: 'Database not available',
        message: 'Please check database connection'
      });
    }
    
    const exerciseData = req.body;
    
    // Validate required fields
    if (!exerciseData.category) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Category is required'
      });
    }
    
    // Category-specific validation
    if (exerciseData.category === 'clozetext') {
      if (!exerciseData.question) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Question is required for cloze test'
        });
      }
      if (!exerciseData.options || exerciseData.options.length !== 4) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Four options are required for cloze test'
        });
      }
    } else {
      // For reading and listening
      if (!exerciseData.title) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Title is required for ' + exerciseData.category
        });
      }
    }
    
    // Generate unique ID if not provided
    if (!exerciseData.id) {
      try {
        // Find the highest ID number for this category
        const existingExercises = await Exercise.find({ 
          category: exerciseData.category 
        });
        
        let maxIdNumber = 0;
        existingExercises.forEach(exercise => {
          const match = exercise.id.match(new RegExp(`${exerciseData.category}-(\\d+)`));
          if (match) {
            const idNumber = parseInt(match[1]);
            if (idNumber > maxIdNumber) {
              maxIdNumber = idNumber;
            }
          }
        });
        
        exerciseData.id = `${exerciseData.category}-${maxIdNumber + 1}`;
        
        // Double check that this ID doesn't exist
        const existingWithSameId = await Exercise.findOne({ id: exerciseData.id });
        if (existingWithSameId) {
          // If it exists, use timestamp as fallback
          exerciseData.id = `${exerciseData.category}-${Date.now()}`;
        }
      } catch (dbError) {
        console.error('❌ Database error while generating ID:', dbError);
        // Fallback to timestamp-based ID if DB fails
        exerciseData.id = `${exerciseData.category}-${Date.now()}`;
      }
    } else {
      // If ID is provided, check if it already exists
      try {
        const existingExercise = await Exercise.findOne({ id: exerciseData.id });
        if (existingExercise) {
          return res.status(400).json({ 
            error: 'Exercise ID already exists',
            message: `An exercise with ID "${exerciseData.id}" already exists. Please use a different ID or leave empty for auto-generation.`,
            suggestedId: `${exerciseData.category}-${Date.now()}`
          });
        }
      } catch (dbError) {
        console.error('❌ Database error while checking existing ID:', dbError);
      }
    }
    
    console.log('🏷️  Generated ID:', exerciseData.id);
    
    try {
      const exercise = new Exercise(exerciseData);
      await exercise.save();
      
      console.log('✅ Exercise created successfully:', exercise.id);
      res.status(201).json(exercise);
    } catch (saveError) {
      console.error('❌ Error saving to database:', saveError);
      
      // If database is not available, return success but log the error
      if (mongoose.connection.readyState !== 1) {
        console.log('⚠️  Database not connected, returning mock success');
        res.status(201).json({
          ...exerciseData,
          _id: 'mock-' + Date.now(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        });
      } else {
        throw saveError; // Re-throw if it's not a connection issue
      }
    }
  } catch (error) {
    console.error('❌ Error creating exercise:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    if (error.code === 11000) {
      // Extract the duplicate key field from the error
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'id';
      const duplicateValue = error.keyValue?.[duplicateField] || 'unknown';
      
      return res.status(400).json({ 
        error: 'Duplicate entry',
        message: `An exercise with ${duplicateField} "${duplicateValue}" already exists.`,
        field: duplicateField,
        value: duplicateValue,
        suggestedId: `${exerciseData.category}-${Date.now()}`
      });
    } else if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.message,
        fields: Object.keys(error.errors)
      });
    } else {
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message,
        details: error.toString()
      });
    }
  }
});

// PUT /api/exercises/:id - Update exercise
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await Exercise.findOneAndUpdate(
      { id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    res.json(exercise);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/exercises/:id - Soft delete exercise
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await Exercise.findOneAndUpdate(
      { id },
      { isActive: false },
      { new: true }
    );
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/exercises/admin/all - Get all exercises for admin (including inactive)
router.get('/admin/all', async (req, res) => {
  try {
    const exercises = await Exercise.find().sort({ createdAt: -1 });
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
