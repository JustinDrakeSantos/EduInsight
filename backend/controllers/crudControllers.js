import asyncHandler from '../utils/asyncHandler.js';

export const createCrudControllers = (Model) => ({
  getAll: asyncHandler(async (_req, res) => {
    const items = await Model.find().sort({ createdAt: -1 });
    res.json(items);
  }),

  create: asyncHandler(async (req, res) => {
    const item = await Model.create(req.body);
    res.status(201).json(item);
  }),

  update: asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  }),

  remove: asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Deleted successfully' });
  })
});
