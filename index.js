require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 8000;

// Allow all origins for CORS
app.use(cors()); // This allows all origins

app.use(bodyParser.json());

const uri = process.env.CONNECTION_STRING;

// Function to insert form data into the database
async function insertData(formData) {
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
    const formData = { ...req.body, checked: false }; // Set checked to false by default
    const result = await insertData(formData);
    if (result.error) {
        res.status(500).json({ message: "Failed to submit form" });
    } else {
        res.status(200).json({ message: "Form submitted successfully, View More Courses in Courses Section..." });
    }
});

// Function to retrieve all unchecked data from the database
async function getData() {
    const client = new MongoClient(uri);
    await client.connect();
    const dbName = "MadhuTechSkills";
    const collectionName = "formData";
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    try {
        const data = await collection.find({ checked: false }).toArray(); 
        console.log(`${data.length} documents found.\n`);
        return data;
    } catch (err) {
        console.error(`Something went wrong trying to retrieve the documents: ${err}\n`);
        return { error: "Failed to retrieve documents." };
    } finally {
        await client.close();
    }
}

// API endpoint to fetch all data
app.get('/api/data', async (req, res) => {
    const result = await getData();
    if (result.error) {
        res.status(500).json({ message: "Failed to retrieve data" });
    } else {
        res.status(200).json(result); // Send the retrieved data to the client
    }
});

// Function to update the checked status
async function updateCheckedStatus(id) {
    const client = new MongoClient(uri);
    await client.connect();
    const dbName = "MadhuTechSkills";
    const collectionName = "formData";
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    try {
        const updateResult = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { checked: true } }
        );
        console.log(`${updateResult.modifiedCount} document(s) updated.`);
        return { message: "Checked status updated successfully." };
    } catch (err) {
        console.error(`Something went wrong trying to update the document: ${err}\n`);
        return { error: "Failed to update checked status." };
    } finally {
        await client.close();
    }
}

// API endpoint to update the checked status
app.put('/api/updateChecked', async (req, res) => {
    const { id } = req.body; // Expecting the id to be passed in the body
    const result = await updateCheckedStatus(id);
    if (result.error) {
        res.status(500).json({ message: "Failed to update checked status" });
    } else {
        res.status(200).json(result);
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
