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
  }]
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
exerciseSchema.index({ category: 1, isActive: 1 });

export default mongoose.model('Exercise', exerciseSchema);
