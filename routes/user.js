const { User, validate, validateResetPassword, validateLogin } = require('../models/user');
const auth     =    require('../middleware/auth');
const express  =    require('express');
const jwt      =    require('jsonwebtoken');
const router   =    express.Router();
const conn     =    require('../config/database');
const MongoClient = require('mongodb').MongoClient;
const Objectid =    require('mongodb').ObjectId;
const md5     =    require('md5');
const helper  =  require('../helper/helper')
const roleId  = 3;

// register user
router.post('/', async (req, res) => {
    console.log('comming')
    let db = await conn;
    validate
    const { error } = validate(req.body);
    if(error){
        let response = {};
        response.Status = 400;
        response.Error = error.details[0].message;
        return res.status(400).send(response);
    }
    
    // check if already exists
    let where = {
        '$or' : [
            {email : (req.body.email.toLowerCase()).trim()},
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
    console.log(country);
    let user = {
        name        :   req.body.name,
        email       :   (req.body.email.toLowerCase()).trim(),
        phone       :   req.body.phone,
        password    :   md5((req.body.password).trim()),
        address     :   req.body.address,
        latitude    :   req.body.latitude,
        longitude   :   req.body.longitude,
        imageUrl    :   req.body.imageurl,
        roleId      :   roleId,
        created_date:   new Date(),
        country     :   country

    };
    let data = await db.collection('users').insertOne(user);
    let token = await helper.generateJwtToken(data.insertedId.toString(), req.body.name , (req.body.email.toLowerCase()).trim(), req.body.phone)
    user['token'] = token;
    let activity_name = 'New user signup';
    let admin_id = data.insertedId.toString();    
    helper.saveUserActivity(activity_name, admin_id);
    res.status(201).send(user);
});

router.post('/registerSocial', async function(req, res) {

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
                    'Error'  :   'Email already exists'
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
                    created_date: new Date(),
                    country     :   country
                }
                await db.collection('users').updateOne({email : (req.body.email.toLowerCase()).trim() },  {$set: user}, {'upsert' : true });
                let record  = await db.collection('users').find({email : (req.body.email.toLowerCase()).trim() }).toArray();
                let token = await helper.generateJwtToken( record[0]['_id'].toString(), req.body.name , (req.body.email.toLowerCase()).trim(), req.body.phone)
                user['token'] = token;

                let activity_name = 'New user signup using social';
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
    let email = ( (req.body.email).toLowerCase() ).trim();
    let password = ( (req.body.password).toLowerCase() ).trim()
    
    const { error } = validateLogin(req.body);
    if(error){
        let response = {};
        response.Status = 400;
        response.Error = error.details[0].message;
        return res.status(400).send(response);
    }
    const user = await db.collection('users').find({email: email, password: md5(password), roleId: roleId}).toArray();
    if(user.length == 0){
        let response = {};
        response.Status = 404;
        response.Error = 'Invalid Credentials';
        return res.status(404).send(response);
    }

    // generate token
    let token = await helper.generateJwtToken( user._id, user[0].name , user[0].email, user[0].phone);

    // const token = jwt.sign
    // (
    //     {
    //         userId: user._id,
    //         name: user[0].name,
    //         email: user[0].email,
    //         phone: user[0].phone
    //     },
    //     process.env.jwtPrivateKey,
    //     {
    //         expiresIn: "24h",
    //     }
    // );

    user[0].token = token;
    console.log(user[0]);
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
        response.Status = 400;
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

        let activity_name = 'Reset Password';
        let admin_id = responseData[0]['_id'].toString();    
        helper.saveUserActivity(activity_name, admin_id);
        res.status(201).send(user);
    }
});

// get route
router.get('/', auth, async (req, res) => {
    let db = await conn;
    const users = await db.collection('users').find({}).toArray();
    res.send(users);
});

// put
router.put('/update', async (req, res) => {
    let db = await conn;
    const { error } = validate(req.body);
    if(error){
        let response = {};
        response.Status = 400;
        response.Error = error.details[0].message;
        return res.status(400).send(response);
    }

    const user = await db.collection('users').updateOne({email : req.body.email.toLowerCase()}, {$set : {
        name: req.body.name,
        email: req.body.email.toLowerCase(),
        phone: req.body.phone,
        address: req.body.address,
    }});
    res.send(user);
});

// delete
router.delete('/delete', async (req, res) => {
    let db = await conn;
    const user = await db.collection('users').deleteOne({ email: req.body.email.toLowerCase() });
    res.send(user);
});


router.post('/saveDailyProgress', auth , async (req, res) => {

    let progress = { 

       admin_id     : req.body.admin_id.toString(),
       goal         : req.body.goal,
       current      : req.body.current,
       set_goal     : req.body.set_goal,
       created_date : new Date(req.body.created_date),
       target_area  : req.body.target_area,
       exercise     : req.body.exercise,
       sets         : req.body.sets,
       weight_load  : req.body.weight_load,
       repetition   : req.body.repetition,
       calories_burt: req.body.calories_burt,
       time         : req.body.time,
       distance     : req.body.distance,
    };

    let status = await helper.saveDailyDetails(progress, req.body.admin_id, req.body.created_date);
    var responseArray = {
        'Status'   : 201,
        'message'  : status,
    };

    let activity_name = 'Submitted daily progress';
    let admin_id = req.body.admin_id.toString();    
    helper.saveUserActivity(activity_name, admin_id);

    res.status(201).send(responseArray);
})


router.post('/bookMarkTraier', auth , async (req, res) => {

    let db = await conn;    
    let insertData = {

        userId    : req.body.userId.toString(),
        trainerId : req.body.trainerId.toString(),
        created_date  : new Date() 
    };
    let check =  await db.collection('book_mark').countDocuments({userId : req.body.userId.toString(), trainerId : req.body.trainerId.toString() })
    console.log(check)
    if(check > 0){
        let deleteD = await db.collection('book_mark').deleteOne({userId : req.body.userId.toString(), trainerId : req.body.trainerId.toString() });

        console.log(deleteD);
        var responseArray = {
            'Status'   : 201,
            'message'  : 'Deleted Successfully',
        };
        res.status(201).send(responseArray);
    }else{ 

        db.collection('book_mark').insertOne(insertData);

        var responseArray = {
            'Status'   : 201,
            'message'  : 'Saved Successfully',
        };
        res.status(201).send(responseArray);
    }
})//end 


router.post('/deleteBookMark', auth , async (req, res) => {

    let db = await conn;
    let bookMarkId    =  req.body.bookMarkId.toString();
       
    db.collection('book_mark').deleteOne({_id : new Object(bookMarkId)});

    var responseArray = {
        'Status'   : 201,
        'message'  : 'Successfully deleted',
    };
    res.status(201).send(responseArray);
})//end 


router.post('/getBookMarkData', auth , async (req, res) => {

    let userId = req.body.userId;
    let dataRes = await helper.getBookMark(userId);
    
    var responseArray = {
        'Status'   : 201,
        'message'  : 'Fetched',
        'data'     : dataRes
    };
    res.status(201).send(responseArray);
})

router.post('/searchTrainer' ,auth,  async (req, res) => {

    class Findtrainer{
        constructor(challenge){
            this.challenge = challenge;
        }
        async getResult(){
            let data = await helper.FindTrainerUsingFilter(this.challenge);
            return data;
        }
    }
    let objectTrainer = new Findtrainer(req.body.challenge);
    let result = await objectTrainer.getResult();
    var responseArray = {
        'Status'   : 201,
        'message'  : 'Fetched',
        'data'     : result
    };
    res.status(201).send(responseArray);
})

module.exports = router;