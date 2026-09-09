const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const { ChromaClient } = require('chromadb');
const Groq = require('groq-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let db;

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

// ---------- AUTH HELPERS ----------

function generateToken(user) {
    return jwt.sign(
        { userId: user._id, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// Optional auth: attaches req.user if a valid token is present, but doesn't block the request if not
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            // invalid/expired token — just proceed without req.user
        }
    }
    next();
}

// ---------- AUTH ROUTES ----------

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const existing = await db.collection('users').findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = {
            name,
            email: email.toLowerCase(),
            password: passwordHash,
            created_at: new Date(),
        };

        const result = await db.collection('users').insertOne(newUser);
        const user = { _id: result.insertedId, name, email: newUser.email };
        const token = generateToken(user);

        res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        console.error('❌ Register failed:', err.message);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await db.collection('users').findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user);
        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        console.error('❌ Login failed:', err.message);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/me', optionalAuth, (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not logged in' });
    res.json({ user: { id: req.user.userId, name: req.user.name, email: req.user.email } });
});

// ---------- EXISTING ROUTES ----------

app.get('/api/schemes', async (req, res) => {
    try {
        const schemes = await db.collection('schemes').find({}).toArray();
        res.json(schemes);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch schemes data" });
    }
});

app.post('/api/query', optionalAuth, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "Query text is required" });
        }

        const collection = await chroma.getOrCreateCollection({ name: 'schemes' });
        const results = await collection.query({ queryTexts: [query], nResults: 3 });

        const matchedIds = results.metadatas[0].map(m => new ObjectId(m.mongo_id));
        const schemes = await db.collection('schemes').find({ _id: { $in: matchedIds } }).toArray();

        const context = schemes.map((s, i) => `
Scheme ${i + 1}: ${s.scheme_name}
Description: ${s.description}
Benefits: ${s.benefits}
Eligibility: ${JSON.stringify(s.eligibility)}
Application: ${s.application_process}
Source: ${s.source_url}
`).join('\n---\n');

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

        // If logged in, save this query to their history
        if (req.user) {
            await db.collection('user_queries').insertOne({
                user_id: new ObjectId(req.user.userId),
                query_text: query,
                created_at: new Date(),
            });
        }

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