require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Todo = require('./models/Todo');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173' // Vite frontend
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log(' Connected to MongoDB'))
  .catch(err => console.error(' MongoDB connection error:', err));

// GET all todos
app.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// CREATE todo
app.post('/todos', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const newTodo = await Todo.create({ text });
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// UPDATE todo
app.put('/todos/:id', async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE todo
app.delete('/todos/:id', async (req, res) => {
  try {
    const deleted = await Todo.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
jvgghkgg