/**
 * Routes for all common routes like index, /about, /readme
 */
module.exports = function(app, db) {
    // Index
    app.get('/', (req, res) => {
        // Just say "hello"
        res.send({ hello: "world!" });
    });
};
