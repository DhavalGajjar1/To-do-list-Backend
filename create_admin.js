require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdmin = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing in .env');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@example.com';
        const password = 'admin123';

        // Check if admin exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            userExists.role = 'admin';
            await userExists.save();
            console.log('Existing user updated to admin role.');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await User.create({
                email,
                password: hashedPassword,
                role: 'admin',
            });
            console.log('Admin user created successfully.');
        }

        console.log('-----------------------------------');
        console.log('Admin Credentials:');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('-----------------------------------');

    } catch (error) {
        console.error('Error creating admin:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

createAdmin();
