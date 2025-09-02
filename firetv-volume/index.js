const express = require('express');
const { exec, spawn } = require('child_process'); // Used for executing adb commands
const path = require('path');

const app = express();
const port = 3000;

//My constants

const getVolumeCommand = ` adb shell "media volume --stream 3 --get" `;
const volumeUpCommand = ` adb shell "input keyevent 24 && media volume --stream 3 --get" `;
const volumeDownCommand = ` adb shell "input keyevent 25 && media volume --stream 3 --get" `;

//My functions

const processVolumeString = (volumeString) => ( volumeString.split("\n")[3].split(" ")[3] );

/*
const executeCommand = ( command ) => {
    const request = new Promise((resolve,reject)=>{
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            }
            resolve(stdout);
        });
    });
    
    return request;
}
*/

const executeCommand = (command) => {
    const request = new Promise((resolve, reject) => {
        const process = spawn('bash', ['-c', command]);

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        process.on('close', (code) => {
            if (code !== 0) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
    return request;
};


const connectDevice = async (ip) => {
    try {
        const output = await executeCommand(`adb connect ${ip}:5555`);
        return !output.includes("fail");
    } 
    catch (err) {
        return err;
    }
}

const manageVolume = async (command) => {
    const commandOutput = await executeCommand(command);
    const volume = processVolumeString(commandOutput);
    return volume;   
}

const setVolume = async (volume) => {
    const setVolumeCommand = `adb shell "media volume --stream 3 --set ${volume} > /dev/null && media volume --stream 3 --get" `;
    const commandOutput = await executeCommand(setVolumeCommand);
    const resultVolume = processVolumeString(commandOutput);
    return resultVolume; 
}

const getVolume = () => manageVolume(getVolumeCommand);
const increaseVolume =  () => manageVolume(volumeUpCommand);
const decreaseVolume =  () => manageVolume(volumeDownCommand);

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Handle ADB connection
app.post('/connect', async (req, res) => {
    const { ip } = req.body;
    const result = await connectDevice(ip);
    if(!result)
        return res.status(500).json({ success: false, message: 'Unable to connect to Fire TV Stick!' });
    const volume = await getVolume();
    res.json({ success: true, message: 'Connected to Fire TV Stick!', volume });
});

// Handle volume change
app.post('/set-volume', async (req, res) => {
    const { volume } = req.body;
    const resultVolume = await setVolume(volume);
    res.json({ success: true, volume:resultVolume });
});

app.post('/manage-volume', async (req, res) => {
    const { cmd } = req.body;
    const volume = (cmd==="increase") ? await increaseVolume() : await decreaseVolume();
    res.json({ success: true, volume });
});

const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

process.on('SIGINT', () => {
    console.log('\nServer shutting down...');
    executeCommand("adb disconnect").then((data)=>{
        console.log(`From adb: ${data}`);
        server.close(() => {
            console.log('Server closed. Goodbye! 👋');
            process.exit(0);
        });
    });
});
