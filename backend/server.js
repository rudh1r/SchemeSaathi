const Groq = require('groq-sdk');
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
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
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

        // Step 1: Semantic search in Chroma
        const collection = await chroma.getOrCreateCollection({ name: 'schemes' });
        const results = await collection.query({ queryTexts: [query], nResults: 3 });

        const matchedIds = results.metadatas[0].map(m => new ObjectId(m.mongo_id));
        const schemes = await db.collection('schemes').find({ _id: { $in: matchedIds } }).toArray();

        // Step 2: Build context from retrieved schemes
        const context = schemes.map((s, i) => `
Scheme ${i + 1}: ${s.scheme_name}
Description: ${s.description}
Benefits: ${s.benefits}
Eligibility: ${JSON.stringify(s.eligibility)}
Application: ${s.application_process}
Source: ${s.source_url}
`).join('\n---\n');

        // Step 3: Send to Groq for grounded response generation
        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [
                {
                    role: "system",
                    content: "You are SchemeSaathi, a helpful assistant that explains Indian government welfare schemes to citizens in simple language. Only use the scheme information provided in the context below. Do not invent schemes or details not present in the context. If none of the schemes fit the user's situation well, say so honestly."
                },
                {
                    role: "user",
                    content: `User's question: "${query}"\n\nRetrieved scheme information:\n${context}\n\nBased only on the above, provide a clear, friendly answer explaining which scheme(s) suit the user and why.`
                }
            ],
        });

        const answer = completion.choices[0].message.content;

        res.json({ query, answer, sources: schemes });

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