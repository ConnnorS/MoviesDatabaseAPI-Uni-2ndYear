var express = require('express');
var router = express.Router();

router.get("/:id", async (req, res, next) => {
    const id = req.params.id;

    // fetch the actor information
    try {
        req.db
            .from("movies.names")
            .select("primaryName AS name", "birthYear", "deathYear")
            .where("nconst", "=", id)
    }
    // error handling 
    catch {

    }
    
});

module.exports = router;