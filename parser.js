const mongoose = require('mongoose');
const request = require('request');

const config = require('./config/dev');

const PARSE_YEARS = 3;
const API_HOST = 'https://api.nasa.gov';
const API_KEY = 'N7LkblDsc5aen05FJqBQ8wU4qSdmsftwJagVK7UD';

mongoose.createConnection(config.db.url, {
    useMongoClient: true,
})
    .then((db) => {
        init(db, createDatesList());
    })
    .catch(error => {
        return console.log(error);
    });

/**
 * Main processing
 * @param db
 * @param datesArray
 */
function init(db, datesArray) {
    let processed = 0,
        added = 0,
        errored = 0,
        totalModels = 0,
        promises = new Set();
    console.log("processing...");
    const NeoModel = require('./src/models/NeoModel')(db);
    datesArray.map(dates => {
        let i = 0;
        // let dates = datesArray[0];
        promises.add(new Promise((resolve, reject) => {
            i++;
            setTimeout(() => {
                let url = `${API_HOST}/neo/rest/v1/feed?start_date=${dates.starDate}&end_date=${dates.endDate}&detailed=false&api_key=${API_KEY}`
                request({
                    uri: url,
                    method: 'GET',
                    json:true
                }, function(error, response, body) {
                    if (error) {
                        console.log(error);
                        console.log(`${dates.starDate} - ${dates.endDate} got error`);
                        errored++;
                        resolve();
                    } else {
                        console.log(`${dates.starDate} - ${dates.endDate} got data`);
                        processed++;
                        let models = responseToModels(body);
                        upsertModels(NeoModel, models)
                            .then(() => {
                                console.log(`${dates.starDate} - ${dates.endDate} data added`);
                                totalModels += models.length;
                                added++;
                                resolve();
                            })
                            .catch(error => {
                                console.dir(error);
                                errored++;
                                resolve();
                            });
                    }
                });
            }, i * 1000)
        }));
    });
    Promise.all(promises)
        .then(() => {
            console.log("Processing done!");
            console.log("Date periods:", datesArray.length);
            console.log("Date period processed:", processed);
            console.log("Date period added:", added);
            console.log("Date period failed:", errored);
            console.log("Models inserted:", totalModels);
            process.exit(1);
        })
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
}

/**
 * Find all documents and update, or insert if not found
 * @param Model
 * @param models
 * @returns {Promise.<*[]>}
 */
function upsertModels(Model, models) {
    let promises = new Set();
    models.map(model => {
        promises.add(new Promise((resolve, reject) => {
            Model.findOneAndUpdate({reference: model.reference, date: model.date}, model, { upsert: true }, function(error, result) {
                if (error) reject(error);
                resolve();
            });
        }));
    });
    return Promise.all(promises);
}

/**
 * Convert API response to models array
 * @param response
 * @returns {Array}
 */
function responseToModels(response) {
    let models = [];
    for (let date in response.near_earth_objects) {
        response.near_earth_objects[date].map(object => {
            models.push({
                date: date,
                reference: object.neo_reference_id,
                name: object.name,
                speed: object.close_approach_data[0].relative_velocity.kilometers_per_hour,
                is_hazardous: object.is_potentially_hazardous_asteroid
            })
        })
    }
    return models;
}

/**
 * Creates an array of dates to parse from the API
 * @returns {Array}
 */
function createDatesList() {
    let result = [];
    let endDate = new Date();
    endDate.setDate(endDate.getDate() + 1);
    for(let i = 0; i < PARSE_YEARS * 52; i++) {
        endDate.setDate(endDate.getDate() - 1);
        let weekGap = getDatesWithWeekGap(endDate)
        result.push(weekGap);
        // Change end day
        endDate = new Date(weekGap.starDate);
    }
    return result;
}

/**
 * Get the 2 dates with a week gap between them
 * @param endDate
 * @returns {{endDate: (Error|String), starDate: (Error|String)}}
 */
function getDatesWithWeekGap(endDate) {
    let starDate = new Date(endDate);
    starDate.setDate(endDate.getDate() - 6);
    return {
        endDate: dateToAPIFormat(endDate),
        starDate: dateToAPIFormat(starDate),
    };
}

/**
 * Converts Date object to yyyy-mm-dd string
 * @param date
 * @returns {Error|String}
 */
function dateToAPIFormat(date) {
    if(typeof date !== 'object') {
        return new Error('Wrong dateToAPIFormat function input. Must be Date object.')
    }
    let dd = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    let mm = date.getMonth() + 1; // January is 0
    mm = mm < 10 ? '0' + mm : mm;
    let yyyy = date.getFullYear();
    return yyyy + '-' + mm + '-' + dd;
}
