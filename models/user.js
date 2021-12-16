const Joi = require('joi');
const mongoose = require('mongoose');


const User = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    address: String,
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
    imageUrl: String,
    roleId: Number // 1 admin, 2 trainee, 3 end user
}));


function validateUser(user){
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().required(),
        phone: Joi.string().required(),
        password: Joi.string().required(),
        address: Joi.string(),
        latitude: Joi.string().required(),
        longitude: Joi.string().required(),
        imageUrl: Joi.string(),
        roleId: Joi.number(),
    });
    return schema.validate(user);
}
function validateResetPassword(user){
    const schema = Joi.object({
        phone: Joi.string().required(),
        password: Joi.string().required()
    });
    return schema.validate(user);
}
function validateLogin(user){
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    });
    return schema.validate(user);
}

module.exports.User = User;
module.exports.validate = validateUser;
module.exports.validateLogin = validateLogin;
module.exports.validateResetPassword = validateResetPassword;