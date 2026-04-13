const mongoose = require('mongoose');
const { getPracticeConnection } = require('../../config/practiceDatabase');

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DualityQuestion',
      required: true,
    },
    code: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      enum: ['python', 'c', 'cpp', 'java'],
      default: 'python',
    },
    status: {
      type: String,
      enum: ['accepted', 'wrong_answer', 'runtime_error', 'time_limit_exceeded', 'not_attempted'],
      default: 'not_attempted',
    },
    score: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const quizSubmissionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DualityUser',
      required: true,
    },
    answers: [answerSchema],
    totalScore: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    isComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

quizSubmissionSchema.index({ quiz: 1, student: 1 }, { unique: true });

let QuizSubmission;
const getModel = () => {
  if (!QuizSubmission) {
    const conn = getPracticeConnection();
    QuizSubmission = conn.model('QuizSubmission', quizSubmissionSchema);
  }
  return QuizSubmission;
};

module.exports = getModel;
