const { Package, validate, validatePut } = require('../models/package');
const auth = require('../middleware/auth');
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const conn = require('../config/database');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;


// add package
router.post('/', auth, async (req, res) => {
    let db = await conn;
    const { error } = validate(req.body);
    if(error){
        let response = {};
        response.Status = 400;
        response.Error = error.details[0].message;
        return res.status(400).send(response);
    }
    
    let package = {
        userId: req.body.userId,
        multiplier: req.body.multiplier,
        timeMatter: req.body.timeMatter,
        price: parseFloat(req.body.price),
        packageImageUrl: req.body.packageImageUrl,
        created_date : new Date()
    };
    await db.collection('packages').insertOne(package);
    
    let insertNotification = {
        created_date : new Date(),
        message : 'buy new pakage',
        admin_id: req.body.userId.toString(),
        status : "new"
    }
    db.collection('admin_notification').insertOne(insertNotification);
    res.status(201).send(package);
});


// get route
router.get('/', auth, async (req, res) => {
    let db = await conn;
    const package = await db.collection('packages').find({userId: req.query.userId}).toArray();
    res.status(200).send(package);
});


// put
router.put('/', async (req, res) => {
    let db = await conn;
    const { error } = validatePut(req.body);
    if(error){
        let response = {};
        response.Status = 400;
        response.Error = error.details[0].message;
        return res.status(400).send(response);
    }
    const packageData = {
        multiplier: req.body.multiplier,
        timeMatter: req.body.timeMatter,
        price: req.body.price,
    };
    if(req.body.packageImageUrl)
    packageData.packageImageUrl = req.body.packageImageUrl;
    
    const package = await db.collection('packages').updateOne({_id : new ObjectId(req.body.packageId)}, {
        $set : packageData
    });
    if(package.modifiedCount == 1)
        res.status(200).send(package);
    else {
        let response = {};
        response.Status = 400;
        response.Error = 'Something went wrong';
        return res.status(400).send(response);
    }
});


// delete
router.delete('/' , async (req, res) => {
    let db = await conn;
    const package = await db.collection('packages').deleteOne({ _id: new ObjectId(req.query.packageId) });
    if(package.deletedCount == 1){
        res.status(200).send(package);
    }
    else {
        let response = {};
        response.Status = 400;
        response.Error = 'Package not Found!';
        return res.status(400).send(response);
    }
});


// get route
router.get('/AllPackages', auth, async (req, res) => {
    let db = await conn;

    let query = [
    
        { 
            $project: {
                '_id'   : '$_id',
                'userId': '$userId',
                'price': '$price'
            }
        },

        {
            $lookup : {
              'from' : 'users',
              'let' : {
                'admin_id' : {'$toObjectId' : '$userId'},
              },
              pipeline : [
                    {
                        '$match' : {
                            '$expr' : {
                                '$eq' : [
                                    '$_id',
                                    '$$admin_id'
                                ]
                            },
                        },
                    },
                    {
                        $project :{
                            '_id'  : 1,
                            'name' : '$name',
                            'latitude' : '$latitude',
                            'longitude' : '$longitude',
                            'imageUrl' : '$imageUrl'
                        }
                    }
                ],  
              'as' : 'trainer'
            },
        }
     
    ];
    let packages = await db.collection('packages').aggregate(query).toArray();
    res.send(packages);
});

module.exports = router;