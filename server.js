const express = require('express');
const app = express();
const port = 3000;

function start () {
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    })
}

module.exports = start;

app.get('/', (req, res) => {
    console.log("Got it!");
    res.send('Hello World!');
});

app.use( function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});