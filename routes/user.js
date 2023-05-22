var express = require('express');
var router = express.Router();

// encryption
const bcrypt = require('bcrypt');

// JSON Web Tokens
const jwt = require('jsonwebtoken');


// function to verify the date
function isValidDate(dateString) {
    // Regular expression pattern for YYYY-MM-DD format
    const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    if (!regex.test(dateString)) {
        return false; // Not in the correct format
    }

    // Split the date into its components
    const [year, month, day] = dateString.split('-');

    // Convert the components into numbers
    const numericYear = parseInt(year, 10);
    const numericMonth = parseInt(month, 10);
    const numericDay = parseInt(day, 10);

    // Check if the date is valid
    const date = new Date(numericYear, numericMonth - 1, numericDay);
    if (
        date.getFullYear() !== numericYear ||
        date.getMonth() + 1 !== numericMonth ||
        date.getDate() !== numericDay
    ) {
        return false; // Invalid date
    }

    // Check if February 29 is on a leap year
    if (numericMonth === 2 && numericDay === 29) {
        const isLeapYear = (numericYear % 4 === 0 && numericYear % 100 !== 0) || numericYear % 400 === 0;
        if (!isLeapYear) {
            return false; // February 29 on a non-leap year
        }
    }

    return true; // Valid date
}



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
        return res.status(200).json({ error: false, message: "Success", data: info });
    }

    // if the user has provided some authorisation
    if (req.headers.authorization.match(/^Bearer /)) {
        const token = req.headers.authorization.replace(/^Bearer /, "");
        // check if the authorisation is valid
        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET);
            // check if the token's email matches the claimed email
            if (verified.email === req.params.email) {
                res.status(200).json({ error: false, message: "Success", data: userData[0] });
            }
            else {
                res.status(403).json({ error: true, message: "Forbidden" })
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

router.put('/:email/profile', async (req, res, next) => {
    const { firstName, lastName, dob, address } = req.body;

    // verify the fields
    if (!firstName || !lastName || !dob || !address) {
        return res.status(400).json({ error: true, message: "Request body incomplete: firstName, lastName, dob, and address are required" });
    }
    if (typeof firstName !== "string" || typeof lastName !== "string" || typeof dob !== "string" || typeof address !== "string") {
        return res.status(400).json({ error: true, message: "Request body invalid: firstName, lastName, dob, and address must be strings" });
    }
    if (!isValidDate(dob)) {
        return res.status(400).json({ error: true, message: "Invalid input: dob must be a valid date in the format YYYY-MM-DD" });
    }

    // check if the user exists
    const userData = await req.db('movies.users')
        .select('email')
        .where('email', req.params.email)
        .limit(1);
    if (userData.length === 0) {
        return res.status(404).json({ error: true, message: "User not found" });
    }

    // check for authorisation header
    if (!req.headers.authorization) {
        return res.status(401).json({ error: true, message: "Authorization header ('Bearer token') not found" });
    }
    else if (!req.headers.authorization.startsWith('Bearer ')) {
        return res.status(401).json({ error: true, message: "Authorization header is malformed" });
    }

    // verify the authorisation
    const token = req.headers.authorization.replace('Bearer ', '');
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        // check if the token's email and claimed email match
        if (verified.email === req.params.email) {
            const data = await req.db("movies.users")
                .where("email", "=", req.params.email)
                .update({ firstName: firstName, lastName: lastName, dob: dob, address: address });

            res.status(200).json({
                error: false,
                message: "success",
                data: { email: userData[0].email, firstName, lastName, dob, address }
            });
        }
        // if the token's email doesn't match the claimed email
        else {
            res.status(403).json({ error: true, message: "Forbidden" });
        }
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            res.status(401).json({ error: true, message: "JWT Token has expired" });
        } else {
            res.status(401).json({ error: true, message: "Invalid JWT token" });
        }
    }
});


// user/refresh
router.post('/refresh', (req, res, next) => {
    const userRefreshToken = req.body.refreshToken;

    // check if the request has everything
    if (!userRefreshToken) {
        return res.status(400).json({
            error: true,
            message: "Request body incomplete, refresh token required."
        });
    }

    // verify the refresh token
    try {
        const verified = jwt.verify(userRefreshToken, process.env.JWT_SECRET)
        // if verified, give a new one
        // if the passwords are correct, return the bearer token
        const email = verified.email;
        const expiresIn = 600;
        const exp = Math.floor(Date.now() / 1000) + expiresIn;
        const token = jwt.sign({ email, exp }, process.env.JWT_SECRET);

        const refreshExpiresIn = 86400;
        const refreshExp = Math.floor(Date.now() / 1000) + refreshExpiresIn;
        const refreshToken = jwt.sign({ email, refreshExp }, process.env.JWT_SECRET);

        res.status(200).json({
            bearerToken: { token, token_type: "Bearer", expiresIn },
            refreshToken: { token: refreshToken, token_type: "Refresh", expiresIn: refreshExpiresIn }
        });
    }
    catch (e) {
        e.name == "TokenExpiredError" ?
            res.status(401).json({ error: true, message: "JWT token has expired." })
            :
            res.status(401).json({ error: true, message: "Invalid JWT token." });
        return;
    }
});

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
    const refreshToken = jwt.sign({ email, refreshExp }, process.env.JWT_SECRET);

    res.status(200).json({
        bearerToken: { token, token_type: "Bearer", expiresIn },
        refreshToken: { token: refreshToken, token_type: "Refresh", expiresIn: refreshExpiresIn }
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