const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection setup
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let db;

async function connectDB() {
    try {
        await client.connect();
        await client.db('admin').command({ ping: 1 });
        console.log('✅ MongoDB connected successfully');
        db = client.db('schemesaathi');
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }
}

// API endpoint to fetch welfare schemes (still reading from JSON for now)
app.get('/api/schemes', (req, res) => {
    const filePath = path.join(__dirname, '../data/schemes.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Failed to read schemes data" });
        }
        res.json(JSON.parse(data));
    });
});

app.get('/', (req, res) => {
    res.json({ message: "Welcome to SchemeSaathi API" });
});

// Connect to MongoDB, then start the server
connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });
});