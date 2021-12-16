const Joi = require('joi');
const mongoose = require('mongoose');


const Package = mongoose.model('Package', new mongoose.Schema({
    userId: { type: String, required: true},
    multiplier: { type: String, required: true },
    timeMatter: { type: String, required: true },
    price: { type: String, required: true },
}));


function validatePackage(package){
    const schema = Joi.object({
        userId: Joi.string().required(),
        multiplier: Joi.string().required(),
        timeMatter: Joi.string().required(),
        price: Joi.number().required(),
    });
    return schema.validate(package);
}

function validatePackageUpdate(package){
    const schema = Joi.object({
        packageId: Joi.string().required(),
        userId: Joi.string().required(),
        multiplier: Joi.string().required(),
        timeMatter: Joi.string().required(),
        price: Joi.number().required(),
    });
    return schema.validate(package);
}


module.exports.Package = Package;
module.exports.validate = validatePackage;
module.exports.validatePut = validatePackageUpdate;