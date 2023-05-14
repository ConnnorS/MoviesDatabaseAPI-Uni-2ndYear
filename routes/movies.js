var express = require('express');
var router = express.Router();

router.get("/search", (req, res, next) => {
    // get the search params
    const { title, year, page } = req.query;
    req.db
        .from("movies.basics")
        .select("primaryTitle", "year", "tconst", "imdbRating", "rottentomatoesRating", "metacriticRating", "rated")
        .whereILike('primaryTitle', "%"+title+"%")
        .whereILike('year', "%"+year+"%")
        .then(rows => {
            res.json({ Error: false, Message: "Success", data: rows });
        })
});

module.exports = router;