import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'fill-blank', 'true-false'],
    default: 'multiple-choice'
  },
  options: [{
    type: String
  }],
  correct: {
    type: mongoose.Schema.Types.Mixed, // Can be string or array
    required: true
  },
  blanks: [{
    type: String
  }],
  explanation: {
    type: String,
    default: ''
  }
});

const exerciseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['reading', 'listening', 'clozetext']
  },
  title: {
    type: String,
    required: function() {
      return this.category === 'reading' || this.category === 'listening';
    }
  },
  passage: {
    type: String
  },
  audioUrl: {
    type: String
  },
  transcript: {
    type: String
  },
  questions: [questionSchema],
  // For clozetext (single question format)
  question: {
    type: String
  },
  options: [{
    type: String
  }],
  correct: {
    type: String
  },
  image: {
    type: String
  },
  explanation: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to auto-generate ID if not provided
exerciseSchema.pre('save', async function(next) {
  if (!this.id || this.id === '') {
    try {
      // Find all exercises in the same category
      const categoryExercises = await this.constructor.find({ 
        category: this.category 
      }).sort({ createdAt: 1 });
      
      let maxId = 0;
      categoryExercises.forEach(exercise => {
        const match = exercise.id.match(new RegExp(`${this.category}-(\\d+)`));
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxId) {
            maxId = num;
          }
        }
      });
      
      this.id = `${this.category}-${maxId + 1}`;
    } catch (error) {
      console.error('Error generating auto ID:', error);
      return next(error);
    }
  }
  next();
});

// Index for better query performance
exerciseSchema.index({ category: 1, isActive: 1 });

export default mongoose.model('Exercise', exerciseSchema);
