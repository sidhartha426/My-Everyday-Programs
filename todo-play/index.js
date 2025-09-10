const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 4000;

// Middleware to serve static files (CSS, JS, HTML)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Path to the JSON file
const dataFilePath = path.join(__dirname, 'data.json');

// Helper function to read JSON data
const readData = () => {
  const rawData = fs.readFileSync(dataFilePath);
  return JSON.parse(rawData);
};

// Route to serve the data from JSON file
app.get('/api/data', (req, res) => {
  const data = readData();
  res.json(data);
});

// Route to update the JSON file
app.post('/api/update', (req, res) => {
  const updatedData = req.body;
  
  fs.writeFileSync(dataFilePath, JSON.stringify(updatedData, null, 2));
  res.status(200).send('Data updated successfully');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

