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
            isDirectory: item.isDirectory(),
        }))
        res.send(dirFormated);
    } catch (e) {
        console.error('Error retrieving directory contents ', e);
        res.status(500).send('Error while retrieving directory contents');
    }
});

app.post('/api/drive', async (req, res) => {
    const { name } = req.query;
    try{
        const folderPath = path.join(rootPath, name);
        await fs.promises.mkdir(folderPath, { recursive: true });
        return res.sendStatus(201);
    } catch (e) {
        return res.status(500).send(`Cannot create the folder: ${e}`);
    }
});