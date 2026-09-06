require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const { ChromaClient } = require('chromadb');

const uri = process.env.MONGODB_URI;
const mongoClient = new MongoClient(uri);
const chroma = new ChromaClient({ host: 'localhost', port: 8000, ssl: false });

async function queryScheme(userQuery) {
    try {
        await mongoClient.connect();
        const db = mongoClient.db('schemesaathi');

        const collection = await chroma.getOrCreateCollection({ name: 'schemes' });

        // Semantic search in Chroma
        const results = await collection.query({
            queryTexts: [userQuery],
            nResults: 3, // top 3 matches
        });

        const matchedIds = results.metadatas[0].map(m => m.mongo_id);
        console.log('Matched scheme IDs:', matchedIds);

        // Fetch full scheme details from MongoDB
        const objectIds = matchedIds.map(id => new ObjectId(id));
        const schemes = await db.collection('schemes').find({ _id: { $in: objectIds } }).toArray();

        console.log(`\n✅ Top ${schemes.length} matching schemes for: "${userQuery}"\n`);
        schemes.forEach((s, i) => {
            console.log(`${i + 1}. ${s.scheme_name}`);
            console.log(`   ${s.description}\n`);
        });

    } catch (err) {
        console.error('❌ Query failed:', err.message);
    } finally {
        await mongoClient.close();
    }
}

// Test query — change this to try different questions
queryScheme("I am a farmer with small land, what schemes can help me?");