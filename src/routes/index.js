const common = require('./common');
const neo = require('./neo');

module.exports = function(app, db) {
    // Common routes like index, about
    common(app, db);
    // Nearest Earth Objects routes
    neo(app, db);
};
