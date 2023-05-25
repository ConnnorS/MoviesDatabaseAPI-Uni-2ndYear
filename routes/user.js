var express = require('express');
var router = express.Router();

// encryption
const bcrypt = require('bcrypt');

// JSON Web Tokens
const jwt = require('jsonwebtoken');

// authorisation
const authorisation = require("../middleware/authorisation");

const isValidDateFormat = require("../functions/isValidDateFormat");
const dateNotInFuture = require("../functions/dateNotInFuture");
const giveToken = require("../functions/giveToken");

// GET user/{email}/profile
router.get('/:email/profile', async (req, res, next) => {
    // get the user data
    const userData = await req.db
        .from("movies.users")
        .select("email", "firstName", "lastName", "dob", "address")
        .where("email", "=", req.params.email);

    // check if the user exists
    if (userData.length === 0) {
        return res.status(404).json({
            error: true,
            message: "User not found."
        });
    }

    // if no authorisation, only provide basic info
    if (!("authorization" in req.headers)) {
        const info = { email: userData[0].email, firstName: userData[0].firstName, lastName: userData[0].lastName };
        return res.status(200).json(info);
    }

    // if the user has provided some authorisation
    if (req.headers.authorization.match(/^Bearer /)) {
        const token = req.headers.authorization.replace(/^Bearer /, "");
        // check if the authorisation is valid
        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET);
            // check if the token's email matches the claimed email
            if (verified.email === req.params.email) {
                res.status(200).json(userData[0]);
            }
            else {
                const info = { email: userData[0].email, firstName: userData[0].firstName, lastName: userData[0].lastName };
                res.status(200).json(info);
            }
        }
        catch (e) {
            if (e.name === "TokenExpiredError") {
                res.status(401).json({ error: true, message: "JWT Token has Expired" });
            }
            else {
                res.status(401).json({ error: true, message: "Invalid JWT token" });
            }
            return;
        }
    }
    else {
        res.status(401).json({ error: true, message: "Authorization header is malformed" });
    }
});

router.put('/:email/profile', authorisation, async (req, res, next) => {
    const { firstName, lastName, dob, address } = req.body;

    // verify the fields
    if (!firstName || !lastName || !dob || !address) {
        return res.status(400).json({ error: true, message: "Request body incomplete: firstName, lastName, dob and address are required." });
    }
    if (typeof firstName !== "string" || typeof lastName !== "string" || typeof dob !== "string" || typeof address !== "string") {
        return res.status(400).json({ error: true, message: "Request body invalid: firstName, lastName and address must be strings only." });
    }
    if (!isValidDateFormat(dob)) {
        return res.status(400).json({ error: true, message: "Invalid input: dob must be a real date in format YYYY-MM-DD." });
    }
    if (!dateNotInFuture(dob)) {
        return res.status(400).json({ error: true, message: "Invalid input: dob must be a date in the past." });
    }

    // check if the user exists
    const userData = await req.db('movies.users')
        .select('email')
        .where('email', req.params.email)
        .limit(1);
    if (userData.length === 0) {
        return res.status(404).json({ error: true, message: "User not found" });
    }

    // verify the authorisation
    const token = req.headers.authorization.replace('Bearer ', '');
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // check if the token's email and claimed email match
    if (verified.email === req.params.email) {
        const data = await req.db("movies.users")
            .where("email", "=", req.params.email)
            .update({ firstName: firstName, lastName: lastName, dob: dob, address: address });

        res.status(200).json({ email: userData[0].email, firstName, lastName, dob, address });
    }
    // if the token's email doesn't match the claimed email
    else {
        res.status(403).json({ error: true, message: "Forbidden" });
    }
});

router.post('/logout', async (req, res, next) => {
    // check for a refresh token
    if (!req.body.refreshToken) {
        return res.status(400).json({ error: true, message: "Request body incomplete, refresh token required" });
    }

    const token = req.body.refreshToken;

    // verify the token
    try { jwt.verify(token, process.env.JWT_SECRET) }
    catch (e) {
        if (e.name === "TokenExpiredError") {
            res.status(401).json({ error: true, message: "JWT token has expired" });
        } else {
            res.status(401).json({ error: true, message: "Invalid JWT token" });
        }
        return;
    }

    try {
        await req.db
            .from("movies.invalidTokens")
            .insert({ tokens: token });
        res.status(200).json({ error: false, message: "Token successfully invalidated" });
    }
    catch {
        res.status(500).json({ error: true, message: "Error with database" });
    }
});
// user/refresh
router.post('/refresh', (req, res, next) => {
    const userRefreshToken = req.body.refreshToken;

    // check if the request has everything
    if (!userRefreshToken) {
        return res.status(400).json({
            error: true,
            message: "Request body incomplete, refresh token required"
        });
    }

    // verify the refresh token
    try {
        const verified = jwt.verify(userRefreshToken, process.env.JWT_SECRET, { ignoreExpiration: false });

        // if verified, give a new one
        const response = giveToken(verified.email, 600, 86400);
        res.status(200).json(response);
    }
    catch (e) {
        console.log(e);
        if (e instanceof jwt.TokenExpiredError) res.status(401).json({ error: true, message: "JWT token has expired" });
        else res.status(401).json({ error: true, message: "Invalid JWT token" });
        return;
    }
});

// user/login
router.post('/login', async (req, res, next) => {
    const { email, password, longExpiry = false, bearerExpiresInSeconds = 600, refreshExpiresInSeconds = 86400 } = req.body;

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
    const response = giveToken(email, bearerExpiresInSeconds, refreshExpiresInSeconds)
    res.status(200).json(response);
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