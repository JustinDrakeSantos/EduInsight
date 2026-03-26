import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema(
  {
    course: { type: String, required: true, trim: true },
    deckName: { type: String, trim: true, default: 'General' },
    front: { type: String, required: true, trim: true },
    back: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model('Flashcard', flashcardSchema);
