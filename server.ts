const express = require('express');
import type {NextFunction, Request, Response} from "express";
import {MIMEType} from "util";

const app = express();
const {createTempPath, formatDirent, testFolderNameRegex, testFileNameRegex, isPathExisting} = require("./functions");

type File = {
    file: {
        uuid: string;
        field: string;
        file: string;
        filename: string;
        encoding: string;
        mimetype: MIMEType;
        truncated: boolean;
        done: boolean;
    }
}

interface RequestBB extends Request {
    files: File;
}

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

// CORS (crossing-origin request)
app.use(function (req: Request, res: Response, next: NextFunction) {
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

module.exports = start;

const rootPath = path.join(os.tmpdir(), 'alps_drive');

if (!fs.existsSync(rootPath)) {
    createTempPath(rootPath);
}

app.get('/api/drive/*', async (req: Request, res: Response) => {
    const realPath = req.params[0];
    try {
        const folderPath = path.join(rootPath, realPath);
        const directory = await fs.promises.readdir(folderPath, {withFileTypes: true});
        const dirFormated = formatDirent(directory);
        return res.status(200).send(dirFormated);
    } catch (e) {
        console.error('Error retrieving directory contents ', e);
        return res.status(404).send('Error the directory does not exist');
    }
});

app.post('/api/drive/*', async (req: Request, res: Response) => {
    const realPath = req.params[0];
    const {name} = req.query;
    const targetPath = path.join(rootPath, realPath);
    const isExisting = await isPathExisting(targetPath);
    if (!isExisting) {
        res.sendStatus(404);
        return;
    }
    if (testFileNameRegex(name)) {
        try {
            const folderPath = path.join(targetPath, name);
            await fs.promises.mkdir(folderPath, {recursive: true});
            console.log(`${folderPath} created`);
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

app.delete('/api/drive/*', async (req: Request, res: Response) => {
    const folderPath = path.join(rootPath, req.params[0]);
    const {name} = req.query;
    const isExisting = await isPathExisting(folderPath);
    if (!isExisting) {
        console.log(`${folderPath} not found`);
        return res.sendStatus(404);
    }
    if (!testFolderNameRegex(name)) {
        console.log(`${folderPath} can't be removed : wrong format.`);
        return res.status(400);
    }
    try {
        let targetPath: string = "";
        if (name) {
            targetPath = path.join(rootPath, folderPath, name);
        } else {
            //@ts-ignore
            targetPath = path.join((rootPath, folderPath))
        }
        await fs.promises.rm(targetPath, {recursive: true});
        console.log(`${targetPath} has been removed.`)
        return res.sendStatus(200);
    } catch (e) {
        console.log(`500 : ${name} can't be removed : ${e}`);
        return res.status(500)
    }
});

app.put('/api/drive/*', async (req: RequestBB, res: Response) => {
    let clientPath = req.url;
    clientPath = clientPath.replace("api/drive/", '');
    const realPath = path.join(rootPath, clientPath);
    console.log(realPath);
    const file = req.files.file;
    console.log("FILE: ", file);
    const isExisting = await isPathExisting(realPath);
    if (!isExisting) {
        return res.sendStatus(404);
    }
    if (!file) {
        return res.sendStatus(400);
    }
    try {
        const filePath = path.join(realPath, file.filename);
        await fs.promises.rename(file.file, filePath);
        console.log(`${filePath} created`);
        return res.sendStatus(201)
    } catch (e) {
        console.log(e)
        return res.sendStatus(500);
    }
});