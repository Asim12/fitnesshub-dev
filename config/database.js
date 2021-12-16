var MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
function connectionDatabase() {
    return new Promise((resolve, reject) => {
        let url='mongodb+srv://mohsinraza:M.hsnnss1@findcluster.jqsni.mongodb.net/fitness-hub?retryWrites=true&w=majority';
        MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, async(err, client) => {
            if (err) {
                // db.close();
                reject(err);
            } else {
                console.log('connected!!!!');
                const db = client.db('fitness-hub');
                resolve(db);
            }//End of  connection success
        });//End of Db Connection
    });//End of promise object
}//End of connectionDatabase
module.exports = connectionDatabase();