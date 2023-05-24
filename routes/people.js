var express = require('express');
var router = express.Router();

// authorisation
const authorisation = require("../middleware/authorisation");

// people/{id}
router.get("/:id", authorisation, async (req, res, next) => {
    // get the search params
    const id = req.params.id;

    let result = {};
    try {
        // check for search params
        if (Object.keys(req.query).length !== 0) {
            return res.status(400).json({ error: true, message: "Query parameters are not permitted." });
        }

        // fetch the actor information
        const mainActorInfo = await req.db
            .from("movies.names")
            .select("primaryName AS name", "birthYear", "deathYear")
            .where("nconst", "=", id);

        result = mainActorInfo[0];

        const mainActorRoles = await req.db
            .from("movies.principals")
            .select("tconst AS movieId", "category", "characters")
            .where("nconst", "=", id);

        // convert the 'characters' key to an array
        mainActorRoles.forEach(element => {
            element.characters = element.characters.replace(/[\[\]"]/g, '').split(',');
        });

        // get the movie name and IMDB rating
        for (let i = 0; i < mainActorRoles.length; i++) {
            const movieData = await req.db
                .from("movies.basics")
                .select("primaryTitle", "imdbRating")
                .where("tconst", "=", mainActorRoles[i].movieId);
            mainActorRoles[i].movieName = movieData[0].primaryTitle;
            mainActorRoles[i].imdbRating = parseFloat(movieData[0].imdbRating);
        }

        result.roles = mainActorRoles;

        res.json(result);
    }
    // error handling
    catch (err) {
        console.log(err);
        res.status(404).json({ error: true, message: "Error with database" });
    };
});

module.exports = router;