const express = require('express');
var router = express.Router();
const model = require('../model/commonModel');
const User = model.Fundraiser;
const category = model.Category;
var moment= require('moment');
const passport = require('passport');
const {ensureAuthenticated } = require('../config/auth');

edit = [];

router.get('/edit/:id', ensureAuthenticated, (req,res) =>
{
    // console.log("Showing all frs");
 User.find({_id:req.params.id
    
 }).then(sample=> {
    edit = sample;
    category.find({
     
    }).then(categories=> {
      //  console.log(sample1);
      console.log("Edit json before sending: " + edit);
      res.render('../view/manage_fundraiser/editFundraiser',{edit : edit, categories : categories, moment:moment});
    }).catch((err) => {
        res.redirect('/404');
    });
    
    // console.log(sample1.categoryImage);
    //res.send(sample);
    
    
 });
 //console.log(require('path').resolve(__dirname, '..'));
  


});


router.post('/edit/:id', ensureAuthenticated, (req,res) =>
{
    
    //console.log("id to be updated: "+ req.params.id);
 User.findOneAndUpdate({_id: req.params.id},{$set: req.body},

    function(err,User)
    {
        if(err){
            res.redirect('/404');            
            return next(err);
        }
       // res.send('Fundraiser Updated');
        res.redirect('/editFundraiser/edit/'+req.params.id);
    }
    )

})

// router.get('/edit/:id',(req,res) =>
// {
//     User.findById(req.params.id, function (err, User)
//     {
//         if (err) return next(err);
//         res.redirect('/editFundraiser/edit/'+req.params.id);
//     })
// })

// category.find({
     
// }).then(sample=> {
//    sample1 = [];
//    sample1 = sample;
//   //  console.log(sample1);
   
// });

module.exports = router;