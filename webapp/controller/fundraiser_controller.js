const express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
var mongoose = require('mongoose');
const model = require('../model/commonModel');
const fundraiser = model.Fundraiser;
const category = model.Category;
const Donation = model.Donation;
const Cause = model.Cause;
const {ensureAuthenticated } = require('../config/auth');
var categories;
var causes;

router.use(function (req, res, next) {
    Cause.find({}, (err, arr) => {
        if(err) {
            console.log('Error in retrieving causes: ' + JSON.stringify(err, undefined, 2));
        }
        causes = arr;
    });
    category.find({isDeleted: false}, (err, arr) => {
        if(err) {
            console.log('Error in retrieving categories: ' + JSON.stringify(err, undefined, 2));
        }
        categories = arr;
    });
    next();
  })
  

// following lines added by Vivek on 15 april
const Comment = model.Comment;
var commentList = [];
//
// var {User} = require('../model/user.js');
router.get('/cause', (req, res) => {
    Cause.find({}, (err, arr) => {
        if(err) {
            res.redirect('/cause');
            return;
        }
        res.render('../view/fundraiser_cause', {cause : arr});
    });
    // res.render('../view/chooseCauseFundraiser');
});

/*router.get('/view_fundraiser/:id',(req, res) =>{
    fundraiser.findById({"_id":req.params.id},(err,event)=>{
        console.log(event);
        if(err){
            res.render({'messages':err});
        }
        else{
            res.render('../view/view_fundraiser',{event:event});
        }
    });
});*/

router.get('/start/:id', (req, res) => {
    res.render('../view/start_fundraiser');
});

// following code edited by Vivek on 15th april
// keep view_fundraiser in front of id otherwise it will create problem for other routers - Kinnar (15 Apr)
router.get('/view_fundraiser/:id', (req, res) => {
    fundraiser.findById({ "_id": req.params.id }, (err, event) => {
        console.log(event);
        image1 = "../view/images/fundraiser_1.jpg";// event.image.replace(/\\/g, "/");
        console.log(image1);
        if (err) {
            res.render({ 'messages': err });

        }
        else {

            Comment.find({ fundraiserId: req.params.id }, (err, comments) => {
                //console.log(comments);
                if (err) {
                    res.render({ 'messages': err });
                }
                else {
                   
                            commentList = comments;

                            console.log(commentList);
                            console.log(image1);
                            //console.log(userList);
                            res.render('../view/view_fundraiser', { event: event, image1 : image1,commentList: commentList});
                        }
                    });
               
              // console.log(userList);

           
                    //console.log(comments);
                    // commentList = comments;

                    // console.log(commentList);
                    // console.log(image1);
                    // console.log(userList);
                   // res.render('../view/view_fundraiser', { event: event, image1, commentList,userList,DonorList });
                }



            });



    });
//

// following code edited by Vivek on 15th april
router.post('/fundraiser_comment/:id/comment', (req, res) => {
    const newComment = new Comment({
        comment: req.body.comment,
        fundraiserId: req.params.id,
        createdBy: "5ca2fbd72d28de361ef43b76"
    })
    console.log(newComment);

    newComment.save().then(user => {
        // req.flash(
        //     'success_msg',
        //     'You are now registered and can log in'
        // );
        errors = [];

        res.redirect('/fundraiser/' + req.params.id);
    })
        .catch(err => console.log(err));
});

router.get('/browse_fundraiser/:categoryId?', (req, res) => {
    console.log("param category:" + req.params.categoryId + ":");

    if(req.params.categoryId == undefined){

        fundraiser.aggregate([
            { '$lookup': { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category'} }, 
            { '$unwind': '$category' },
            { "$unwind": {
                "path": "$donations",
                "preserveNullAndEmptyArrays": true  //This is needed when we want fundraisers which have empty or null donations to be included
            }},
            { $group : {
                // "_id": "$_id",
                "_id": {id:"$_id", categoryId:"$categoryId", createdDate: "$createdDate" },
                "doc":{"$first":"$$ROOT"},
                "donations": { "$push": "$donations" },               
                "totalDoantions": { "$sum": "$donations.amount" }
                },
            },
            { $sort:{"_id.createdDate": -1} }
        ]).exec(function (err, docs){
            if(err){
                console.log('Error in retrieving fundraisers: ' + JSON.stringify(err, undefined, 2));
            }
            // console.log("fundraisers: " + JSON.stringify(docs));                
            res.render('../view/browse_fundraiser', {fundraisers: docs, categories: categories, causes: causes});
        });
    } else {
        // below line is for reference: if just join, condition and sort is needed then use below. But using aggregate is a better approach.
        // fundraiser.find({categoryId: req.params.categoryId}, null, {sort:{createdDate: -1}}).populate('categoryId').exec(function (err, docs) {
        
        fundraiser.aggregate([

            //Typecast is needed for ObjectId when using within aggregate - known issue
            //For more info on this issue: https://github.com/Automattic/mongoose/issues/1399
            { $match: {categoryId: mongoose.Types.ObjectId(req.params.categoryId)}},
            
            { '$lookup': { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category'} }, 
            { '$unwind': '$category' }, //We may need category info like name and description so pushing it to the resule
            { "$unwind": {
                "path": "$donations",
                "preserveNullAndEmptyArrays": true  //This is needed when we want fundraisers which have empty or null donations to be included
            }},
            { $group : {
                // "_id": "$_id", //rather use below
                "_id": {id:"$_id", categoryId:"$categoryId", createdDate: "$createdDate" }, //rather than only id we may need other fields for sort
                "doc":{"$first":"$$ROOT"},  //pushing the entire document so that we can use all the fields
                "donations": { "$push": "$donations" },     //pushing the donations array if donations info is needed              
                "totalDoantions": { "$sum": "$donations.amount" }   //the main reason why this grouping was used: sum of the donations for each fundraisers
            }},            
            { $sort:{"_id.createdDate": -1} }   //sorting the result in descending order with respect to createdDate. _id.createdDate because in group we have pushed created date in group result in id field
        ]).exec(function (err, docs){    
            if(err){
                console.log('Error in retrieving fundraisers: ' + JSON.stringify(err, undefined, 2));
            }
            // var frs = JSON.stringify(docs);
            // console.log("fundraisers with category id: " + JSON.stringify(docs));            
            res.render('../view/browse_fundraiser', {fundraisers: docs, categories: categories, causes: causes});
        });
    }
});


//just a test funciton to add donations.
router.get('/add_donation/:fundraiserId', (req, res) => {
    // console.log("fundraiserId:"+ req.params.fundraiserId +":");
    fundraiser.findOne({ _id: req.params.fundraiserId }, function(err, fr) {
        // console.log('fundraiser: ' + fr);
        var donation = new Donation({
            userId: "5cb4c825f1cd812f9c316c4a",
            amount: 4000,
            createdDate: Date.now,
            transactionId: "12345667879",
            paymentMode: "Card",
            bank: "BofA",
            invoiceId: "INV0000001",
            taxName: "Sales Tax",
            taxRate: "8",
            taxAmount: "90"
        });
        fr.donations.push(donation);
        fr.save((err, doc) => {
            if(!err) {
                console.log('Donation added');
                res.send("Success");
            }
            else {           
                console.log('Error in adding Donation: ' + JSON.stringify(err, undefined, 2));
                res.send("Fail");
            }
        });
    });
});

module.exports = router;

