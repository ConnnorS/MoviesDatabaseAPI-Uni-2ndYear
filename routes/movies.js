var express = require('express');
var router = express.Router();

// movies/search
router.get("/search", async (req, res, next) => {
    // get the search params
    let { title = "", year = "", page = "1" } = req.query;
    console.log(page);
    console.log(typeof page);

    try {
        // validate search params
        // year
        if (year && !/^\d+$/.test(year)) {
            res.status(400).json({ error: true, message: "Invalid year format. Format must be yyyy." });
            return;
        };
        if (year) year = parseInt(year);

        // page
        if (!/^\d+$/.test(page)) {
            res.status(400).json({ error: true, message: "Invalid page format. page must be a number." });
            return;
        }
        page = parseInt(page);

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

        // set up the pagination data
        const resultLength = rows.length;
        const perPage = 100;
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;

        // trim down the result to 100
        const slicedRows = rows.slice(startIndex, endIndex);

        // change the ratings to ints and doubles for the stupid
        // automated testing
        slicedRows.forEach(element => {
            const tempImdbRating = parseFloat(element.imdbRating);
            const tempRottenTomatoesRating = parseInt(element.rottenTomatoesRating);
            const tempMetacriticRating = parseInt(element.metacriticRating);

            element.imdbRating = tempImdbRating;
            element.rottenTomatoesRating = tempRottenTomatoesRating;
            element.metacriticRating = tempMetacriticRating;
        });

        // add the pagination data
        const prevPage = page - 1;
        const nextPage = page + 1;
        const pagination = {
            total: resultLength,
            lastPage: Math.ceil(resultLength / perPage),
            prevPage: prevPage === 0 ? null : prevPage,
            nextPage: slicedRows.length < 100 ? null : nextPage,
            perPage: perPage,
            currentPage: page,
            from: startIndex,
            to: Math.min(endIndex, resultLength),
        };


        // return the result
        res.json({
            Error: false,
            Message: "Success",
            data: slicedRows,
            pagination: pagination,
        });
    }
    // error handling
    catch (error) {
        console.log(err);
        res.status(500).json({ error: true, message: "Error with database" });
    }
});

// movies/data/{imdbID}
router.get("/data/:imdbID", async (req, res, next) => {
    // get the search paramters
    const imdbID = req.params.imdbID;
    let result = {};

    try {
        // get the movie data
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
                "plot",
                "imdbRating",
                "rottentomatoesRating",
                "metacriticRating"
            )
            .where("tconst", "=", imdbID)

        // assign the movieData to result
        result = movieData[0];
        // return the genres as an array
        result.genres = result.genres.split(',');
        // assign the movie ratings
        let ratings = [];
        ratings.push({source: "Internet Movie Database", value: parseFloat(result.imdbRating)});
        ratings.push({source: "Rotten Tomatoes", value: parseInt(result.rottentomatoesRating)});
        ratings.push({source: "Metacritic", value: parseInt(result.metacriticRating)});
        result.ratings = ratings;

        // get the actor data
        const actorData = await req.db
            .from("movies.principals")
            .select("nconst AS id", "category", "name", "characters")
            .where("tconst", "=", imdbID);

        // fix up their characters array
        actorData.forEach(element => {
            const temp = element.characters.replace(/[\[\]"]/g, '').split(',');
            element.characters = temp;
        });

        // assign the actor data to result.principals
        result.principals = actorData;

        // return the result
        res.json(result);
    }
    // error handling
    catch (err) {
        console.log(err);
        res.status(404).json({ error: true, message: "Error with database" });
    }
});

module.exports = router;