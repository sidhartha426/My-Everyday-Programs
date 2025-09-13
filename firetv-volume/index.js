import express from 'express';
import { spawn, exec } from 'node:child_process'; // Used for executing adb commands
import path from 'node:path';
import { fileURLToPath } from 'url';
import { getLocalIpAddress } from './ip.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const adbPort = 5555;

const getVolumeCommand = ` shell "media volume --stream 3 --get" `;
const volumeUpCommand = ` shell "input keyevent 24 && media volume --stream 3 --get" `;
const volumeDownCommand = ` shell "input keyevent 25 && media volume --stream 3 --get" `;

const connectString = (ip, port=adbPort) => (`adb -s ${ip}:${port} `);
const processVolumeString = (volumeString) => ( volumeString.split('\n')[3].split(' ')[3] );

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
        const myProcess = spawn('bash', []);

        let stdout = '';
        let stderr = '';
        myProcess.stdin.write(command);
        myProcess.stdin.end();

        myProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        myProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        myProcess.on('close', (code) => {

            /*
            console.log('Start From executeCommand');
            console.log(command);
            console.log('stdout:\n',stdout);
            console.error('stderr:\n',stderr);
            console.log('status code:',code);
            console.log('Stop executeCommand');
            */

            if (code !== 0 || stderr !== '') {
                const myError = new Error('Error on executing command');
                myError.context = {stdout, stderr, statusCode:code};
                reject(myError);
            } else {
                resolve(stdout);
            }
        });

        myProcess.on('error', (cmdErr) => {
            const myError = new Error('Unable to execute command');
            myError.context = {stdout, stderr, cmdErr};
            reject(myError);
        });

    });
    return request;
};


const connectDevice = async (ip, port=adbPort) => {
    try {
        const output = await executeCommand(`adb connect ${ip}:${port}`);
        return [ output.includes('connected'), output];
    } 
    catch (err) {
        throw err;
    }
}

const manageVolume = async (command, ip, port=adbPort) => {
    try {
        const commandOutput = await executeCommand(`${connectString(ip, port)} ${command}`);
        const volume = processVolumeString(commandOutput);
        return volume;
    }
    catch (err) {
        throw err;
    }
}

const setVolume = async (volume, ip, port=adbPort) => {
    try {
        const setVolumeCommand = `${connectString(ip, port)} shell "media volume --stream 3 --set ${volume} > /dev/null && media volume --stream 3 --get" `;
        const commandOutput = await executeCommand(setVolumeCommand);
        const resultVolume = processVolumeString(commandOutput);
        return resultVolume;
    }
    catch (err) {
        throw err;
    }  
}

const getVolume = (ip) => manageVolume(getVolumeCommand, ip);
const increaseVolume =  (ip) => manageVolume(volumeUpCommand, ip);
const decreaseVolume =  (ip) => manageVolume(volumeDownCommand, ip);


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


app.post('/connect', async (req, res, next) => {
    const { ip } = req.body;
    try{
        const result = await connectDevice(ip);
        if(!result[0])
            return res.status(500).json({ success:false, error:result[1] });            
        const volume = await getVolume(ip);
        res.json({ success:true, message: 'Connected to Fire TV Stick!', volume });
    }
    catch (err){
        next(err);
    }
});


app.post('/set-volume', async (req, res, next) => {
    const { volume, ip } = req.body;
    try{
        const resultVolume = await setVolume(volume, ip);
        res.json({ success:true, volume:resultVolume });
    }
    catch (err){
        next(err);
    }
});

app.post('/manage-volume', async (req, res, next) => {
    const { cmd, ip } = req.body;
    try{
        const volume = (cmd==='increase') ? await increaseVolume(ip) : await decreaseVolume(ip);
        res.json({ success:true, volume });
    }
    catch (err){
        next(err);
    }   
});

app.use((err, req, res, next) => {
    console.error('Caught error:\n', err);
    console.log('Error Context\n',JSON.stringify(err.context, null, 2));
    res.status(500).json({ success:false, error:err.message });
});

const server = app.listen(port, () => {
  
  const ip = getLocalIpAddress() ? getLocalIpAddress() : 'localhost';
  console.log(`Server running on http://${ip}:${port}`);
  
});

process.on('SIGINT', () => {
    console.log('\nServer shutting down...');
    executeCommand('adb disconnect').then((data)=>{
        console.log(`From adb: ${data}`);
        server.close(() => {
            console.log('Server closed. Goodbye! 👋');
            process.exit(0);
        });
    })
    .catch((err)=>{
        console.error('Caught error:\n', err);
        console.log('Error Context\n',JSON.stringify(err.context, null, 2));
        server.close(() => {
            console.log('Server closed. Goodbye! 👋');
            process.exit(0);
        });
    });
});
