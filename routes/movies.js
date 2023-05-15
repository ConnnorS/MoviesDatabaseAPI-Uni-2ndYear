var express = require('express');
var router = express.Router();

router.get("/search", (req, res, next) => {
    // get the search params
    let { title, year, page } = req.query;
    title == undefined ? title = "" : null;
    year == undefined ? year = "": null;

    console.log(`Searching for ${title} in year ${year}`);
    req.db
        .from("movies.basics")
        .select("primaryTitle", "year", "tconst", "imdbRating", "rottentomatoesRating", "metacriticRating", "rated")
        .whereILike('primaryTitle', "%"+title+"%")
        .whereILike('year', "%"+year+"%")
        .then(rows => {
            res.json({ Error: false, Message: "Success", data: rows });
        })
});

router.get("/data/:imdbID", (req, res, next) => {
    
});

module.exports = router;