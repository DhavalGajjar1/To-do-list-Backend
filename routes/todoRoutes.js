const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');
const { protect } = require('../middleware/authMiddleware');

// Get todos for logged in user
router.get('/', protect, async (req, res) => {
    try {
        const todos = await Todo.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
});

// Create todo
router.post('/', protect, async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    try {
        const newTodo = await Todo.create({
            text,
            user: req.user.id,
        });
        res.status(201).json(newTodo);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create todo' });
    }
});

// Update todo
router.put('/:id', protect, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);

        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        // Make sure user owns the todo
        if (todo.user.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        const updatedTodo = await Todo.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedTodo);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update todo' });
    }
});

// Delete todo
router.delete('/:id', protect, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);

        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        // Make sure user owns the todo
        if (todo.user.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        await todo.deleteOne();
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});

module.exports = router;
