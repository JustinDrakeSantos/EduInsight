import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    course: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    durationHours: { type: Number, required: true, min: 0 },
    technique: { type: String, required: true, trim: true },
    studyType: { type: String, enum: ['Solo', 'Group'], default: 'Solo' },
    note: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('StudySession', studySessionSchema);
