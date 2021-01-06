const express = require('express')
const router = express.Router()
const User = require('../schema/UserSchema');

/**
 * @description Profile page
 */
router.get("/" , (req, res) => {

    const payload = {
        pageTitle: req.session.user.username,
        userLoggedIn : req.session.user,
        userLoggedInJs : JSON.stringify(req.session.user),
        profileUser : req.session.user
    }

    res.status(200).render("profilePage" , payload)
});

/**
 * @description User page with his posts
 */
router.get("/:username" , async (req, res) => {
    const payload = await getPayload(req.params.username , req.session.user)
    res.status(200).render("profilePage" , payload)
})

/**
 * @description User page with his replies
 */
router.get("/:username/replies" , async (req, res) => {
    let  payload = await getPayload(req.params.username , req.session.user)
    payload.selectedTab = "replies"
    res.status(200).render("profilePage" , payload)
})


/**
 * @description Get a user Following
 */
router.get("/:username/following" , async (req, res) => {
    let  payload = await getPayload(req.params.username , req.session.user)
    payload.selectedTab = "following"
    res.status(200).render("follow" , payload)
})



/**
 * @description Get a user Followers
 */
router.get("/:username/followers" , async (req, res) => {
    let  payload = await getPayload(req.params.username , req.session.user)
    payload.selectedTab = "followers"
    res.status(200).render("follow" , payload)
})



/**
 * @description get users Info
 */
async function getPayload(username , userLoggedIn){

    //get the user by username
    let user = await User.findOne({username: username});

    if(!user){

        //get the user by id
        user = await User.findById(username)

        if(!user){
            return {
            pageTitle:"Page not found",
             userLoggedIn : userLoggedIn,
            userLoggedInJs : JSON.stringify(userLoggedIn),
        }
        }
    }

    return {
        pageTitle : user.username,
        userLoggedIn : userLoggedIn,
        userLoggedInJs : JSON.stringify(userLoggedIn),
        profileUser : user
    }

}










module.exports = router
