const express = require('express');
const { exec } = require('child_process'); // Used for executing adb commands
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Handle ADB connection
app.post('/connect', (req, res) => {
    const { ip } = req.body;

    exec(`adb connect ${ip}:5555`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ success: false, message: stderr });
        }
        res.json({ success: true, message: 'Connected to Fire TV Stick!' });
    });
});

// Handle volume change
app.post('/set-volume', (req, res) => {
    const { volume } = req.body;

    // Execute ADB command to set the volume
    exec(`adb shell media volume --set ${volume}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ success: false, message: stderr });
        }
        res.json({ success: true, message: `Volume set to ${volume}` });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
