let connected = false

let socket = io("https://lta-social-media.herokuapp.com/")
// set up the userLoggedIn on the client
socket.emit("setup" , userLoggedIn)
// set the connecion to true
socket.on("connected" , () => connected = true)

//send the message in real time or send a notification when the user is not on the chat page
socket.on("message received" , (newMessage) => messageReceived(newMessage))

// socket event that make the notification badge refresh in Real Time
// this is when the server tell us that a notification is received
socket.on("notification received" , () => {
   $.get("/api/notifications/latest" , (notificationData) => {
       showNotificationPopup(notificationData)
       refreshNotificationsBadge()
   })
})

/**
 * @description Allow the client side to send notification and update in real time the notification badge of the userId when the server side tell us that a notification is received
 */
function emitNotification(userId) {
    if(userId == userLoggedIn._id) return
    socket.emit("notification received" , userId)
}

