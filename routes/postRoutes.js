const express  = require('express');
const router = express.Router()


router.get("/:id", (req, res) => {

     const payload = {
        pageTitle:"View Post",
        postId : req.params.id , 
        userLoggedIn: req.session.user,
        userLoggedInJs : JSON.stringify(req.session.user)
    }

     res.status(200).render("postPage" , payload)
})



module.exports = router