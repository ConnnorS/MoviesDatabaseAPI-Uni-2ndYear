var express = require('express');
var router = express.Router();

// encryption
const bcrypt = require('bcrypt');

// user/register
router.post('/register', (req, res, next) => {
    // get the email and password from the request
    const email = req.body.email;
    const password = req.body.password;

    // try {
    //     try {
    //         if (!email || !password) {
    //             return;
    //         }
    //     } catch {
    //         res.status(400).json({
    //             error: true,
    //             message: "Request body incomplete - email and password needed."
    //         });
    //     }
    // }

    // check whether the user has provided everything
    if (!email || !password) {
        res.status(400).json({
            error: true,
            message: "Request body incomplete - email and password needed."
        });
        return;
    }

    // see if the user already exists
    const query = req.db
        .from("movies.users")
        .select("*")
        .where("email", "=", email);
    query.then(users => {
        if (users.length > 0) {
            res.status(409).json({ success: false, message: "User already exists" });
            return;
        }

        // if the user doesn't exist, add the user to our db
        const saltRounds = 10;
        const hash = bcrypt.hashSync(password, saltRounds);
        return req.db.from("movies.users").insert({ email, hash });
    })
        .then(() => {
            res.status(201).json({ error: false, message: "User created." });
        })
        .catch(e => res.status(500).json({ error: true, message: e.message }));
});


module.exports = router;