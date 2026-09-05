require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function migrate() {
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db('schemesaathi');
        const collection = db.collection('schemes');

        const filePath = path.join(__dirname, '../data/schemes.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const schemes = JSON.parse(rawData);

        // Clear existing data to avoid duplicates on re-run
        await collection.deleteMany({});
        console.log('🗑️  Cleared existing schemes collection');

        const result = await collection.insertMany(schemes);
        console.log(`✅ Inserted ${result.insertedCount} schemes into MongoDB`);

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await client.close();
        console.log('Connection closed');
    }
}

migrate();