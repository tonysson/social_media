const express = require('express')
const router = express.Router();
const Chat = require("../../schema/ChatSchema");
const Message = require('../../schema/MessagesSchema');
const User = require('../../schema/UserSchema');


 /**
  * @description Create a chat
  * users is the data we send from our client side
  * we have to insure that it is a json object
  */
router.post("/" , (req, res) => {

    if(!req.body.users){
        console.log("Users params not send from the client");
        return res.sendStatus(400);
    }

    let users = JSON.parse(req.body.users)

     if(users.length == 0){
        console.log("Users array is empty");
        return res.sendStatus(400);
    }

    // put ourself in the users array
    users.push(req.session.user)

    //Create the chat
    let chatData = {
        users: users,
        isGroupChat : true
    }

    Chat.create(chatData).then(results => {
       return  res.status(201).send(results)
    }).catch(error => {
        console.log(error);
        return res.sendStatus(400)
    })

})

/**
 * @description Get all our chats
 * we have to get all the chat we are in so we use $elemMatch operator
 */
router.get("/" , async (req, res) => {

    Chat.find({users : {$elemMatch : { $eq : req.session.user._id}}})
    .populate("users")
    .populate("latestMessage")
    .sort({updatedAt : -1})
    .then( async results => {

        if(req.query.unreadOnly !== undefined && req.query.unreadOnly == "true") {
            results = results.filter(r => {
                if(r.latestMessage && r.latestMessage.readBy){
                     return  !r.latestMessage.readBy.includes(req.session.user._id)
                }
            });
        }

        results = await User.populate(results, { path: "latestMessage.sender" });
        res.status(200).send(results)
    }).catch(error => {
         console.log(error);
        return res.sendStatus(400)
    })
})

/**
 * @description update the chatName in the chat model
 */
router.put("/:chatId" ,(req, res) => {
    
        Chat.findByIdAndUpdate(req.params.chatId , req.body).then(result => {
          return  res.sendStatus(204)
        }).catch(error => {
            console.log(error);
            return res.sendStatus(400)
        })
})

/**
 * @description get a single chat
 */
router.get("/:chatId" , async (req, res) => {

    Chat.findOne({_id: req.params.chatId , users : {$elemMatch : { $eq : req.session.user._id}}})
    .populate("users")
    .then(results => {
        return res.status(200).send(results)
    }).catch(error => {
         console.log(error);
        return res.sendStatus(400)
    })
})

/**
 * @description Get all messages in a single chat 
 */
router.get("/:chatId/messages" , async (req, res) => {

    Message.find({chat: req.params.chatId})
    .populate("sender")
    .then(results => {
        return res.status(200).send(results)
    }).catch(error => {
         console.log(error);
        return res.sendStatus(400)
    })
})



/**
 * @description Marked all messages as Read
 * $addToset mongoDb function that take a value and add it to an array (set) , 
 * so in our case we take the loggedIn user and we add it to the readBy array 
 */
router.put("/:chatId/messages/markAsRead" , async (req, res) => {
    Message.updateMany(
        {chat: req.params.chatId} , 
        {$addToSet : {readBy : req.session.user._id} }
    ).then(() => res.sendStatus(204)).catch(error => {
         console.log(error);
        return res.sendStatus(400)
    })
})









module.exports = router