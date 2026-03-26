import mongoose from 'mongoose';

const examScoreSchema = new mongoose.Schema(
  {
    course: { type: String, required: true, trim: true },
    examName: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    score: { type: Number, required: true, min: 0 },
    totalPoints: { type: Number, required: true, min: 1 },
    percentage: { type: Number, min: 0, max: 100 },
    note: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

examScoreSchema.pre('save', function calculatePercentage(next) {
  this.percentage = Number(((this.score / this.totalPoints) * 100).toFixed(1));
  next();
});

export default mongoose.model('ExamScore', examScoreSchema);
