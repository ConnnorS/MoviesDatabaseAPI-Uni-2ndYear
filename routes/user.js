var express = require('express');
var router = express.Router();

// encryption
const bcrypt = require('bcrypt');

// JSON Web Tokens
const jwt = require('jsonwebtoken');

// user/login
router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;

    // check if the request has everything
    if (!email || !password) {
        return res.status(400).json({
            error: true,
            message: "Request body incomplete, email and password needed."
        });
    }

    // determine if the user is in the db
    const users = await req.db
        .from("movies.users")
        .select("*")
        .where("email", "=", email);

    if (users.length === 0) {
        return res.status(401).json({
            error: true,
            message: "The provided email does not exist."
        });
    }

    // compare the passwords
    const user = users[0];
    const match = await bcrypt.compare(password, user.hash);

    if (!match) {
        return res.status(401).json({
            error: true,
            message: "Incorrect email or password."
        });
    }

    // if the passwords are correct, return the bearer token
    const expiresIn = 600;
    const exp = Math.floor(Date.now() / 1000) + expiresIn;
    const token = jwt.sign({ email, exp }, process.env.JWT_SECRET);

    const refreshExpiresIn = 86400;
    const refreshExp = Math.floor(Date.now() / 1000) + refreshExpiresIn;
    const refreshToken = jwt.sign({email, refreshExp}, process.env.JWT_SECRET);

    res.status(200).json({
        bearerToken: { token, token_type: "Bearer", expiresIn },
        refreshToken: {token: refreshToken, token_type: "Refresh", expiresIn: refreshExpiresIn}
    });
});

// user/register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    // check if the request has everything
    if (!email || !password) {
        return res.status(400).json({
            error: true,
            message: "Request body incomplete, email and password needed."
        });
    }

    // check if the user already exists
    const userExists = await req.db
        .from("movies.users")
        .select("*")
        .where("email", "=", email);

    if (userExists.length > 0) {
        return res.status(409).json({ error: true, message: "User already exists." });
    }

    // if all good, add the user to the db
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);
    await req.db.from("movies.users").insert({ email, hash });

    res.status(201).json({ error: false, message: "User created." });
});


module.exports = router;