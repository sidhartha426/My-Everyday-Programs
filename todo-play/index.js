import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { getLocalIpAddress } from './ip.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 4000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const dataFilePath = path.join(__dirname, 'data.json');

const readData = () => {
  const rawData = fs.readFileSync(dataFilePath);
  return JSON.parse(rawData);
};

app.get('/api/data', (req, res) => {
  const data = readData();
  res.json(data);
});

app.post('/api/update', (req, res) => {
  const updatedData = req.body;
  const data = readData();
  updatedData.clear = updatedData.clear.concat(data.clear);
  fs.writeFileSync(dataFilePath, JSON.stringify(updatedData, null, 2));
  res.status(200).send('Data updated successfully');
});

app.listen(port, () => {
  
  const ip = getLocalIpAddress() ? getLocalIpAddress() : 'localhost';
  console.log(`Server running on http://${ip}:${port}`);
  
});

