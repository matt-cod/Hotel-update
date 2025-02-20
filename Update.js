// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

// Initialize Express app
const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Define MongoDB collections for room types and rooms respectively
let roomTypesCollection = [];
let roomsCollection = [];
let usersCollection = [];

// Define roles
const ROLES = {
    GUEST: 'guest',
    ADMIN: 'admin'
};

// Define schema for user validation
const userSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid(...Object.values(ROLES)).required()
});

// POST endpoint/API for user registration
app.post('/api/v1/users/register', validateRequest(userSchema), async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = { username, password: hashedPassword, role };
        usersCollection.push(user);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST endpoint/API for user login
app.post('/api/v1/users/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = usersCollection.find(user => user.username === username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ username: user.username, role: user.role }, 'secretkey');
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Middleware for authentication
function authenticateToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    jwt.verify(token, 'secretkey', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        req.user = user;
        next();
    });
}

// Middleware for authorization
function authorize(role) {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            next();
        } else {
            res.status(403).json({ error: 'Forbidden' });
        }
    };
}

// Validation middleware
function validateRequest(schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
}

// POST endpoint/API for storing room types
app.post('/api/v1/rooms-types', authenticateToken, authorize(ROLES.ADMIN), (req, res) => {
    // Implementation remains the same
});

// PATCH endpoint for editing a room by its id
app.patch('/api/v1/rooms/:roomId', authenticateToken, authorize(ROLES.ADMIN), (req, res) => {
    // Implementation remains the same
});

// DELETE endpoint for deleting a room by its id
app.delete('/api/v1/rooms/:roomId', authenticateToken, authorize(ROLES.ADMIN), (req, res) => {
    // Implementation remains the same
});

// Start server on port 3000
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});