const express = require('express');
const app = express();
const router = express.Router();
const bcrypt = require('bcryptjs')
const User = require('../schema/UserSchema');

app.set('view engine', 'pug');
app.set('views', 'views');

router.get('/', (req, res) => {
    res.status(200).render('register')
})

router.post('/', async (req, res) => {
     
    const firstName = req.body.firstName.trim()
    const lastName = req.body.lastName.trim()
    const username = req.body.username.trim()
    const email = req.body.email.trim()
    const password = req.body.password

    let payload = req.body

    if(firstName && lastName && username && email && password){

     // checking existing username or passord   
            const user = await User.findOne({
                    $or:[
                    {username:username},
                    {email: email}
                    ]
            }).catch(error => {
                console.log(error);
                payload.errorMessage = "Something went wrong"
                res.status(200).render('register', payload)
            })

    // user or email found ?
            if(!user){
                const data = req.body
                data.password =  await bcrypt.hash(password , 10)
                User.create(data).then((user) => {
                   req.session.user = user
                  return res.redirect("/")
                })
            }else{
                if(email == user.email ){
                    payload.errorMessage = "Email already in use"
                }else{
                    payload.errorMessage = "Username already in use"
                }
                res.status(200).render('register', payload)
            }
    }else{
        payload.errorMessage = "Make sure each field have a valid value"
        res.status(200).render('register', payload)
    }
       
})

module.exports = router