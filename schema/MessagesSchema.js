
const mongoose  = require('mongoose');

const Schema = mongoose.Schema

const messagesSchema = new Schema({

    content : {type:String , trim:true},
    sender : {type:Schema.Types.ObjectId , ref: "User"},
    chat : {type:Schema.Types.ObjectId , ref: "Chat"},
    postedBy : {type:Schema.Types.ObjectId , ref: "User"},
    readBy :[{type:Schema.Types.ObjectId , ref: "User"}]

}, {timestamps: true})

const Message = mongoose.model("Message" , messagesSchema)

module.exports = Message