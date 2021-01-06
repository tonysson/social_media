const express = require("express");
const Notification = require('../../schema/NotificationsSchema')
const router = express.Router()


/**
 * @description Get all our notifications exept the newMessage one
 */
router.get("/" , (req, res) => {
    let searchObj =  {
            userTo : req.session.user._id ,
             notificationType:{$ne: "newMessage"}
        }

         if(req.query.unreadOnly !== undefined && req.query.unreadOnly == "true") {
            searchObj.opened = false
        }

    Notification.find(searchObj)
    .populate("userTo")
    .populate("userFrom")
    .sort({createdAt : -1})
    .then(results => res.status(200).send(results))
    .catch(error => res.sendStatus(400))
})


/**
 * @description Mark one notification as read 
 */
router.put("/:id/opened" , (req, res) => {
    Notification.findByIdAndUpdate(req.params.id , {opened : true})
    .then(() => res.sendStatus(204))
    .catch(error => res.sendStatus(400))
})

/**
 * @description Mark all notifications as read 
 */
router.put("/opened" , (req, res) => {
    Notification.updateMany({userTo : req.session.user._id}, {opened : true})
    .then(() => res.sendStatus(204))
    .catch(error => res.sendStatus(400))
})

/**
 * @description Get the latest notification
 */
router.get("/latest" , (req, res) => {

    Notification.findOne(
        {
             userTo : req.session.user._id ,
        }
    )
    .populate("userTo")
    .populate("userFrom")
    .sort({createdAt : -1})
    .then(results => res.status(200).send(results))
    .catch(error => res.sendStatus(400))
})


module.exports = router