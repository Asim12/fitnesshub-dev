
const auth          =   require('../middleware/auth');
const express       =   require('express');
const jwt           =   require('jsonwebtoken');
const helper        =   require('../helper/helper');
const router        =   express.Router();
const Stripe        =   require('stripe');
const stripe        =   Stripe('sk_test_51Jbh0xES5y6t2EWhBXW6uiNciYBvFwBa1P6j0kVMODnPdljX5FSVgdFZIVBLNuTo93dKf7G7fexdWgfI6FlIUs8n00f4ZwlI63');
const MongoClient   =   require('mongodb').MongoClient;
const ObjectId      =   require('mongodb').ObjectId;
const conn          =   require('../config/database');


router.post('/connectedAccountCreate' , auth, async (req, res) => {
    
  let admin_id  =  ((req.body.admin_id).trim()).toString();
  let checkConnectedAccountExists = await helper.checkData(admin_id)

  if(checkConnectedAccountExists > 0){
    var responseArray = {
      'status' : 'Already Link Account exists!',
      'type'   : 200,
      accountLinks : checkConnectedAccountExists[0]['conected_account_id']
    };
    res.status(200).send(responseArray);

    console.log('already Connected')

  }else{

    console.log('coneected account creating')

    let user = await helper.getUserData(admin_id)
    
    console.log(user.email)
    if(user){
      const account = await stripe.accounts.create({
        type: 'express',
        email:    user.email,
        metadata: user._id,
      });
    
      console.log('working')
      var returnUrl = 'https://fitnesshub-dev.herokuapp.com/payment/update-connected-account-id/?admin_id=' + admin_id + '&connected_account_id='+ account.id;
    
      console.log('=================>>>>>>>>>>>>>..',returnUrl)
      const accountLinks = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: 'https://example.com/reauth',
        return_url: returnUrl,
        type: 'account_onboarding',
      });
      
      console.log('accountLinks.url ========>>>>>>>>..',accountLinks.url)
      var responseArray = {
        'status' : 'Link Account is Created!',
        'type'   : 200,
        conected_account_id : accountLinks.url
      };
      res.status(200).send(responseArray);
      
    }else{

      var responseArray = {
        'status' : 'AdminId is wrong',
        'type'   : 401,
      };
      res.status(401).send(responseArray);
    }
  }
});
  
router.get('/update-connected-account-id', auth, async (req, res) => {
  
  let admin_id  = req.query.admin_id
  let connected_account_id  =  req.query.connected_account_id 

  let checkStatus  =  await helper.setConnectedAccountId(connected_account_id, admin_id )

  if(checkStatus == true){

    res.status(201).send('You are Done, you can now go back')
  }else{

    res.status(501).send('SomeThing Wrong With Your DataBase!!')
  }
  
});
  
router.get('/create-payment', auth, async (req, res) => {
  let db = await conn
  let user_id    = req.query.admin_id.toString();
  let packageId  = req.query.packageId.toString(); 
  
  let count =  await helper.checkCustomerIdExists(user_id);

  let customer_id = '';
  if(count){

    customer_id =  count.customer_id
  }else{
    
      let user = await helper.getUserData(user_id)
      console.log('user==========>>>', user.email)

      const customer = await stripe.customers.create({
        email:    user.email_address,
        name:     user.full_name,
        phone:    user.phone_number,
        metadata: {
          'fitness_hub_admin_id' : user._id.toString(),
        }
      });
      customer_id = customer.id;
      console.log('customer.id ===========>>>>>>>>>>>>>>',customer.id)

      let updateData = await helper.updateRecord(user_id, customer.id)
        
    }
  
    let pakge = await db.collection('packages').findOne({ _id : new ObjectId(packageId) });
    if(pakge){
  
      const amount = pakge.price * 100; 
      var customer = await stripe.customers.retrieve(customer_id);
      if(customer != null){
  
        const ephemeralKey = await stripe.ephemeralKeys.create(
          {customer: customer.id},
          {apiVersion: '2020-08-27'}
        );
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: 'usd',
          customer: customer.id,
  
          description: packageId,
          metadata: {
            'fligteno_admin_id' :  user_id,
          }
        });
  
        var responseArray = {
          'status' : 'Create Payment is done!',
          'type'   : 200,
          paymentIntent: paymentIntent.client_secret,
          ephemeralKey: ephemeralKey.secret,
          customer: customer.id
        };
        res.status(200).send(responseArray);
      }
    }else{
  
      var responseArray = {
        'status' : 'Payment is Already done or package Id is wrong!',
        'type'   : 200
      };
      res.status(200).send(responseArray);
    }
});
  
module.exports = router;