const URL_PREFIX = '/neo';

module.exports = function(app, db) {
    const NeoModel = require('./../models/NeoModel')(db);
    // Index
    app.get(URL_PREFIX, (req, res) => {
        NeoModel.find()
            .then(results => {
                return res.send(results);
            })
            .catch(error => {
                return res.send(error);
            })
    });
};
