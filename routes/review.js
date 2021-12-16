
const auth     =    require('../middleware/auth');
const express  =    require('express');
const jwt      =    require('jsonwebtoken');
const router   =    express.Router();
const conn     =    require('../config/database');
const MongoClient = require('mongodb').MongoClient;
const Objectid =    require('mongodb').ObjectId;
const md5     =     require('md5');
const helper  =     require('../helper/helper')

router.post('/submitReviews' ,auth, async (req, res) => {
    
    class Data{
        constructor(admin_id, trainer_id, reviewValue, message, image){

            this.admin_id    =  admin_id;
            this.trainer_id  =  trainer_id;
            this.reviewValue =  reviewValue;
            this.message     =  message;
            this.image       =  image;
        }

        makeObject(){
            let insertObject = {
                admin_id    :  this.admin_id,
                trainer_id  :  this.trainer_id,
                reviewValue :  this.reviewValue,
                message     :  this.message,
                image       :  this.image,
                created_date:  new Date()
            }
            return insertObject;
        }

        saveData(obectInsert) {

            helper.insertObjectData(obectInsert);
            return true;
        }
    }

    let getValue  =  new Data(req.body.admin_id, req.body.trainer_id, req.body.reviewValue, req.body.message, req.body.image);
    let objectGet =  getValue.makeObject();
    getValue.saveData(objectGet);

    var responseArray = {
        'Status'   : 201,
        'message'  : 'Submitted'
    };
    res.status(201).send(responseArray);
})
module.exports = router;