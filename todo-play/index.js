import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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
  const data = readData();
  updatedData.clear = updatedData.clear.concat(data.clear);
  fs.writeFileSync(dataFilePath, JSON.stringify(updatedData, null, 2));
  res.status(200).send('Data updated successfully');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

