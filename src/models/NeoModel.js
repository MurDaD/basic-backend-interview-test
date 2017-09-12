const mongoose = require('mongoose');

module.exports = function(db) {
    let neoSchema = mongoose.Schema({
        date: String,
        reference: String,
        name: String,
        speed: Number,
        is_hazardous: Boolean
    });
    return db.model('NeoObjects', neoSchema);
};
