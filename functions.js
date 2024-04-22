const fs = require('fs');

function createTempPath(path) {// crée le fichier temporaire racine
    try {
        fs.mkdir(path, err => {
            if (err) throw err;
        });
        console.log(`Creation of Rootpath : ${path}`);
        return true;
    } catch (e) {
        console.error('Error while creating the folder rootpath in temp directory : ', e);
        return false;
    }
}

function formatDirent(dirents) {
    const formated = dirents.map(item => ({
        name: item.name,
        isFolder: item.isDirectory(),
    }))
    return formated;
}

function testFolderNameRegex(name) {
    const regex = /[^a-zA-Z0-9]/
    if (regex.test(name)) {
        return false;
    } else {
        return true;
    }
}

function testFileNameRegex(name) {
    const regex = /^[^\\/:\*\?"<>\|]+$/;
    if (regex.test(name)) {
        return true;
    } else {
        return false;
    }
}

async function isPathExisting(path) {
    try {
        await fs.promises.access(path, fs.constants.R_OK & fs.constants.W_OK);
        console.log(`Directory ${path} exists`);
        return true;
    } catch (e) {
        console.log(`Directory ${path} does not exist`);
        return false;
    }
}

module.exports = {
    createTempPath,
    formatDirent,
    testFolderNameRegex,
    testFileNameRegex,
    isPathExisting,
};