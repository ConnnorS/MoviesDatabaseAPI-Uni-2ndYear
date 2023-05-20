var express = require('express');
var router = express.Router();

router.get("/:id", async (req, res, next) => {
    // get the search params
    const id = req.params.id;

    let result = {}

    // fetch the actor information
    try {
        const mainActorInfo = await req.db
            .from("movies.names")
            .select("primaryName AS name", "birthYear", "deathYear")
            .where("nconst", "=", id);
        
        result = mainActorInfo;

        // NOTE: get the actor's roles from here :NOTE //
    }
    // error handling 
    catch {

    }
    
});

module.exports = router;