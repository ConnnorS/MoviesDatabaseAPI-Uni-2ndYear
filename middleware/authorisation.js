const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    if (!("authorization" in req.headers) || !req.headers.authorization.match(/^Bearer /)) {
        return res.status(401).json({ error: true, message: "Authorisation header ('Bearer Token') not found." });
    }

    const token = req.headers.authorization.replace(/^Bearer /, "");
    try { jwt.verify(token, process.env.JWT_SECRET) }
    catch (e) {
        if (e.name === "TokenExpiredError") {
            res.status(401).json({ error: true, message: "JWT Token has Expired" });
        } else {
            res.status(401).json({ error: true, message: "Invalid JWT Token" });
        }
        return;
    }

    next();
}