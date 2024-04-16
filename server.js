const express = require('express');
const app = express();
const {createTempPath, formatDirent, testFolderNameRegex, testFileNameRegex, isPathExisting} = require("./functions");


const bb = require('express-busboy');
bb.extend(app, {
    upload: true,
    allowedPath: /^\/api\/drive/
});

const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require("node:test");
const port = 3000;

// permet de traiter les CORS (crossing-origin request)
app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});

function start() {
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    })
}

module.exports = start;// nécesaire pour exporter la fonction start

const rootPath = path.join(os.tmpdir(), 'alps_drive');

if (!fs.existsSync(rootPath)) {
    createTempPath(rootPath);
}

app.get('/api/drive', async (req, res) => {
    try {
        const directory = await fs.promises.readdir(rootPath, {withFileTypes: true});
        const dirFormated = formatDirent(directory);
        res.status(200).send(dirFormated);
    } catch (e) {
        console.error('Error retrieving directory contents ', e);
        res.status(500).send('Error while retrieving directory contents');
    }
});

app.get('/*', async (req, res) => {
    const hypoPath = req.params[0];
    const realPath = hypoPath.replace("api/drive/", "");
    try {
        const folderPath = path.join(rootPath, realPath);
        const directory = await fs.promises.readdir(folderPath, {withFileTypes: true});
        const dirFormated = formatDirent(directory);
        res.status(200).send(dirFormated);
    } catch (e) {
        console.error('Error retrieving directory contents ', e);
        res.status(404).send('Error the directory does not exist');
    }

});

app.post('/api/drive', async (req, res) => {
    const {name} = req.query;
    if (testFolderNameRegex(name)) {
        try {
            const folderPath = path.join(rootPath, name);
            await fs.promises.mkdir(folderPath, {recursive: true});
            return res.sendStatus(201);
        } catch (e) {
            return res.status(500).send(`Cannot create the folder: ${e}`);
        }
    } else {
        return res.status(400).send('Wrong folder name!');
    }
});

app.post('/*', async (req, res) => {
    const hypoPath = req.params[0];
    const realPath = hypoPath.replace("api/drive/", "");
    const {name} = req.query;
    const folderPath = path.join(rootPath, realPath, name);
    if (!isPathExisting(folderPath)) {
        res.sendStatus(404);
        return;
    }
    if (testFileNameRegex(name)) {
        try {
            await fs.promises.mkdir(folderPath, {recursive: true});
            return res.sendStatus(201);
        } catch (e) {
            console.log(`Cannot create the folder ${name} : ${e}`)
            return res.sendStatus(500);
        }
    } else {
        console.log(`${name} can't be created : wrong format.`)
        return res.sendStatus(400);
    }
});

app.delete('/*', async (req, res) => {
    const hypoPath = req.params[0];
    const realPath = hypoPath.replace("api/drive/", "");
    if (testFolderNameRegex(realPath)) {
        try {
            const folderPath = path.join(rootPath, realPath);
            console.log('folderPath : ' + folderPath);
            await fs.promises.rm(folderPath, {recursive: true});
            console.log(`${realPath} has been removed.`)
            return res.sendStatus(200);
        } catch (e) {
            console.log(`Cannot remove the folder ${realPath} : ${e}`)
            return res.status(500)
        }
    } else {
        console.log(`${realPath} can't be removed : wrong format.`);
        return res.status(400);
    }
});

app.delete('/*', async (req, res) => {
    const hypoPath = req.params[0];
    const {name} = req.query;
    const realPath = hypoPath.replace("api/drive/", "");
    if (isPathExisting(realPath)) {
        if (testFolderNameRegex(name)) {
            try {
                const targetPath = path.join(rootPath, realPath, name);
                await fs.promises.rm(targetPath, {recursive: true});
                console.log(`${name} has been removed.`)
                res.status(200);
            } catch (e) {
                console.log(`500 : ${name} can't be removed : ${e}`);
                return res.status(500)
            }
        } else {
            console.log(`${driveId} can't be removed : wrong format.`);
            return res.status(400)
        }
    }
});

app.put('/api/drive', async (req, res) => {
    const file = req.files.file;
    if (!file) {
        return res.sendStatus(400)
    }
    try {
        const filePath = path.join(rootPath, file.filename);
        await fs.promises.rename(file.file, filePath)
        return res.sendStatus(201)
    } catch (e) {
        console.log(e)
        return res.sendStatus(500);
    }
});

app.put('/api/drive/:driveId', async (req, res) => {
    const {driveId} = req.params;
    const driveIdPath = path.join(rootPath, driveId)
    const file = req.files.file;

    const isExisting = await isPathExisting(driveIdPath);
    if (!isExisting) {
        return res.sendStatus(404);
    }

    if (!file) {
        return res.sendStatus(400);
    }

    try {
        const filePath = path.join(driveIdPath, file.filename);
        await fs.promises.rename(file.file, filePath);
        return res.sendStatus(201)
    } catch (e) {
        console.log(e)
        return res.sendStatus(500);
    }
});