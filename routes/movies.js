var express = require('express');
var router = express.Router();

router.get("/search", (req, res, next) => {
    // get the search params
    let { title, year, page } = req.query;
    title == undefined ? title = "" : null;
    year == undefined ? year = "" : null;

    console.log(`Searching for ${title} in year ${year}`);
    req.db
        .from("movies.basics")
        .select("primaryTitle", "year", "tconst", "imdbRating", "rottentomatoesRating", "metacriticRating", "rated")
        .whereILike('primaryTitle', "%" + title + "%")
        .whereILike('year', "%" + year + "%")
        .then(rows => {
            res.json({ Error: false, Message: "Success", data: rows });
        })
});

router.get("/data/:imdbID", (req, res, next) => {
    // set up our response objects
    let response = { title: "", year: 0, runtime: 0, genres: [], country: "", boxoffice: 0, poster: "", plot: "", principals: [], ratings: [] };
    let principals = [];

    // get the movies.basics info
    req.db
        // query the db
        .from("movies.basics")
        .select("*")
        .where("tconst", "=", req.params.imdbID)
        .then(rows => {
            // assign each object a value
            rows = rows[0];
            response.title = rows.primaryTitle;
            response.year = rows.year;
            response.runtime = rows.runtimeMinutes;
            response.genres = rows.genres.split(',');
            response.country = rows.country;
            response.boxoffice = rows.boxoffice;
            response.poster = rows.poster;
            response.plot = rows.plot;
            response.ratings = [
                { source: "IMDB", value: rows.imdbRating },
                { source: "Rotten Tomatoes", value: rows.rottentomatoesRating },
                { source: "MetaCritic", value: rows.metacriticRating }
            ]
        });
    // get the movies.principals info
    req.db
        // query the db
        .from("movies.principals")
        .select("nconst", "category", "name", "characters")
        .where("tconst", "=", req.params.imdbID)
        .then(rows => {
            // assign all the actor info
            rows.forEach(element => {
                principals.push({
                    id: element.nconst,
                    category: element.category,
                    name: element.name,
                    characters: element.characters.replace(/[\[\]"]/g, '').split(',')
                });
            });
            response.principals = principals;
            // finally, return the response
            res.json({ Error: false, Message: "Success", data: response });
        });
});

module.exports = router;