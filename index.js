const express = require('express');
const mongoose = require('mongoose');
// const bodyParser = require('body-parser');   // will be used if POST, PUT added

const config = require('./config/dev');
const app = express();

// Use native promises as mongoose promise lib is deprecated
mongoose.Promise = global.Promise;

// Open DB connection and start server if OK
mongoose.createConnection(config.db.url, {
    useMongoClient: true,
})
    .then((db) => {
        // Include routes
        require('./src/routes')(app, db);
        // Launch server
        app.listen(config.port, () => {
            console.log('Server is working on localhost:' + config.port);
        });
    })
    .catch(error => {
        return console.log(error);
    });
