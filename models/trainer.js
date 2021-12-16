const Joi = require('joi');
const mongoose = require('mongoose');


const Trainer = mongoose.model('Trainer', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    gymAffiliation: String,
    experience: String,
    specialization: String,
    certificateUrl: String,
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
    imageUrl: String,
    bioGraphy: String,
    address: String,
    qualification: String,
    price: Number,
    roleId: Number // 1 admin, 2 trainee, 3 end user
}));


function validateTrainer(trainer){
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().required(),
        phone: Joi.string().required(),
        password: Joi.string().required(),
        gymAffiliation: Joi.string(),
        experience: Joi.string(),
        specialization: Joi.string(),
        certificateUrl: Joi.string(),
        latitude: Joi.string().required(),
        longitude: Joi.string().required(),
        imageUrl: Joi.string(),
        bioGraphy: Joi.string(),
        address: Joi.string(),
        qualification: Joi.string(),
        price: Joi.number(),
        roleId: Joi.number()
    });
    return schema.validate(trainer);
}
function validateResetPassword(trainer){
    const schema = Joi.object({
        phone: Joi.string().required(),
        password: Joi.string().required()
    });
    return schema.validate(trainer);
}
function validateUpdatePassword(trainer){
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
        oldPassword: Joi.string().required()
    });
    return schema.validate(trainer);
}
function validateLogin(trainer){
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    });
    return schema.validate(trainer);
}

module.exports.Trainer = Trainer;
module.exports.validate = validateTrainer;
module.exports.validateLogin = validateLogin;
module.exports.validateResetPassword = validateResetPassword;
module.exports.validateUpdatePassword = validateUpdatePassword;