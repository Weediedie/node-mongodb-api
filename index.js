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

const StationSchema = new mongoose.Schema({
  status: { type: String, default: 'inactive' },
  dateTimeModified: { type: Date, default: null },
});

const userSchema = new mongoose.Schema({
  lastname: { type: String, required: true },
  firstname: { type: String, required: true },
  station1: { type: StationSchema, default: {} },
  station2: { type: StationSchema, default: {} },
  station3: { type: StationSchema, default: {} },
  station4: { type: StationSchema, default: {} },
  station5: { type: StationSchema, default: {} },
  station6: { type: StationSchema, default: {} },
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
  const { firstname, lastname, station1, station2, station3, station4, station5, station6 } = req.body;

  if (!firstname || !lastname) {
    return res.status(400).json({ message: 'No user name provided' });
  }

  try {
    // Check if the user already exists
    let userCheck = await User.findOne({ firstname, lastname });

    if (userCheck) {
      return res.status(200).json({ message: 'User already exists', user });
    }

    // Initialize station fields as objects if they are not provided
    user = new User({
      lastname,
      firstname,
      station1:{ status: 'inactive', dateTimeModified: null },
      station2:{ status: 'inactive', dateTimeModified: null },
      station3:{ status: 'inactive', dateTimeModified: null },
      station4:{ status: 'inactive', dateTimeModified: null },
      station5:{ status: 'inactive', dateTimeModified: null },
      station6:{ status: 'inactive', dateTimeModified: null },
    });

    await user.save();
    res.status(200).json({ message: 'User inserted successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error inserting user', error });
  }
});

app.post("/api/updateStationStatus", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { uid, stationNumber, status } = req.body;

    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ message: "Invalid or missing UID." });
    }

    if (stationNumber < 1 || stationNumber > 6) {
      return res.status(400).json({ message: "Invalid station number." });
    }

    const user = await User.findById(uid).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found!" });
    }

    // Check if station field is a string and needs conversion
    const stationField = `station${stationNumber}`;
    if (typeof user[stationField] === 'string') {
      // Convert string to an object with status and dateTimeModified
      user[stationField] = {
        status: user[stationField],
        dateTimeModified: new Date()
      };
    }

    // Update the status and timestamp
    user[stationField].status = status || "Scanned";
    user[stationField].dateTimeModified = new Date();

    // Save the changes
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: `User's station${stationNumber} updated successfully!`,
      data: user,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    return res.status(500).json({
      message: "Error updating station status.",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
