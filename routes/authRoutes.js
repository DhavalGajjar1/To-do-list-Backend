const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'default_secret', {
        expiresIn: '30d',
    });
};

// Register User
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please include all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        email,
        password: hashedPassword,
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            email: user.email,
            role: user.role,
            token: generateToken(user.id),
        });
    } else {
        res.status(400).json({ error: 'Invalid user data' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        if (user.isBlocked) {
            return res.status(403).json({ error: 'User is blocked' });
        }

        res.json({
            _id: user.id,
            email: user.email,
            role: user.role,
            token: generateToken(user.id),
        });
    } else {
        res.status(400).json({ error: 'Invalid credentials' });
    }
});

module.exports = router;
