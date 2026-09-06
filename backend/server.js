const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const { ChromaClient } = require('chromadb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB setup
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let db;

// Chroma setup
const chroma = new ChromaClient({ host: 'localhost', port: 8000, ssl: false });

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

// GET all schemes (from MongoDB)
app.get('/api/schemes', async (req, res) => {
    try {
        const schemes = await db.collection('schemes').find({}).toArray();
        res.json(schemes);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch schemes data" });
    }
});

// POST semantic query (Chroma search + MongoDB lookup)
app.post('/api/query', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "Query text is required" });
        }

        const collection = await chroma.getOrCreateCollection({ name: 'schemes' });
        const results = await collection.query({ queryTexts: [query], nResults: 3 });

        const matchedIds = results.metadatas[0].map(m => new ObjectId(m.mongo_id));
        const schemes = await db.collection('schemes').find({ _id: { $in: matchedIds } }).toArray();

        res.json({ query, results: schemes });
    } catch (err) {
        console.error('❌ Query failed:', err.message);
        res.status(500).json({ error: "Query failed", details: err.message });
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