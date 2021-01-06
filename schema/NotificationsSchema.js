const mongoose = require('mongoose')
const Schema = mongoose.Schema

const NotificationsSchema = new Schema({

    userTo : {type: Schema.Types.ObjectId , ref: "User"},
    userFrom : {type: Schema.Types.ObjectId , ref: "User"},
    notificationType : String,
    opened : {type:Boolean , default: false},
    entityId :Schema.Types.ObjectId
   
}, {timestamps : true})


/**
 * @description This method will be called from any where
 * Allow us to create notifications
 */
NotificationsSchema.statics.insertNotification = async (userTo , userFrom , notificationType , entityId) => {

    if(userTo == userFrom) return false ;
    let data = {
        userTo , 
        userFrom,
        notificationType ,
        entityId
    }
    // we remove all notifications that already exist to avoid spanning our database
  await  Notification.deleteOne(data).catch(error => console.log(error))
    // create the noti
    return Notification.create(data).catch(error => console.log(error))
}

const Notification = mongoose.model("Notification" , NotificationsSchema)

module.exports =  Notification