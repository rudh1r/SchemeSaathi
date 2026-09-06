require('dotenv').config();
const { MongoClient } = require('mongodb');
const { ChromaClient } = require('chromadb');

const uri = process.env.MONGODB_URI;
const mongoClient = new MongoClient(uri);
const chroma = new ChromaClient({ path: 'http://localhost:8000' });

async function embedSchemes() {
    try {
        await mongoClient.connect();
        console.log('✅ Connected to MongoDB');

        const db = mongoClient.db('schemesaathi');
        const schemes = await db.collection('schemes').find({}).toArray();
        console.log(`Fetched ${schemes.length} schemes from MongoDB`);

        const collection = await chroma.getOrCreateCollection({ name: 'schemes' });

        const ids = schemes.map(s => s._id.toString());
        const documents = schemes.map(s =>
            `${s.scheme_name}. ${s.description} Eligibility: ${JSON.stringify(s.eligibility)}`
        );
        const metadatas = schemes.map(s => ({ scheme_name: s.scheme_name, mongo_id: s._id.toString() }));

        await collection.add({ ids, documents, metadatas });

        console.log(`✅ Embedded and stored ${ids.length} schemes in Chroma`);
    } catch (err) {
        console.error('❌ Embedding failed:', err.message);
    } finally {
        await mongoClient.close();
    }
}

embedSchemes();