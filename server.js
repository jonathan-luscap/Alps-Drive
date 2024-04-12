const express = require('express');
const app = express();

const fs = require('fs');
const os = require('os');
const path = require('path');
const port = 3000;

app.use( function (req, res, next) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});

function start () {
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    })
}

module.exports = start;

let pathAlreadyExists = false;

const rootPath = path.join(os.tmpdir(), 'alps_drive');

if (!fs.existsSync(rootPath)) {
    try{
        fs.mkdirSync(rootPath);
        console.log(`Directory ${rootPath} exists`);
        pathAlreadyExists = true;
    } catch(e){
        console.error('Error while creating the folder rootpath in temp directory : ', e);
    }
} else {
    if(!pathAlreadyExists){
        console.log('Rootpath already exists');
        pathAlreadyExists = true;
    }
}

app.get('/', (req, res) => {
    console.log("Got it!");
    res.send('Hello World!');
});

app.get('/api/drive', async (req, res) => {
    try {
        const directory = await fs.promises.readdir(rootPath, {withFileTypes:true});
        const dirFormated = directory.map(item => ({
            name: item.name,
            isFolder: item.isDirectory(),
        }))
        res.status(200).send(dirFormated);
    } catch (e) {
        console.error('Error retrieving directory contents ', e);
        res.status(500).send('Error while retrieving directory contents');
    }
});


app.get('/api/drive/:driveId', async (req, res) => {
    console.log(req.params);
    const targetName = req.params.driveId;
    const regex = /[a-zA-Z0-9]/;
    if (regex.test(targetName)) {
        const relativePath = path.join(rootPath, targetName);
        try {
            const directory = await fs.promises.readdir(relativePath, {withFileTypes:true});
            const dirFormated = directory.map(item => ({
                name: item.name,
                isFolder: item.isDirectory(),
            }))
            res.status(200).send(dirFormated);
            console.log(dirFormated);
        } catch (e) {
            console.error('Error retrieving directory contents ', e);
            res.status(404).send('Error the directory does not exist');
        }
    }

});





app.post('/api/drive', async (req, res) => {
    const { name } = req.query;
    const regex = /[a-zA-Z0-9]/;
    if (regex.test(name)) {
        try{
            const folderPath = path.join(rootPath, name);
            await fs.promises.mkdir(folderPath, { recursive: true });
            return res.sendStatus(201);
        } catch (e) {
            return res.status(500).send(`Cannot create the folder: ${e}`);
        }
    } else {
        return res.status(400).send('Not found');
    }
});

app.post('/api/drive/:driveId', async (req, res) => {
    const { driveId } = req.params;
    const relativePath = path.join(rootPath, driveId);
    console.log(relativePath)
    const { name } = req.query;
    console.log(name);
    const regex = /[a-zA-Z0-9]/;
    fs.stat(relativePath, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.log(`Directory ${driveId} does not exist`);
                res.status(404).send();
            } else {
                console.log(`Error accessing directory ${driveId}.`);
                res.status(500).send();
            }
        }
    });
    if (regex.test(name)) {
        try {
            const folderPath = path.join(relativePath, name);
            await fs.promises.mkdir(folderPath, { recursive: true });
            return res.sendStatus(201);
        } catch (e) {
            return res.status(500).send(`Cannot create the folder ${name} : ${e}`);
        }
    } else {
        return res.status(400).send(`${name} can't be created : wrong format.`);
    }
});
