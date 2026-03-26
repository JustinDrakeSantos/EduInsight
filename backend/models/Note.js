import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    course: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model('Note', noteSchema);
