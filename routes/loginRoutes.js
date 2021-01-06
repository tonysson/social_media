const express = require('express');
const bcrypt = require('bcryptjs')
const User = require('../schema/UserSchema');
const app = express();


const router = express.Router()

app.set('view engine', 'pug');
app.set('views', 'views');

router.get("/" ,  (req, res) => {
    res.status(200).render("login")
});

router.post("/", async (req, res) => {

     let payload = req.body
    if(req.body.logUsername && req.body.logPassword){

        const user = await User.findOne({
            $or : [
                {username : req.body.logUsername},
                {email: req.body.logUsername}
            ]
        } ).catch(error => {
            console.log(error);
            payload.errorMessage = "Wrong credentials"
            res.status(200).render('login', payload)
        })

        if(user){
            const result = await bcrypt.compare(req.body.logPassword , user.password)
            if(result){
                req.session.user = user;
                return res.redirect("/")
            }
        }
            payload.errorMessage = "Wrong credentials"
         return    res.status(200).render("login", payload)
    }

    payload.errorMessage = "Make sure each field has a valid value"
    res.status(200).render("login")

})

module.exports = router