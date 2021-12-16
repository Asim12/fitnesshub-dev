const auth     =    require('../middleware/auth');
const express  =    require('express');
const jwt      =    require('jsonwebtoken');
const router   =    express.Router();
const conn     =    require('../config/database');
const MongoClient = require('mongodb').MongoClient;
const Objectid =    require('mongodb').ObjectId;
const md5     =     require('md5');
const helper  =     require('../helper/helper')


router.post('/submitTicket', auth , async (req, res) => {

    let insertTicket = {  
        'admin_id'    : req.body.admin_id.toString(),
        'message'     : req.body.message,
        'subject'     : req.body.subject,
        'image'       : req.body.image,
        'video'       : req.body.video,
        'status'      : 'pending',
        'roleId'      : req.body.roleId,
        'created_date': new Date(),
    };
    helper.createdTicket(insertTicket);
    let tickets = await helper.getTicketsAll(req.body.admin_id.toString());

    var responseArray = {
        'Status'   : 201,
        'message'  : 'Fetched',
        'data'     : tickets
    };
    res.status(201).send(responseArray);
})//end


router.post('/getTickts' , auth, async(req, res) => {

    let admin_id = req.body.admin_id.toString();
    let tickets = await helper.getTicketsAll(admin_id);

    var responseArray = {
        'Status'   : 201,
        'message'  : 'Fetched',
        'data'     : tickets
    };
    res.status(201).send(responseArray);
})//end


router.post('/ticketReply', auth , async(req, res) => {

    let tickerReply = {

        'ticket_id'    :  req.body.ticket_id,
        'message'      :  req.body.message,
        'admin_id'     :  req.body.admin_id,
        'status'       :  'new',
        'created_date' : new Date(),
    };
    let db = await conn;
    db.collection('ticket_reply').insertOne(tickerReply);

    var responseArray = {
        'Status'   : 201,
        'message'  : 'reply send',
    };
    res.status(201).send(responseArray);
})//end

// admin panel api 

router.post('/getTicketsForAdmin', auth, async (req, res) => {

    let skip   = parseInt(req.body.skip);
    let limit  = parseInt(req.body.limit);
    let search = req.body.search;

    let data = await helper.ticketGet(search, skip, limit );
    res.status(201).send(data);
})//end


router.post('/sendReplyAdmin', auth , async (req, res) => {

    let saveData = {
        'ticket_id'   :  req.body.search.ticket_id,
        'admin_id'    :  req.body.search.admin_id,
        'status'      :  'new',
        'created_date':  new Date()        
    } 
    console.log(saveData);
    if(req.body.status == 'file'){

        saveData['file'] = req.body.search.file;
    }else if(req.body.status == 'image'){

        saveData['image'] = req.body.search.image;
    }else{

        saveData['message'] = req.body.search.message;
    }
    let db = await conn;
    db.collection('ticket_reply').insertOne(saveData);
    let response = {
        status : true
    }
    res.status(201).send(response);

})//end


router.post('/getMessagesForAdmin', auth, async (req, res) => {
    
    let ticketId = req.body.search.ticketId.toString();
    let db = await conn;

    let getMessages = [
        {
            '$match' : {

                '_id' : new Objectid(ticketId)
            }
        },

        {
            '$project' : {
                '_id'           :  { '$toString' : '$_id'},
                'admin_id'      :  {'$toObjectId' : '$admin_id'},
                'image'         :  '$image',
                'video'         :  '$video',
                'subject'       :  '$subject',
                'message'       :  '$message',
                'created_date'  :  '$created_date', 
                'status'        :  '$status',
            }
        },

        {
            '$lookup' : {
                'from' : 'users',
                'let' : {
                    'admin_id' :    '$admin_id'
                },
                'pipeline' : [
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
                    '$project' : {
                            '_id'      :  1,
                            'name'     : '$name',
                            'imageUrl' : '$imageUrl',
                            'email'    :  '$email'
                        }
                    }
                ],
                'as' : 'profileData'
            }
        },

        {
        '$lookup' : {
            'from' : 'ticket_reply',
            'let' : {
                'ticket_id' : '$_id',
            },
            'pipeline' : [
                {
                    '$match' : {
                        '$expr' : {
                            '$eq' : [
                                '$ticket_id',
                                '$$ticket_id'
                            ]
                        },
                    },
                },
                
                {
                    '$project' : {
                        '_id'           :  { '$toString' : '$_id' },
                        'ticket_id'     :  '$ticket_id',
                        'admin_id'      :  '$admin_id',
                        'message'       :  '$message',
                        'created_date'  :  '$created_date',//[ '$dateToString' : [ 'format' : "%Y:%m:%d:%H:%M:%S:%L%z", 'date' : '$created_date', 'timezone' : "America/New_York"] ],
                        'status'        :  '$status',
                        'file'          :  '$file',
                        'image'         :  '$image',
                    }
                },
                {
                    '$lookup' : {
                        'from' : 'users',
                        'let' : {
                            'admin_id' :    { '$toObjectId' : '$admin_id' },
                        },
                        'pipeline' : [
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
                                '$project' : {
                                    '_id'      :  1,
                                    'name'     : '$name',
                                    'imageUrl' : '$imageUrl',
                                    'email'    :  '$email'
                                }
                            }
                        ],
                        'as' : 'userData'
                    }
                },
                {
                    '$sort' : { 'created_date' : 1}
                },
            ],
            'as' : 'messages'
            }
        },

        {
            '$sort' : { 'created_date' : 1 }
        },
    ];

    let messages  = await db.collection('ticket').aggregate(getMessages).toArray();


    res.status(201).send(messages);
})

module.exports = router;


