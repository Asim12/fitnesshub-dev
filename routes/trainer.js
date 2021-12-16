const { Trainer, validate, validateResetPassword, validateLogin, validateUpdatePassword } = require('../models/trainer');
const auth      =   require('../middleware/auth');
const express   =   require('express');
const jwt       =   require('jsonwebtoken');
const router    =   express.Router();
const conn      =   require('../config/database');
const MongoClient = require('mongodb').MongoClient;
const ObjectId  =   require('mongodb').ObjectId;
const md5       =   require('md5');
const helper    =  require('../helper/helper')
const roleId    =   2;



router.get('/hello', async (req, res) => {
    return res.send("working properly");
})

// register trainer
router.post('/', async (req, res) => {
    let db = await conn;
    console.log('as')
    const { error } = validate(req.body);
    if(error){
        let response = {};
        response.Status = 400;
        response.Error = error.details[0].message;
        return res.status(400).send(response);
    }
    
    let where = {
        '$or' : [
            {email : req.body.email.toLowerCase() },
            {phone: req.body.phone}
          ]
    };
    const alreadyExists = await db.collection('users').find(where).toArray();
    if(alreadyExists.length > 0){
        let response = {};
        response.Status = 409;
        response.Error = 'The user with the provided phone or email is already exists';
        return res.status(409).send(response);
    }
    let country = await helper.findLocation();
    let user = {
        name            :   req.body.name,
        email           :   req.body.email.toLowerCase(),
        phone           :   req.body.phone,
        password        :   md5(req.body.password),
        gymAffiliation  :   req.body.gymAffiliation,
        experience      :   req.body.experience,
        specialization  :   req.body.specialization,
        trainerDescription : req.body.trainerDescription,
        certificateUrl  :   req.body.certificateUrl,
        latitude        :   req.body.latitude,
        longitude       :   req.body.longitude,
        imageUrl        :   req.body.imageurl,
        roleId          :   roleId,
        created_date    :   new Date(),
        country         :   country,
        address         :   req.body.address,

    };
    let admin_id = await db.collection('users').insertOne(user);

    let token = await helper.generateJwtToken( admin_id.insertedId.toString(), req.body.name , (req.body.email.toLowerCase()).trim(), req.body.phone)
    user['token'] = token;

    let activity_name = 'Trainer register';
    let user_id = admin_id.insertedId.toString();    
    helper.saveUserActivity(activity_name, user_id);

    res.status(201).send(user);
});
router.post('/registerSocialTrainer', async function(req, res) {

    let email   =  req.body.email;
    let source  =  req.body.source;
    let db = await conn
    let where = {
        email: email, 
        '$or' : [
            { source : {'$exists' : false } },
            { source : {$ne : source}}
        ]
    }
    db.collection('users').findOne( where, async(err,response) => {
        if(err){
            let user = {
                'status' : 401,
                'Error'  :   'DataBase Issue'
            }
            res.status(401).send(user);
        }else{

            let responseData = await response;
            if(responseData){
                let user = {
                    'status' : 401,
                    'Error'  :   'Email ALready exists'
                }
                res.status(401).send(user);
            }else{

                let country = await helper.findLocation();
                let user = {
                    name        :   req.body.name,
                    email       :   (req.body.email.toLowerCase()).trim(),
                    phone       :   req.body.phone,
                    address     :   req.body.address,
                    latitude    :   req.body.latitude,
                    longitude   :   req.body.longitude,
                    imageUrl    :   req.body.imageurl,
                    roleId      :   roleId,
                    source      :   source,
                    created_date:   new Date(),
                    country     :   country,
                    address     :   req.body.address,
                }
                await db.collection('users').updateOne({email : (req.body.email.toLowerCase()).trim() },  {$set: user}, {'upsert' : true });

                let record  = await db.collection('users').find({email : (req.body.email.toLowerCase()).trim() }).toArray();

                let token = await helper.generateJwtToken( record[0]['_id'].toString(), req.body.name , (req.body.email.toLowerCase()).trim(), req.body.phone)
                user['token'] = token;
                let activity_name = 'Trainer social register';
                let admin_id = record[0]['_id'].toString();    
                helper.saveUserActivity(activity_name, admin_id);
                res.status(201).send(user);
            }
        }
    })
})

