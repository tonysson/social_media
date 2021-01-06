const express = require('express')
const mongoose = require('mongoose')
const Chat = require('../schema/ChatSchema')
const User = require('../schema/UserSchema')
const router = express.Router()


router.get("/" , (req, res) => {

    let payload = {
        pageTitle : "Inbox",
        userLoggedIn : req.session.user , 
        userLoggedInJs : JSON.stringify(req.session.user)
    }
    res.status(200).render("inboxPage" , payload)
})


router.get("/new" , (req, res) => {
    let payload = {
        pageTitle : "New Message",
        userLoggedIn :  req.session.user , 
        userLoggedInJs : JSON.stringify(req.session.user)
    }
    res.status(200).render("newMessage" , payload)
})


/**
 * @description Access a chat or create if it does not exist
 */
router.get("/:chatId" , async (req, res) => {

    let userId = req.session.user._id ;
    let chatId = req.params.chatId ; 
    let isValid = mongoose.isValidObjectId(chatId)

     let payload = {
        pageTitle : "Chat",
        userLoggedIn :  req.session.user , 
        userLoggedInJs : JSON.stringify(req.session.user),
    }

    if(!isValid){
        payload.errorMessage = "Chat does not exist or you do not have permission to access it"
        return  res.status(200).render("chatPage" , payload)
    }

    // get the chat with the correct chatId and we make sure the connected user is in this chat
    let chat = await Chat.findOne({_id : chatId , users: {$elemMatch : {$eq : userId}}}).populate("users")
    
    if(chat == null){
        let userFound = await User.findById(chatId)
        if(userFound != null) {
            //get chat using userId
            chat = await getChatByUserId(userFound._id , userId)
        }
    }

    if(chat == null){
        payload.errorMessage = "Chat does not exist or you do not have permission to access it"
    }else{
        payload.chat = chat
    }

    res.status(200).render("chatPage" , payload)
})


/**
 * @description it will find a chat based on the filter or create it if it does not exist
 */
function getChatByUserId(userLoggedInId , otherUserId){
    return Chat.findOneAndUpdate({
        isGroupChat: false , 
        users: {
            $size: 2 , 
            $all : [
                {$elemMatch : {$eq : mongoose.Types.ObjectId(userLoggedInId)}},
                {$elemMatch : {$eq : mongoose.Types.ObjectId(otherUserId)}}
            ]
        }
    }, {
        // if we dont find it with the query above we will create ith
        $setOnInsert : {
            users : [userLoggedInId , otherUserId]
        }
    }, {
        new : true, // return the new updated document
        upsert : true // if you don't find it create it
    }).populate("users")
}





module.exports = router