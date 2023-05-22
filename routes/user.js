var express = require('express');
var router = express.Router();

// encryption
const bcrypt = require('bcrypt');

// user/register
router.post('/register', async (req, res, next) => {
    // get the email and password from the request
    const email = req.body.email;
    const password = req.body.password;

    let status = 500;
    let resJSON = { error: true, message: "Internal server error." };

    try {
        // check whether the user has provided everything
        if (!email || !password) {
            status = 400;
            resJSON = {
                error: true,
                message: "Request body incomplete - email and password needed."
            };

            throw new Error;
        }

        // determine if the user already exists
        const users = await req.db
            .from("movies.users")
            .select("*")
            .where("email", "=", email)

        if (users.length > 0) {
            status = 409;
            resJSON = { error: true, message: "User already exists." };
            throw new Error;
        }

        // add the user to the db
        const saltRounds = 10;
        const hash = bcrypt.hashSync(password, saltRounds);
        res.status(201).json({ error: false, message: "User created." });
        return req.db.from("movies.users").insert({ email, hash });
    }
    catch {
        res.status(status).json(resJSON);
    }
});


module.exports = router;