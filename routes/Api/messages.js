const express = require("express");
const Chat = require("../../schema/ChatSchema");
const Message = require("../../schema/MessagesSchema");
const User = require("../../schema/UserSchema");
const Notification = require('../../schema/NotificationsSchema')
const router = express.Router()

/**
 * @description Create a post
 * we can not use populate on create() method directly , instead we await the result await we populate the field
 */
router.post("/" , async (req, res) => {

    let newMessage = {
        sender : req.session.user._id ,
        content : req.body.content,
        chat : req.body.chatId
    }

     if(!req.body.content || !req.body.chatId){
        console.log("Invalid data passed");
        return res.sendStatus(400);
    }

    Message.create(newMessage).then(async  message => {
        message = await message.populate("sender").execPopulate()
        message = await message.populate("chat").execPopulate()
        message = await User.populate(message , {path : "chat.users"})
   let chat = await Chat.findByIdAndUpdate(req.body.chatId , {latestMessage : message}).catch(error => console.log(error))

   // send notifications to all users in a chat
   insertMessageNotifications(chat , message)


        return res.status(201).send(message)

    }).catch(error => {
        console.log(error);
        return res.sendStatus(400)
    })
    
})

function insertMessageNotifications(chat , message){
    chat.users.forEach (userId => {
        if(userId == message.sender._id.toString()) return
          Notification.insertNotification(
            userId ,
            message.sender._id, 
            "newMessage",
            message.chat._id
        )
    })
}


module.exports = router