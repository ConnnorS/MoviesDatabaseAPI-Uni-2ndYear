var express = require('express');
var router = express.Router();

// people/{id}
router.get("/:id", async (req, res, next) => {
    // get the search params
    const id = req.params.id;

    let result = {};
    // fetch the actor information
    try {
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
            mainActorRoles[i].imdbRating = movieData[0].imdbRating;
        }

        result.roles = mainActorRoles;


        res.json(result);
    }
    // error handling
    catch (err) {
        console.log(err);
        res.status(500).json({ error: true, message: "Error with database" });
    };
});

module.exports = router;