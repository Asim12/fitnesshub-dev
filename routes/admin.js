
const auth     =    require('../middleware/auth');
const express  =    require('express');
const jwt      =    require('jsonwebtoken');
const router   =    express.Router();
const conn     =    require('../config/database');
const MongoClient = require('mongodb').MongoClient;
const Objectid =    require('mongodb').ObjectId;
const md5     =    require('md5');
const helper  =  require('../helper/helper')
const roleId = 1; 

router.post('/login', async function(req, res){
     
    if(req.headers.authorization){

        let credentialsGet = await helper.getBasicAuthCredentials()

        let username = credentialsGet.username;
        let password = credentialsGet.password;
        
        const base64Credentials =  req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const userDetails = credentials.split(':');
    
        let usernameApi = md5(userDetails[0])
        let passwordApi = md5(userDetails[1])
    
        if(username === usernameApi   &&  password == passwordApi){

            let email_address = (req.body.email_address).trim();
            let password      = ((req.body.password).toString()).trim();
      
            if(email_address.length > 0  && password.length > 0){

                let loginType   = await helper.userData(email_address, password);

                if(loginType.length > 0 && loginType[0].password != undefined ){
                
                    if(md5(password) === loginType[0].password){

                        let token = await helper.generateJwtToken( loginType[0]['_id'].toString(), loginType[0]['name'] , (loginType[0]['email']).trim(), loginType[0]['phone'])
                        loginType['token'] = token;

                        var responseArray = {
                        'status'    : 'Successfully Login',
                        'userData'  :  { ...loginType }, 
                        'type'      : 200
                        };
                        res.status(200).send(responseArray);

                    }else{
                        var responseArray = {

                        'status' : 'password are wrong',
                        'type'   : 404
                        };
                        res.status(404).send(responseArray);

                    }

                }else{
                    var responseArray = {
                        'status' : 'emial or password are wrong',
                        'type'   : 404
                    };
                    res.status(404).send(responseArray);

                }
            }else{

                var responseArray = {
                  'status' : 'wrong parameters',
                  'type'   : 404
                };
                res.status(404).send(responseArray);
            }      
        }else{
            var responseArray = {
              'status' : 'Authentication Failed!!!',
              'type'   : 404
            };
            res.status(404).send(responseArray);
        }
    }else{

        var responseArray = {
            'status' : 'Headers are Missing!!!!',
            'type'   : 404
          };
        res.status(404).send(responseArray);
    }
})

router.post('/getAllSignupUsers', auth, async function(req, res) {

    let skip   = parseInt(req.body.skip);
    let limit  = parseInt(req.body.limit);
    let search = req.body.search;

    var users = await helper.getAllUsers(skip, limit, search);
    var responseArray = {

        'status' : 'Fetched',
        'users'   : users,

    };
    res.status(200).send(responseArray);
})

router.post('/getRecentActivity' , auth, async function(req, res) {
    let skip   = parseInt(req.body.skip);
    let limit  = parseInt(req.body.limit);
 
    var activities = await helper.getActivity(skip, limit); 
    console.log('activity', activities.length)
    var responseArray = {
        'status'      : 'Fetched',
        'activities'  : activities,
    };
    res.status(200).send(responseArray);
})

router.post('/getAllSignupUsersCount', auth, async function(req, res) {

    let collectionName = req.body.collectionName;
    let status = req.body.status;
    let search = req.body.search;

    if(status == 'activity' ){
        var count = await helper.getCount(collectionName, search);
        var responseArray = {
            'status' : 'Fetched',
            'count'   : count,
        };
        res.status(200).send(responseArray);
    }else if(status == 'readAll'){
        helper.markAllAsRead(collectionName);
        var responseArray = {
            'status' : 'Read Done',
        };
        res.status(200).send(responseArray);
    }else{
        var count = await helper.getAllUsersCount(collectionName, search);
        console.log('count data', count)
        var responseArray = {
            'status' : 'Fetched',
            'count'   : count,
        };
        res.status(200).send(responseArray);
    }
})

router.post('/getAllFlagUsers', auth, async function(req, res){

    let search = req.body.search;
    var flagUsers    = await helper.getFlag(search);
    console.log('count flag', flagUsers.length) 
    var responseArray = {

        'status'     : 'Fetched',
        'flagUsers'  : flagUsers,
    };
    res.status(200).send(responseArray);
})

router.post('/getTrasections', auth, async function(req, res) {

    let skip   = parseInt(req.body.skip);
    let limit  = parseInt(req.body.limit);
    let search = req.body.search;

    var users = await helper.getAllTrasections(skip, limit, search);
    var responseArray = {

        'status' : 'Fetched',
        'users'   : users,
    };
    res.status(200).send(responseArray);
})

router.post('/getSupport', auth, async function(req, res) {

    let skip   = parseInt(req.body.skip);
    let limit  = parseInt(req.body.limit);
    let search = req.body.search;

    var supportData = await helper.getSupportData(skip, limit, search);
    var responseArray = {

        'status' : 'Fetched',
        'data'   : supportData,
    };
    res.status(200).send(responseArray);
})

router.post('/getNotifications' , async function(req, res) {
    let collectionName = req.body.collectionName;
    let data = await helper.getNotificationData(collectionName);
    var responseArray = {
        'status' : 'Fetched',
        'data'   :  data,
    };
    res.status(200).send(responseArray);
})

router.post('/getNotificationsCount' , async function(req, res) {

    let collectionName = req.body.collectionName;
    let data = await helper.notificationsCount(collectionName)
    var responseArray = {
        'status' : 'Fetched',
        'data'   :  data,
    };
    res.status(200).send(responseArray);
})

router.post('/getPaymentLastMonth', auth, async function(req, res) {
    let data = await helper.getPayment();
    var responseArray = {
        'status' : 'Fetched',
        'data'   :  data,
    };
    res.status(200).send(responseArray);
})

router.post('/saveData', async function(req, res) {

    let collectionName = req.body.collectionName;
    let insertArray = {
        'image'     :  req.body.image,
        'date'      :  new Date(req.body.date),
        'created_date'  :  new Date(),
        'status'        :  'new',
        'publication'   :  (req.body.publication) ? 'yes': 'no' 
    };

    let db = await conn
    db.collection(collectionName).insertOne(insertArray)

    var responseArray = {

        'status' : 'saved',    
    };
    res.status(200).send(responseArray);

})//end


router.post('/getSplashData', auth, async function(req, res) {

    let skip   = parseInt(req.body.skip);
    let limit  = parseInt(req.body.limit);

    var data = await helper.getSplash(skip, limit);
    var responseArray = {

        'status' : 'Fetched',
        'data'   : data,
    };
    res.status(200).send(responseArray);
})

router.post('/deleteSplashRecord', auth , async function(req, res) {

    let id = req.body.collectionName;
    let db = await conn;
    let dataDelete = await db.collection('splash_data').deleteOne({_id : new Objectid(id)});
    return true;
})

router.post('/getActiveInactiveUsers', auth , async function(req, res){

    let countActive =  await helper.countUsersAtive();
    var responseArray = {

        'status' : 'Fetched',
        'data'   : countActive,
    };
    res.status(200).send(responseArray);
})


module.exports = router;