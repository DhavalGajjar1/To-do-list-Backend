import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const API_URL = 'http://localhost:3000/api';

async function verify() {
    console.log('Starting verification...');

    // Connect to MongoDB to manipulate data directly if needed
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI not found');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for verification setup');

    // Define User schema for direct manipulation
    const userSchema = new mongoose.Schema({
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        isBlocked: { type: Boolean, default: false }
    }, { timestamps: true });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Clean up test users
    await User.deleteOne({ email: 'testuser@example.com' });
    await User.deleteOne({ email: 'testadmin@example.com' });

    // 1. Register User
    console.log('\n--- 1. Register User ---');
    const userRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'testuser@example.com', password: 'password123' })
    });
    const userData = await userRes.json();
    if (userRes.ok && userData.token) {
        console.log('✅ User registered successfully');
    } else {
        console.error('❌ User registration failed', userData);
        process.exit(1);
    }

    const userToken = userData.token;

    // 2. Create Todo
    console.log('\n--- 2. Create Todo ---');
    const todoRes = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ text: 'Verify Backend' })
    });
    const todoData = await todoRes.json();
    if (todoRes.ok && todoData.text === 'Verify Backend') {
        console.log('✅ Todo created successfully');
    } else {
        console.error('❌ Todo creation failed', todoData);
        process.exit(1);
    }

    // 3. Get Todos
    console.log('\n--- 3. Get Todos ---');
    const getTodosRes = await fetch(`${API_URL}/todos`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const todos = await getTodosRes.json();
    if (getTodosRes.ok && todos.length > 0) {
        console.log('✅ Fetched todos successfully');
    } else {
        console.error('❌ Fetch todos failed', todos);
        process.exit(1);
    }

    // 4. Admin Test - Register Admin User (Initial register as normal user)
    console.log('\n--- 4. Register Admin Candidate ---');
    const adminRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'testadmin@example.com', password: 'password123' })
    });
    const adminData = await adminRes.json();

    if (adminRes.ok) {
        console.log('✅ Admin candidate registered');
    } else {
        console.error('❌ Admin candidate registration failed', adminData);
        process.exit(1);
    }

    // Manually promote to admin
    await User.updateOne({ email: 'testadmin@example.com' }, { role: 'admin' });
    console.log('✅ Promoted user to admin via MongoDB');

    const adminToken = adminData.token;

    // 5. Admin Action - Get Users
    console.log('\n--- 5. Admin: Get Users ---');
    const getUsersRes = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const users = await getUsersRes.json();
    if (getUsersRes.ok && Array.isArray(users)) {
        console.log(`✅ Admin fetched ${users.length} users`);
    } else {
        console.error('❌ Admin fetch users failed', users);
        process.exit(1);
    }

    // 6. Block User
    console.log('\n--- 6. Admin: Block User ---');
    const userToBlock = users.find(u => u.email === 'testuser@example.com');
    const blockRes = await fetch(`${API_URL}/admin/users/${userToBlock._id}/block`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ isBlocked: true })
    });
    const blockData = await blockRes.json();
    if (blockRes.ok && blockData.isBlocked) {
        console.log('✅ User blocked successfully');
    } else {
        console.error('❌ Block user failed', blockData);
        process.exit(1);
    }

    // 7. Test Blocked Login
    console.log('\n--- 7. Test Blocked User Login ---');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'testuser@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (loginRes.status === 403) {
        console.log('✅ Blocked user cannot login (403 Forbidden)');
    } else {
        console.error(`❌ Blocked user login should fail with 403, got ${loginRes.status}`, loginData);
        process.exit(1);
    }

    console.log('\n🎉 ALL VERIFICATION STEPS PASSED!');
    mongoose.connection.close();
}

verify().catch(console.error);
