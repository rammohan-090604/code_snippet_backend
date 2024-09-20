// require('dotenv').config();
// const { MongoClient } = require("mongodb");

// async function run() {
//     const uri = process.env.connnection_string;
//     const client = new MongoClient(uri);
//     await client.connect();
//     const dbName = "MadhuTechSkills";
//     const collectionName = "formData";
//     const database = client.db(dbName);
//     const collection = database.collection(collectionName);

//     try {
//         const insertOneResult = await collection.insertOne(recipes);
//         console.log(`${insertOneResult.insertedCount} documents successfully inserted.\n`);
//     } catch (err) {
//         console.error(`Something went wrong trying to insert the new documents: ${err}\n`);
//     }
//     await client.close();
// }
// run().catch(console.dir);


require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(bodyParser.json());

const uri = process.env.CONNECTION_STRING;

async function run(formData) {
    const client = new MongoClient(uri);
    await client.connect();
    const dbName = "MadhuTechSkills";
    const collectionName = "formData";
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    try {
        const insertOneResult = await collection.insertOne(formData);
        console.log(`${insertOneResult.insertedCount} document successfully inserted.\n`);
        return { message: "Form data successfully inserted." };
    } catch (err) {
        console.error(`Something went wrong trying to insert the document: ${err}\n`);
        return { error: "Failed to insert document." };
    } finally {
        await client.close();
    }
}

// API endpoint for form submission
app.post('/api/submit', async (req, res) => {
    const formData = req.body;
    const result = await run(formData);
    if (result.error) {
        res.status(500).json({ message: "Failed to submit form" });
    } else {
        res.status(200).json({ message: "Form submitted successfully, View More Courses in Courses Section..." });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
