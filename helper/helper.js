
const { IoTJobsDataPlane } = require("aws-sdk");
const conn          =   require('../config/database');
const MongoClient   =   require('mongodb').MongoClient;
const ObjectId      =   require('mongodb').ObjectId;
const jwt           =   require('jsonwebtoken');
const md5           =   require('md5');
const Stripe        =   require('stripe');
const stripe        =   Stripe('sk_test_51JfgCvCOVkR3wUJujzGVLsCyJvfsrZ5hIaxNdOaqiYClKAan2Dusscjn7CVGLavAhNWmv7vYTCXkJXdBN7ucMqCp0054dsF6H6');
const publicIp      =   require('public-ip');
var axios = require("axios").default;


module.exports = {
    checkData: (admin_id) => {
        return new Promise(resolve => {
            conn.then(db => {
                // console.log(admin_id)
                db.collection('users').countDocuments( { _id : new ObjectId(admin_id), conected_account_id : {'$exists' : true} },  async(err, res) => {
                    if(err){
                        console.log('users dataBase Error!')
                        resolve(false)
                    }else{
                       
                        let dataCount = await res;
                        resolve(dataCount)
                    }
                })
            })
        })
    },

    getUserData: (admin_id) => {
        return new Promise((resolve, reject) => {
            conn.then((db) => {
                console.log(admin_id)
                db.collection('users').findOne({ _id : new ObjectId(admin_id.toString() )}, async (err, result) => {
                    if(err){
                        console.log('error DataBase!')
                        resolve(false)
                    }else{
                        resolve(await result )
                    }
                })
            })
        })
    },

    setConnectedAccountId: (connected_account_id, admin_id) => {
        return new Promise((resolve, reject) => {
            conn.then((db) => {

                db.collection('users').updateOne({_id : new ObjectId(admin_id)},  {$set : {'conected_account_id' :  connected_account_id}}, async (err,result) => {
                    if(err){
                        console.log('database Error')
                        resolve(false)
                    }else{
                        resolve(true)
                    }
                })
            })
        })
    },
    
    checkCustomerIdExists : (admin_id) => {
        return new Promise((resolve, reject) => {
            conn.then((db) => {
                db.collection('users').findOne({_id : new ObjectId(admin_id), customer_id : {'$exists' : true} }, async(err, result) => {
                    if(err){
                        console.log('dataBase have some Issue')
                        resolve(false)
                    }else{
                        resolve(await result )
                    }
                });
            })
        })
    },

    updateRecord : (admin_id, customer_id) => {
        return new Promise((resolve, reject) => {
            conn.then((db) => {
                db.collection('users').updateOne({ _id : new ObjectId(admin_id)}, {$set: {customer_id :  customer_id} }, async (err, result) => {
                    if(err) {
                        console.log('error');
                        resolve(false)
                    }else{
                        resolve(true)
                    }
                })
            })
        })
    },

    generateJwtToken : (admin_id, name, email, phone) => {
        return new Promise ((resolve, reject) => {
            const token = jwt.sign
            (
                {
                    userId  :   new ObjectId(admin_id),
                    name    :   name,
                    email   :   email,
                    phone   :   phone
                },
                "fitness_hub_jwt_private_key", 
                {
                    expiresIn: "24h",
                }
            );
            resolve(token)
        })
    }, 

    sendNotifications  : () => {
        return new Promise ((resolve, reject) => {
            then.conn((db) => {

                let serverKey = "AAAAiBAsx2w:APA91bE5-UD-H-nQZVsJvoU9hcHqcJtcFwu6s3zwnwLQzDU4UXHzXm-wHZRAxyANdNSm94h4KeXJ8xzMn7skyOyAqZCoEZvGMhZfOGlM-31GJdH7d85_hZVjqVVvz8vP_QwkAqkbA87O";
            })
        });
    },

    findTrainers : (spacification) => {
        return new Promise (resolve => {
            conn.then(async(db) => {
                let data =  await db.collection('users').find({ specialization : spacification, roleId : 2 }).toArray()
               resolve(data);
            })
        });
    },

    findUsingLocation  : (latitude, longitude) => {
        return new Promise (resolve => {
            conn.then(async(db) => {
                let data =  await db.collection('users').find({ longitude : longitude, latitude: latitude,  roleId : 2 }).toArray()
               resolve(data);
            })
        });
    },

    getBasicAuthCredentials : () => {
        return new Promise(resolve => {

            let username = md5('adminLogin');
            let password = md5('asim92578@gmail.com');

            let returnArray = {
                username   : username,
                password   : password
            }

            resolve(returnArray)
        })
    },

    userData: (email_address) => {
        return new Promise(resolve => {
            conn.then(async db => {
                let where = {
                    'email' : email_address,
                    roleId  : 1
                };
                let data  =  await db.collection('users').find(where).toArray(); 
                resolve(data)
            })
        })
    },

    getAllUsers: (skip, limit, search) => {
        return new Promise(resolve => {
            conn.then(async db => {

                let queryGet = [
                    {
                        '$match' : search
                    },
                    {
                        '$project' : {
                            _id                 : 1,
                            name                : "$name",
                            email               : '$email',
                            phone               : "$phone",
                            latitude            : "$latitude",
                            longitude           : "$longitude",
                            imageUrl            : "$imageUrl",
                            roleId              : "$roleId",
                            conected_account_id :  "$conected_account_id",
                            customer_id         : "$customer_id"
                        }
                    },
                    {
                        '$lookup' : {
                            'from' : 'packages',
                            'let' : {
                                'admin_id' :  { '$toString' : '$_id'},
                            },
                            'pipeline' : [
                                {
                                '$match' : {
                                    '$expr' : {
                                        '$eq' : [
                                                '$userId',
                                                '$$admin_id'
                                            ]
                                        },
                                    },
                                },
                                
                                {
                                '$project' : {
                                        '_id'       :  1,
                                        'price'     : '$price',
                                       
                                    }
                                }
                            ],
                            'as' : 'packageData'
                        }
                    },
                   
                    {
                        '$sort' : { 'created_date' : -1 }
                    },
                    {
                        '$skip' : skip
                    },
                    {
                        '$limit' : limit
                    },

                ];
                let users = await db.collection('users').aggregate(queryGet).toArray();
                resolve(users);
            })
        })
    },

    getActivity: (skip, limit) => {
        return new Promise(resolve => {
            conn.then(async db => {
                let queryGet = [
                    {
                        '$project' : {
                            _id            : 1,
                            activity_name  : "$activity_name",
                            admin_id       : "$admin_id",
                            created_date   : "$created_date"
                        }
                    }, 
                    
                    {
                        '$lookup' : {
                            'from' : 'users',
                            'let' : {
                                'admin_id' :  { '$toObjectId' : '$admin_id'},
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
                                        '_id'       :  1,
                                        'name'      : '$name',
                                        'imageUrl'  : '$imageUrl',
                                    }
                                }
                            ],
                            'as' : 'profile_data'
                        }
                    },
                    
                    {
                        '$sort' : { 'created_date' : -1 }
                    },
                    {
                        '$skip' : skip
                    },
                    {
                        '$limit' : limit
                    },
                ];
                let activies = await db.collection('activity').aggregate(queryGet).toArray();
                resolve(activies);
            })
        })
    },

    getFlag : (search) => {
        return new Promise(resolve => {
            conn.then(async db => {
                let queryGet = [
                    {
                        '$match' : search
                    },
                    {
                        '$project' : {
                            _id            : 1,
                            name           : "$name",
                            imageUrl       : "$imageUrl",
                            created_date   : "$created_date",
                            email          : "$email",
                            phone          : "$phone",
                            roleId         : "$roleId",
                            flag_status_date : '$flag_status_date'
                        }
                    }
                ]; 

                let data  =  await db.collection('users').aggregate(queryGet).toArray(); 
                resolve(data)
            })
        })
    },

    getAllUsersCount: (collectionName, search)=> {
        return new Promise(resolve => {
            conn.then(async db => {
                let searchData;
                if(search.start_date && search.end_date){
                    searchData = {
                        created_date : {'$gte' : new Date(search.start_date), '$lte' : new Date(search.end_date)}
                    }
               }else{

                if(search !=''){
                    searchData = search
                }else{

                    searchData = Object.assign({}, search);
                }
               }
                let count = await db.collection(collectionName).countDocuments(searchData);
                resolve(count);
            })
        })
    },

    getCount: (collectionName, search)=> {
        return new Promise(resolve => {
            conn.then(async db => {
                let searchObj = Object.assign({}, search);
                let count = await db.collection(collectionName).countDocuments(searchObj);
                resolve(count);
            })
        })
    },

    getAllTrasections: (skip, limit, search) => {
        return new Promise(resolve => {
            conn.then(async db => {
                var searchData ;
                if(search.start_date && search.end_date ){
                    console.log('if')

                    searchData = {
                        created_date :{ '$gte' : new Date(search.start_date), '$lte' : new Date(search.end_date)}, 
                    };
                }else{
                    console.log('else')

                    searchData = search
                }
              
                let queryGet = [
                    {
                        '$match' : searchData
                    },
                    {
                        '$project' : {
                            _id                 : 1,
                            multiplier          : "$multiplier",
                            userId              : "$userId",
                            timeMatter          : '$timeMatter',
                            price               : "$price",
                            packageImageUrl     : "$packageImageUrl",
                        }
                    },
                    {
                        '$lookup' : {
                            'from' : 'users',
                            'let' : {
                                'admin_id' :  { '$toObjectId' : '$userId'},
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
                                        '_id'       :  1,
                                        'name'      : '$name',
                                        'imageUrl'  : '$imageUrl',
                                    }
                                }
                            ],
                            'as' : 'profile_data'
                        }
                    },
                   
                    {
                        '$sort' : { 'created_date' : -1 }
                    },
                    {
                        '$skip' : skip
                    },
                    {
                        '$limit' : limit
                    },

                ];
                let trasection = await db.collection('packages').aggregate(queryGet).toArray();
                resolve(trasection);
            })
        })
    },

    getSupportData : (skip, limit, search) => {
        return new Promise(resolve => {
            conn.then(async db => {
                console.log(search);

                if(search.end_date && search.start_date){

                    searchCriteria = {
                        created_date: {'$gte' : new Date(search.start_date), '$lt' : new Date(search.end_date)}
                    }
                }else{
                    searchCriteria = search
                }
                let queryGet = [
                    {
                        '$match' : searchCriteria
                    },
                    {
                        '$project' : {
                            _id         :  1,
                            admin_id    :  '$admin_id',  
                        }
                    },
                    {
                        '$lookup' : {
                            'from' : 'users',
                            'let' : {
                                'admin_id' :  { '$toObjectId' : '$admin_id'},
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
                                        '_id'       :  1,
                                        'name'      : '$name',
                                        'imageUrl'  : '$imageUrl',
                                    }
                                }
                            ],
                            'as' : 'profile_data'
                        }
                    },
                
                    {
                        '$sort' : { 'created_date' : -1 }
                    },
                    {
                        '$skip' : skip
                    },
                    {
                        '$limit' : limit
                    },

                ];
                let trasection = await db.collection('support').aggregate(queryGet).toArray();
                resolve(trasection);
            })
        })
    },

    saveDailyDetails: (progress,admin_id, date) => {
        return new Promise((resolve, reject) => {
            conn.then(async (db) => {
                
                let data = await db.collection('daily_progress').find({admin_id: admin_id, created_date: new Date(date)}).toArray();
                if(data.length > 0 ){

                    resolve('You can not submit twice at the same day progress already exists!');
                }else{

                    db.collection('daily_progress').insertOne(progress);
                    resolve('Successfully Submitted!');
                }
            })
        })
    },

    saveUserActivity : (activity_name, admin_id) => {  
        return new Promise((resolve, reject) => {
            conn.then(async (db) => {
                let activityObject = {
                    activity_name:  activity_name,
                    created_date :  new Date(),
                    admin_id     :  admin_id
                };
                db.collection('activity').insertOne(activityObject);
                resolve(true);
            })
        }) 
    },//end

    getDetails : (collectionName, matchingObject) => {
        return new Promise((resolve, reject) => {
            conn.then(async (db) => {

                let data = await db.collection(collectionName).find(matchingObject).toArray();
    
            })
        })
    }, 

    findLocation : () =>{
        return new Promise((resolve, reject) => {
            conn.then(async(db) => {
                let ip = await publicIp.v4();                
                
                var options = {method: 'GET', url: 'http://ipinfo.io/'+ip+'/json'};
                axios.request(options).then(function (response) {
                resolve(response.data.country);
                }).catch(function (error) {
                console.error(error);
                });
            })
        })
    },

    markAllAsRead:(collectionName) => {
        return new Promise((resolve, reject) => {
            conn.then(async(db) => {

                db.collection(collectionName).updateMany({status: "new"}, {'$set' : {status: "read"}});
                resolve(true);
            })
        })
    },

    getNotificationData: (collectionName) => {
        return new Promise((resolve, reject) => {
            conn.then(async(db) =>{

                let QueryData = [
                    {
                        '$project'  : {
                            '_id'   : {'$toString' : '$_id'},
                            'created_date' : "$created_date",
                            'admin_id'     : "$admin_id",
                            "message"      : "$message",
                            "status"       : "$status",
                        }
                    },
                   
                    {
                        '$lookup' : {
                          'from' : 'users',
                          'let' : {
                            'admin_id' :  { '$toObjectId' : '$admin_id' },
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
                                        '_id' : { '$toString' :  '$_id'},
                                        'name'    :  '$name',
                                        'imageUrl':  '$imageUrl'
                                    }
                                },
                          ],
                        'as' : 'profile_details'
                        }
                    },
                    {'$sort' : {'created_date' : -1}},
                    {'$limit' : 50}
                ];
                let data =  await db.collection(collectionName).aggregate(QueryData).toArray();
                resolve(data);
            })
        })
    },

    notificationsCount: (collectionName) => {
        return new Promise((resolve, reject) => {
            conn.then(async(db) =>{
                let count =  await db.collection(collectionName).countDocuments({status : "new"});
                resolve(count);
            })
        })
    },

    getPayment : () => {
        return new Promise((resolve, reject) => {
            conn.then(async(db) => {

                var olderDate = new Date();
                olderDate.setMonth(olderDate.getMonth() -1);

                let QueryData = [
                    {
                        '$match' : {
                            created_date : {'$gte' : olderDate, '$lte' : new Date()}
                        }
                    },
                    {
                        '$group' : {
                            '_id'    :  null,
                            total : {'$sum' : '$price'}
                        }
                    }
                ];
                let data =  await db.collection('packages').aggregate(QueryData).toArray();
                resolve(data);
            })
        })
    },

    getSplash : (skip, limit) => {
        return new Promise((resolve, reject) => {
            conn.then(async(db) => {
                let queryGet = [
                    {
                        '$project' : {
                            _id           : 1,
                            image         : "$image",
                            date          : '$date',
                           created_date   : '$created_date',
                           publication    : '$publication',
                           status         : '$status',
                        }
                    },
                    {
                        '$sort' : { 'created_date' : -1 }
                    },
                    {
                        '$skip' : skip
                    },
                    {
                        '$limit' : limit
                    },

                ];
                let data = await db.collection('splash_data').aggregate(queryGet).toArray();
                resolve(data);
            })
        })
    },//end

    countUsersAtive: () => {
        return new Promise((resolve, reject) => {
            conn.then(async (db) => {
                let totalUsers = await db.collection('users').countDocuments({ roleId : { $in: [2,3] } } );
                // let QueryForUser = [
                //     {
                //         '$group' : {
                //             _id : '$userId',
                //         } 
                //     },
                //     {
                //         '$group' : {
                //             _id : null,
                //             total: {$sum : 1}
                //         }
                //     }
                // ];
                // let activeUser = await db.collection('packages').aggregate(QueryForUser).toArray();
                // console.log(activeUser[0]['total']);

                // let activeTrainer = await db.collection('packages').countDocuments();
                let response = {
                    totalUsers  :  totalUsers,
                //     active      :  ((activeUser[0]['total'] + activeTrainer),
                //     inActive    :  (totalUsers - ((activeUser[0]['total'] + activeTrainer))
                };
                resolve(response);
            })
        })
    },//end

    getBookMark: (userId) => {
        return new Promise((resolve, reject) => {
            conn.then(async (db) => {
                let QueryGetData = [
                    {
                        '$match' : {
                            userId : userId
                        }
                    },
                    {
                        '$project' : {
                            _id    :  {'$toString' : '$_id'},
                            userId : '$userId',
                            trainerId : '$trainerId',
                            created_date : '$createdDate'
                        }
                    },

                    {
                        '$lookup' : {
                            'from' : 'users',
                            'let' : {
                                'trainerId' :   { '$toObjectId' : '$trainerId'},
                            },
                            'pipeline' : [
                                {
                                    '$match' : {
                                        '$expr' : {
                                            '$eq' : [
                                                '$_id',
                                                '$$trainerId'
                                            ]
                                        },
                                    },
                                },
                                
                                {
                                    '$project' : {
                                        '_id'      :  1,
                                        'name'     : '$name',
                                        'email'    : '$email',
                                        'imageUrl' : '$imageUrl',
                                        'phone'    : '$phone',
                                        'latitude' : '$latitude',
                                        'longitude': '$longitude',
                                        'address'  : '$address'
                                    }
                                }
                            ],
                            'as' : 'trainerProfile'
                        }
                    },
                    {
                        '$sort' : {created_date : -1}
                    }
                ];

                let data = await db.collection('book_mark').aggregate(QueryGetData).toArray();
                resolve(data)
            })
        })
    },//end

    createdTicket : (insertTicket) => {
        return new Promise((resolve, reject) => {
            conn.then(async(db) => {

                db.collection('ticket').insertOne(insertTicket);

            })
        })
    },

    getTicketsAll : (admin_id) => {
        return new Promise((resolve, reject) => {
            conn.then(async(db) => {
                let getTickets = [
                    {
                        '$match' : {
                            'admin_id' : admin_id,
                        }
                    },

                    {
                        '$project' : {
                            '_id'           :  { '$toString' : '$_id'},
                            'admin_id'      :  '$admin_id',
                            'message'       :  '$message',
                            'subject'       :  '$subject',
                            'image'         :  '$image',
                            'video'         :  '$video',
                            'status'        :  '$status',
                            'roleId'        :  '$roleId',
                            'created_date'  :  '$created_date'
                        }
                    },

                    {
                        '$lookup' : {
                            'from' : 'ticket_reply',
                            'let' : {
                                'ticket_id' : { '$toString' : '$_id' },
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
                                        '_id'           :  {'$toString' : '$_id'},
                                        'ticket_id'     :  '$ticket_id',
                                        'admin_id'      :  '$admin_id',
                                        'message'       :  '$message',
                                        'created_date'  :  '$created_date',
                                        'file'          :  '$file',
                                        'image'         :  '$image'
                                    }
                                },
                                {
                                    '$lookup' : {
                                        'from' : 'users',
                                        'let' : {
                                            'admin_id' :  {'$toObjectId' : '$admin_id'},
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
                                                    '_id'           :  1,
                                                    'name'     : '$name',
                                                    'imageUrl' : '$imageUrl'
                                                    
                                                }
                                            }
                                        ],
                                        'as' : 'userData'
                                    }
                                },
                                {
                                    '$sort' : { 'created_date' : -1}
                                },
                            ],
                            'as' : 'messages'
                        }
                    },
                    {
                        '$sort' : { 'created_date'  : -1} 
                    },
                ];

                let ticketsData    = await db.collection('ticket').aggregate(getTickets).toArray();
                resolve(ticketsData);
            })
        })
    },


    ticketGet : (search, skip, limit ) => {
        return new Promise((resolve, reject) => {
            conn.then(async(db) => {

                let getTicketsData = [
                    {
                        '$match' : search
                    },
            
                    {
                        '$project' : {
                            '_id'           :  { '$toString' : '$_id'},
                            'admin_id'      :  '$admin_id',
                            'message'       :  '$message',
                            'subject'       :  '$subject',
                            'status'        :  '$status',
                            'image'         :  '$image',
                            'video'         :  '$video',
                            'created_date'  :  '$created_date'
                        }
                    },
        
                    {
                        '$lookup' : {
                            'from' : 'users',
                            'let' : {
                                'admin_id' :    {'$toObjectId' : '$admin_id'},
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
                                        'imageUrl' : '$imageUrl'
                                    }
                                }
                            ],
                            'as' : 'ticketUserData'
                        }
                    },
                    {
                        '$sort' : { 'created_date' : -1 }
                    },
                    {
                        '$skip' : skip
                    },
                    {
                        '$limit' : limit
                    },
                ];
                let tickets  =  db.collection('ticket').aggregate(getTicketsData).toArray();
                resolve(tickets);
            })
        })
    },//end

    insertObjectData: (obectInsert) => {
        return new Promise((resolve, reject) =>{
            conn.then(db => {
                db.collection('reviews').insertOne(obectInsert);
                resolve(true);
            })
        })
    },


    FindTrainerUsingFilter : (challenge) => {
        return new Promise((resolve, reject) => {
            conn.then(async(db) => {
                let data  = await db.collection('users').find({specialization : challenge, roleId : 2 }).toArray();
                resolve(data);
            })
        })
    },
}//end modules
// let serverKey = "AAAAiBAsx2w:APA91bE5-UD-H-nQZVsJvoU9hcHqcJtcFwu6s3zwnwLQzDU4UXHzXm-wHZRAxyANdNSm94h4KeXJ8xzMn7skyOyAqZCoEZvGMhZfOGlM-31GJdH7d85_hZVjqVVvz8vP_QwkAqkbA87O";