// login user
router.post('/login', async (req, res) => {
    let db = await conn;
    const { error } = validateLogin(req.body);
    if(error){
        let response = {};
        response.Status = 400;
        response.Error = error.details[0].message;
        return res.status(400).send(response);
    }

    const user = await db.collection('users').find({email: req.body.email.toLowerCase() , password: md5(req.body.password), roleId: roleId}).toArray();

    if(user.length == 0){
        let response = {};
        response.Status = 404;
        response.Error = 'Invalid Credentials';
        return res.status(404).send(response);
    }
    // generate token    
    let token = await helper.generateJwtToken( user._id, user[0].name , user[0].email, user[0].phone)

    user[0].token = token;
    res.status(200).send(user[0]);
});


// Reset password
router.put('/ResetPassword', async (req, res) => {
    let db = await conn;
    const { error } = validateResetPassword(req.body);
    if(error){
        let response = {};
        response.Status = 400;
        response.Error = error.details[0].message;
        return res.status(400).send(response);
    }
    const user = await db.collection('users').updateOne({phone: req.body.phone, roleId: roleId}, {$set : {
        password: md5(req.body.password)
    }});

    if(user.matchedCount == 0){
        let response = {};
        response.Status = 404;
        response.Error = 'The user with provided phone is not registered.';
        return res.status(404).send(response);
    }
    if(user.modifiedCount == 0){
        let response = {};
        response.Status = 400;
        response.Error = 'Your password is the same or Network issue.';
        return res.status(400).send(response);
    }
    else{
    
        let matchingObject = {
            phone: req.body.phone, 
            roleId: roleId
        }
        let responseData = await helper.getDetails('users', matchingObject)
        
        let activity_name = 'Trainer reset password';
        let admin_id = responseData[0]['_id'].toString();    
        helper.saveUserActivity(activity_name, admin_id);
    
        return res.status(201).send(user);
    }
});

// Get list of trainers
router.get('/', auth, async (req, res) => {
    let db = await conn;
    const users = await db.collection('users').find({roleId: roleId}).toArray();
    res.status(200).send(users);
});

// Update Password
router.put('/UpdatePassword', auth, async (req, res) => {
    let db = await conn;
    const { error } = validateUpdatePassword(req.body);
    if(error){
        let response = {};
        response.Status = 400;
        response.Error = error.details[0].message;
        return res.status(400).send(response);
    }
    const user = await db.collection('users').updateOne({email: req.body.email.toLowerCase(), password: md5(req.body.oldPassword), roleId: roleId}, {$set : {
        password: md5(req.body.password)
    }});

    if(user.matchedCount == 0){
        let response = {};
        response.Status = 404;
        response.Error = 'The user with provided email & password is not found.';
        return res.status(404).send(response);
    }
    if(user.modifiedCount == 0){
        let response = {};
        response.Status = 400;
        response.Error = 'Something went wrong';
        return res.status(400).send(response);
    }
    else
        return res.status(200).send(user);
});


// Update Profile
router.put('/UpdateProfile', auth, async (req, res) => {
    let db = await conn;
    const fields = {
        bioGraphy: req.body.bioGraphy,
        address: req.body.address,
        specialization: req.body.specialization,
        qualification: req.body.qualification,
        price: req.body.price
    };
    const user = await db.collection('users').updateOne({_id: new ObjectId(req.body.userId), roleId: roleId}, {$set : fields});

    if(user.matchedCount == 0){
        let response = {};
        response.Status = 404;
        response.Error = 'The user with provided Object ID is not found.';
        return res.status(404).send(response);
    }
    if(user.modifiedCount == 0){
        let response = {};
        response.Status = 400;
        response.Error = 'Something went wrong';
        return res.status(400).send(response);
    }
    else{

        let activity_name = 'Trainer update profile';
        let admin_id = req.body.userId.toString();    
        helper.saveUserActivity(activity_name, admin_id);

        return res.status(200).send(fields);
    }
});


router.post('/findTrainer' , auth , async function(req, res){

    if(req.body.spacification){
        let spacification = req.body.spacification.toString();

        let searchData = await helper.findTrainers(spacification);
        let response = {
            Status : 200,
            data   : searchData,
        }
        res.status(200).send(response);
    }else{

        let response = {
            Status : 400,
            Error  : 'Payload Missing',
        }
        res.status(400).send(response);
    }
})

router.post('/findTrainerUsingLocation' , auth, async function(req, res){

    if(req.body.latitude && req.body.longitude){
        let latitude  =  req.body.latitude.toString();
        let longitude =  req.body.longitude.toString();

        let searchData = await helper.findUsingLocation(latitude, longitude);
        let response = {
            Status : 200,
            data   : searchData,
        }
        res.status(200).send(response);
    }else{

        let response = {
            Status : 400,
            Error  : 'Payload Missing',
        }
        res.status(400).send(response);
    }
})

module.exports = router;
