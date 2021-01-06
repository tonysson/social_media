const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const colors = require('colors');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();
const { requireLogin } = require('./middlewares');
const app = express();

// to insure security when app deploys into heroku
app.enable('trust proxy');

//db connection
 require('./database');

//server
const port = process.env.PORT || 3001

const server = app.listen(port , () => {
    console.log(`App listenning on port ${port}`.green.bold)
});
const io = require("socket.io")(server , {pingTimeout : 60000})

//set up of view engine
app.set('view engine', 'pug');
app.set('views', 'views');


// implement CORS
app.use(cors());
app.options('*',cors())


//Middlewares
app.use(bodyParser.urlencoded({extended:false}));
//to use our public folder as static
app.use(express.static(path.join(__dirname, "public")))
//session
app.use(session({
    secret: process.env.SECRET_SESSION,
    resave:true,
    saveUninitialized:false
}))

//Routes
const loginRoute = require('./routes/loginRoutes')
const registerRoute = require('./routes/registerRoutes')
const logoutRoute = require('./routes/logout')
const postRoutes = require('./routes/postRoutes')
const profileRoutes = require('./routes/profileRoutes')
const uploadRoutes = require('./routes/uploadRoutes')
const searchRoutes = require('./routes/searchRoutes')
const messagesRoutes = require('./routes/messagesRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
// API ROUTES
const postsApiRoute = require('./routes/Api/posts')
const usersApiRoute = require('./routes/Api/users')
const chatsApiRoute = require('./routes/Api/chats')
const messagesApiRoute = require('./routes/Api/messages')
const notificationsApiRoute = require('./routes/Api/notifications')

app.use("/login" , loginRoute)
app.use("/register", registerRoute)
app.use("/logout", logoutRoute)
app.use("/posts" , requireLogin, postRoutes)
app.use("/profile" , requireLogin, profileRoutes)
app.use("/uploads" , uploadRoutes)
app.use("/search" , requireLogin, searchRoutes)
app.use("/messages", requireLogin , messagesRoutes);
app.use("/notifications", requireLogin , notificationsRoutes)

//api routes
app.use("/api/posts" , postsApiRoute)
app.use("/api/users" , usersApiRoute)
app.use("/api/chats" , chatsApiRoute)
app.use("/api/messages" , messagesApiRoute)
app.use("/api/notifications" , notificationsApiRoute)


app.get("/" , requireLogin, (req, res) => {

    const payload = {
        pageTitle:"Home",
        userLoggedIn: req.session.user,
        userLoggedInJs : JSON.stringify(req.session.user)
    }
    res.status(200).render("home" , payload)
})


// io 
io.on("connection",  (socket) => {

    socket.on("setup" , userData => {
        socket.join(userData._id)
        socket.emit("connected")
    })

    socket.on("join room" , room => socket.join(room))
    // only user in this room will get this notification that is why we use "in"
    socket.on("typing" , room => socket.in(room).emit("typing"))
    // stop typing
    socket.on("stop typing" , room => socket.in(room).emit("stop typing"))
    //send real time popup notification
    socket.on("notification received" , room => socket.in(room).emit("notification received"))

    // when a user send a new message , we want to send notification to all users in the chat and make the chat real time
    socket.on("new message" , newMessage => {

        //get the chat id
        let chat = newMessage.chat
        if(!chat.users) console.log("Chat.users is not events");
        //loop throw our chat users array and send notification to every single user in this chat
        chat.users.forEach(user => {
            // avoid the fact that we  send the notification to the person who send the message
            if(user._id === newMessage.sender._id) return
            //send the notification or the message in real time
            socket.in(user._id).emit("message received",newMessage)
        })
    })
})













