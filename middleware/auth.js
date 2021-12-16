const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const token = req.header('x-auth-token');
    // console.log(token);
    if(!token){
        let response = {};
        response.Status = 401;
        response.Error = 'Access denied. No token provided.';
        return res.status(401).send(response);
    }
    try {
        const decoded = jwt.verify(token, "fitness_hub_jwt_private_key");
        // console.log('asim', decoded);
        req.user = decoded;
        next();
    }
    catch(err) {
        // console.log(err);
        let response = {};
        response.Status = 400;
        response.Error = 'Invalid token.';
        return res.status(400).send(response);
    }
}

module.exports = auth;