require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 8000;

// Allow all origins for CORS
app.use(cors());

app.use(bodyParser.json());

const uri = process.env.CONNECTION_STRING;

// Function to insert or update code data
async function insertOrUpdateCode(email, name, language, code) {
    const client = new MongoClient(uri);
    await client.connect();
    const dbName = "CodeIT"; // Database name
    const collectionName = "users_codes"; // Collection to store user codes
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    try {
        // Check if the user (email) already exists
        const user = await collection.findOne({ email });

        if (user) {
            // If the user exists, push the new code snippet to the user's codes array
            const updateResult = await collection.updateOne(
                { email }, // Find the user by email
                { 
                    $push: { codes: { name, language, code, date: new Date() } } // Push the new code snippet
                }
            );
            console.log(`${updateResult.modifiedCount} document(s) updated with new code.`);
            return { message: "Code added to existing user." };
        } else {
            // If the user does not exist, create a new user record and insert the code
            const insertResult = await collection.insertOne({
                email,
                codes: [{ name, language, code, date: new Date() }]
            });
            console.log(`${insertResult.insertedCount} new document inserted.`);
            return { message: "New user created and code saved." };
        }
    } catch (err) {
        console.error(`Something went wrong: ${err}`);
        return { error: "Failed to insert or update code." };
    } finally {
        await client.close();
    }
}

// API endpoint to submit code for a user
app.post('/api/submitCode', async (req, res) => {
    const { email, name, language, code } = req.body;

    // Ensure that all fields are provided
    if (!email || !name || !language || !code) {
        return res.status(400).json({ message: "Email, name, language, and code are required." });
    }

    const result = await insertOrUpdateCode(email, name, language, code);
    if (result.error) {
        res.status(500).json({ message: result.error });
    } else {
        res.status(200).json({ message: result.message });
    }
});

// Function to get code names and languages for a user by email
async function getCodeNamesAndLanguages(email) {
    const client = new MongoClient(uri);
    await client.connect();
    const dbName = "CodeIT"; // Database name
    const collectionName = "users_codes"; // Collection to store user codes
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    try {
        // Find the user by email and return the code names and languages
        const user = await collection.findOne({ email }, { projection: { "codes.name": 1, "codes.language": 1 } });

        if (user) {
            const codeDetails = user.codes.map(code => ({
                name: code.name,
                language: code.language
            }));
            return codeDetails;
        } else {
            return { message: "User not found." };
        }
    } catch (err) {
        console.error(`Something went wrong: ${err}`);
        return { error: "Failed to retrieve code names and languages." };
    } finally {
        await client.close();
    }
}

// API endpoint to get code names and languages for a user by email
app.get('/api/getCodeNamesAndLanguages', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    const result = await getCodeNamesAndLanguages(email);
    if (result.error) {
        res.status(500).json({ message: result.error });
    } else {
        res.status(200).json(result);
    }
});

// Function to get the full code of a user by email and name
async function getFullCodeByName(email, name) {
    const client = new MongoClient(uri);
    await client.connect();
    const dbName = "CodeIT"; // Database name
    const collectionName = "users_codes"; // Collection to store user codes
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    try {
        // Find the user by email and retrieve the full code for the specific name
        const user = await collection.findOne(
            { email, "codes.name": name },
            { projection: { "codes.$": 1 } } // Return only the matching code
        );

        if (user) {
            return user.codes[0]; // Return the matching code
        } else {
            return { message: "Code with the given name not found." };
        }
    } catch (err) {
        console.error(`Something went wrong: ${err}`);
        return { error: "Failed to retrieve the full code." };
    } finally {
        await client.close();
    }
}

// API endpoint to get the full code for a specific name and user email
app.get('/api/getFullCode', async (req, res) => {
    const { email, name } = req.query;

    if (!email || !name) {
        return res.status(400).json({ message: "Email and name are required." });
    }

    const result = await getFullCodeByName(email, name);
    if (result.error) {
        res.status(500).json({ message: result.error });
    } else {
        res.status(200).json(result);
    }
});

async function checkDatabaseConnection() {
    const client = new MongoClient(uri);
    try {
        // Attempt to connect to the database
        await client.connect();
        console.log("Successfully connected to the database.");
        return { message: "Database connection successful!" };
    } catch (err) {
        console.error("Database connection failed:", err);
        return { error: "Database connection failed." };
    } finally {
        // Ensure the client is closed after the operation
        await client.close();
    }
}

// API endpoint to check the database connectivity
app.get('/api/checkDatabase', async (req, res) => {
    const result = await checkDatabaseConnection();
    if (result.error) {
        res.status(500).json({ message: result.error });
    } else {
        res.status(200).json({ message: result.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
