const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs')
const User = require('../../schema/UserSchema');
const router = express.Router();
const Notification = require('../../schema/NotificationsSchema')

// multer Configuration
const upload = multer({
    dest: "uploads/"
});

/**
 * @description Get users based on query or not
 */

 router.get("/" , (req, res) => {

    let searchObj = req.query ; 

    if(req.query.search !== undefined){
        // $or is mongoose operator : check if the condition is true 
        searchObj = {
            
            $or : [
                {firstName : {$regex : req.query.search  , $options : "i"}},
                {lastName : {$regex : req.query.search  , $options : "i"}},
                {username : {$regex : req.query.search  , $options : "i"}},
            ]
        }
    }

    User.find(searchObj).then(results => {
        res.status(200).send(results)
    }).catch(error => {
        console.log(error);
        res.sendStatus(400)
    })

 })


/**
 * @description Follow and unfollow a user
 */
router.put("/:userId/follow" , async (req, res) => {

    let userId  = req.params.userId ;
    let user = await User.findById(userId)
    if(!user) return res.sendStatus(404)

    // verify if the req.session.user is already following the userId
    let isFollowing = user.followers &&  user.followers.includes(req.session.user._id) 

    // set the option based on if we are following the user or not?
    const option = isFollowing ? "$pull" : "$addToSet"

    // update the req.session.user following and followers array
    req.session.user = await User.findByIdAndUpdate(req.session.user._id , { [option] : {following : userId}}, {new: true}).catch(error =>{
         console.log(error);
         res.sendStatus(404)
    })

    // update the user we are following  following and followers array
    User.findByIdAndUpdate(userId , { [option] : {followers : req.session.user._id}}).catch(error =>{
        console.log(error);
        res.sendStatus(404)
    })

    // send Notification only in case we are following the user
    if(!isFollowing){
     await Notification.insertNotification(userId , req.session.user._id , "follow", req.session.user._id )
    }

    res.status(200).send(req.session.user)

})

/**
 * @description Get a user following list
 */
router.get("/:userId/following" , async (req , res) => {

     let userId  = req.params.userId ;

    User.findById(userId).populate('following').then(results => {
        res.status(200).send(results)
    }).catch(error => {
        console.log(error);
        res.sendStatus(400)
    })
});

/**
 * @description Get a user followers list
 */
router.get("/:userId/followers" , async (req , res) => {

     let userId  = req.params.userId ;
    User.findById(userId).populate('followers').then(results => {
        res.status(200).send(results)
    }).catch(error => {
        console.log(error);
        res.sendStatus(400)
    })
})

/**
 * @description Upload image 
 */

 router.post("/profilePicture" , upload.single("croppedImage") ,  (req, res) => {

    if(!req.file){
        console.log("No file uploaded with ajax request");
        return res.sendStatus(400)
    }

    let filePath = `/uploads/images/${req.file.filename}.png`;
    let tempPath = req.file.path ;
    let targetPath = path.join(__dirname , `../../${filePath}`)

    fs.rename(tempPath , targetPath , async (error) => {
        if(error != null){
            console.log(error);
            return res.sendStatus(400);
        }

       req.session.user = await User.findByIdAndUpdate(req.session.user._id , {profilePic : filePath} , {new : true})

          res.sendStatus(204)
    })
  
 })


 /**
 * @description Upload Cover image 
 */

 router.post("/coverPhoto" , upload.single("croppedImage") ,  (req, res) => {

    if(!req.file){
        console.log("No file uploaded with ajax request");
        return res.sendStatus(400)
    }

    let filePath = `/uploads/images/${req.file.filename}.png`;
    let tempPath = req.file.path ;
    let targetPath = path.join(__dirname , `../../${filePath}`)

    fs.rename(tempPath , targetPath , async (error) => {
        if(error != null){
            console.log(error);
            return res.sendStatus(400);
        }

       req.session.user = await User.findByIdAndUpdate(req.session.user._id , {coverPhoto : filePath} , {new : true})

          res.sendStatus(204)
    })
  
 })



module.exports = router