var express = require('express');
var router = express.Router();

// movies/search
router.get("/search", async (req, res, next) => {
    try {
        // get the search params
        let { title = "", year = "", page = 1 } = req.query;

        // query the database
        const rows = await req.db
            .from("movies.basics")
            .select(
                "primaryTitle AS title",
                "year",
                "tconst AS imdbID",
                "imdbRating",
                "rottentomatoesRating AS rottenTomatoesRating",
                "metacriticRating",
                "rated AS classification"
            )
            .whereILike('primaryTitle', "%" + title + "%")
            .whereILike('year', "%" + year + "%");

        const resultLength = rows.length;
        const perPage = 100;
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        const slicedRows = rows.slice(startIndex, endIndex);

        const pagination = {
            total: resultLength,
            lastPage: Math.ceil(resultLength / perPage),
            prevPage: parseInt(page) - 1,
            nextPage: parseInt(page) + 1,
            perPage: perPage,
            currentPage: parseInt(page),
            from: startIndex,
            to: Math.min(endIndex, resultLength),
        };

        res.json({
            Error: false,
            Message: "Success",
            data: slicedRows,
            pagination: pagination,
        });
    } catch (error) {
        console.log(err);
        res.status(500).json({ error: true, message: "Error with database" });
    }
});

// movies/data/{imdbID}
router.get("/data/:imdbID", async (req, res, next) => {
    const imdbID = req.params.imdbID;
    let result = {};

    try {
        const movieData = await req.db
            .from("movies.basics")
            .select(
                "primaryTitle AS title",
                "year",
                "runtimeMinutes AS runtime",
                "genres",
                "country",
                "boxoffice",
                "poster",
                "plot"
            )
            .where("tconst", "=", imdbID)
            .first();

        result = movieData;

        const actorData = await req.db
            .from("movies.principals")
            .select("nconst AS id", "category", "name", "characters")
            .where("tconst", "=", imdbID);

        actorData.forEach(element => {
            const temp = element.characters.replace(/[\[\]"]/g, '').split(',');
            element.characters = temp;
        });

        result.principals = actorData;
        res.json({ Error: false, Message: "Success", data: result });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: true, message: "Error with database" });
    }
});

module.exports = router;