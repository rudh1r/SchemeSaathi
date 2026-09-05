const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

// API endpoint to fetch welfare schemes — now reading from MongoDB
app.get('/api/schemes', async (req, res) => {
    try {
        const schemes = await db.collection('schemes').find({}).toArray();
        res.json(schemes);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch schemes data" });
    }
});

app.get('/', (req, res) => {
    res.json({ message: "Welcome to SchemeSaathi API" });
});

connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });
});