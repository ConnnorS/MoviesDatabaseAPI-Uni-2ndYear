var express = require('express');
var router = express.Router();

router.get("/:id", (req, res, next) => {
    let data = {}
    let roles = []

    // get the basic info
    req.db
        .from("movies.names")
        .select("primaryName AS name", "birthYear", "deathYear", "knownForTitles AS roles")
        .where("nconst", "=", req.params.id)
        .then(rows => {
            data = rows[0];
            data.roles = data.roles.split(',');
        })
        .then(() => {
            data.roles.forEach(element => {
                req.db
                    .from("movies.principals")
                    .select("tconst AS movieId", "category", "characters")
                    .where("name", "=", data.name).andWhere("tconst", "=", element)
                    .then(rows2 => {
                        roles.push(rows2[0]);
                        console.log(data);
                        console.log(roles);
                    });


            });
        })
});

module.exports = router;