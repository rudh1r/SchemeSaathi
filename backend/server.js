const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API endpoint to fetch welfare schemes
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});