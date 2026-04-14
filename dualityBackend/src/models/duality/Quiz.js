const mongoose = require('mongoose');
const { getExtendedConnection } = require('../../config/extendedDatabase');

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DualityUser',
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DualityQuestion',
      },
    ],
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'ended'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

let Quiz;
const getModel = () => {
  if (!Quiz) {
    const conn = getExtendedConnection();
    Quiz = conn.model('Quiz', quizSchema);
  }
  return Quiz;
};

module.exports = getModel;
