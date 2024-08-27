const express = require("express");
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
require("dotenv").config();
const mongoose = require('mongoose')
app.use(express.json());

const connectDB = require("./connectMongo");

connectDB();



// Middleware
app.use(cors());
app.use(bodyParser.json());

// Define a schema for the barcode data
const barcodeSchema = new mongoose.Schema({
  barcodeData: String
});

const userSchema = new mongoose.Schema({
  name: String,
  station1: String,  // Set default to null if not provided
  station2: String,
  station3: String,
  station4: String,
  station5: String,
  station6: String,
});

// Create models for the schemas
const Barcode = mongoose.model('Barcode', barcodeSchema);
const User = mongoose.model('User', userSchema);

// Route to handle POST request for barcode data
app.post('/api/insert', async (req, res) => {
  const { barcodeData } = req.body;

  if (!barcodeData) {
    return res.status(400).json({ message: 'No barcode data provided' });
  }

  try {
    const newBarcode = new Barcode({ barcodeData });
    await newBarcode.save();
    res.status(200).json({ message: 'Data inserted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error inserting data', error });
  }
});

// Route to fetch all barcode data
app.get('/api/fetch', async (req, res) => {
  try {
    const barcodeData = await Barcode.find(); // No filter means it retrieves all documents
    res.status(200).json({ data: barcodeData });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving data', error });
  }
});

// Route to fetch user data by name
app.get('/api/fetch/user/:name', async (req, res) => {
  try {
    const userName = req.params.name; // Access the 'name' parameter from the URL
    const user = await User.find({ name: userName }); // Find user by name
    res.status(200).json({ data: user });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving data', error });
  }
});
app.get('/api/fetch/user', async (req, res) => {
  try {
    const userId = req.query.id; // Access 'id' from query parameters
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const user = await User.findById(userId); // Find user by ID

    if (user) {
      res.status(200).json({ data: user });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving data', error });
  }
});

// Route to handle POST request for user data
app.post('/api/insert/user', async (req, res) => {
  const { name, station1, station2, station3, station4, station5, station6 } = req.body; // Expecting `name` and station fields

  if (!name) {
    return res.status(400).json({ message: 'No user name provided' });
  }

  try {
    // Check if the user already exists
    let user = await User.findOne({ name });

    if (user) {
      // If the user exists, return the user data
      return res.status(200).json({ message: 'User already exists', user });
    }

    // If the user doesn't exist, create a new user
    user = new User({
      name,
      station1: station1 || null,  // Set default to null if not provided
      station2: station2 || null,
      station3: station3 || null,
      station4: station4 || null,
      station5: station5 || null,
      station6: station6 || null,
    });
    await user.save();
    res.status(200).json({ message: 'User inserted successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error inserting user', error });
  }
});

app.post("/api/updateStationStatus", async (req, res) => {
  const { uid, stationNumber } = req.body;

  // Input validation
  
  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing UID.",
    });
  }

  if (stationNumber < 1 || stationNumber > 6) {
    return res.status(400).json({
      success: false,
      message: "Invalid station number.",
    });
  }

  const updateField = {};
  updateField[`station${stationNumber}`] = "Updated"; // Or set to a different value as needed

  try {

   
        // Assume NewsArticle is your Mongoose model for content
        let user = await User.findByIdAndUpdate(
          uid,
          updateField, // Update the title field
        );
    
    
        if (user) {
      res.status(200).json({
        success: true,
        message: `User's station${stationNumber} updated successfully!`,
        data: user,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating station status.",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
