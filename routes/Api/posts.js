const express = require('express');
const Post = require('../../schema/PostSchema');
const User = require('../../schema/UserSchema');
const Notification = require('../../schema/NotificationsSchema')
const router = express.Router();


/**
  * @description Create a post
  */

router.post("/" , async (req, res) => {


    if(!req.body.content){
        console.log("Content param not sent with request");
        return res.sendStatus(400)
    }

    //postContent
    let postData = {
        content : req.body.content,
        postedBy : req.session.user
    }

    if(req.body.replyTo){
        postData.replyTo = req.body.replyTo
    }

    Post.create(postData).then( async (newPost) => {
        newPost = await User.populate(newPost , {path: "postedBy"})
        newPost = await Post.populate(newPost , {path: "replyTo"})

           // Send notification
            if(newPost.replyTo !== undefined){
            await Notification.insertNotification(
                newPost.replyTo.postedBy ,
                 req.session.user._id  , 
                "reply",
                newPost._id 
            )
            }
        res.status(201).send(newPost)
    }).catch(error => {
        console.log(error);
        res.sendStatus(400)
    })

})

 /**
  * @description Get all the posts
  */
router.get("/" , async (req, res) => {

    //allow us to filter based on the query
    let searchObj = req.query


   // Reply logic filter
    if(searchObj.isReply !== undefined){
        let isReply = searchObj.isReply == "true"
        searchObj.replyTo = { $exists: isReply} // return isReply if  searchObj.replyTo exist or not
        delete searchObj.isReply
    }

    //Search logic filter
    if(searchObj.search !== undefined){
        searchObj.content = {$regex : searchObj.search , $options: "i"}
        delete searchObj.search
    }

    // following logic filter
    if(searchObj.followingOnly !== undefined){
        let followingOnly = searchObj.followingOnly == "true"
        if(followingOnly){
            
              let objectIds = []

              if(!req.session.user.following){
                    req.session.user.following = []
              }

              req.session.user.following.forEach(user => {
                       objectIds.push(user)
              })
               objectIds.push(req.session.user._id)
              searchObj.postedBy = {$in : objectIds} // find the posts where the postedBy is in objectIds array
        }

        delete searchObj.followingOnly
    }

   const results = await  getPosts(searchObj).catch(error => console.log(error))
   return res.status(200).send(results)

})

/**
  * @description Get one post based on it id
  */
router.get("/:id" ,async (req, res) => {
    const postId = req.params.id
    let postData = await  getPosts({ _id : postId})
    postData = postData[0]

    let results = {
        postData 
    }

    // we get all the reply message to this specific post
    if(postData.replyTo !== undefined){
        results.replyTo = postData.replyTo
    }
    results.replies = await getPosts({replyTo : postId})

    // console.log(`results.postData:`, results.postData );
    // console.log(`results.replyTo:`, results.replyTo );
    // console.log(`results.replies:`, results.replies );

    // response
    return res.status(200).send(results)
})


/**
  * @description Delete a post
  */
 router.delete("/:id" , (req, res) => {
    Post.findByIdAndDelete(req.params.id).then(() => {
        res.sendStatus(202)
    }).catch(error => {
        console.log(error);
        res.sendStatus(400)
    })
 })



/**
  * @description Like a post
  */
router.put("/:id/like" , async (req, res) => {
    // post id in the url
    const postId = req.params.id
    // get the connected user
    const userId = req.session.user._id
    //verify if the user has already liked the post
    const isLiked = req.session.user.likes && req.session.user.likes.includes(postId);

    //option to pass  if the post is liked or not to update the likes 
    const option = isLiked ? "$pull" : "$addToSet" ;

    //update user likes array
       req.session.user = await User.findByIdAndUpdate( userId , { [option] : { likes :  postId}} , {new : true}).catch(error => {
                  console.log(error);
                  res.sendStatus(400)
         })

    // update post likes array
    const post = await Post.findByIdAndUpdate(postId , { [option] : {likes : userId}} , {new : true}).catch(error => {
         console.log(error);
        res.sendStatus(400);
    })

     // Send notification
    if(!isLiked){
    await Notification.insertNotification(
        post.postedBy ,
        userId  ,
        "postLike",
        post._id 
    )
    }

    res.status(200).send(post)
});


/**
  * @description Retweet a post
  */
router.post("/:id/retweet" , async (req, res) => {

    // post id in the url
    const postId = req.params.id
    // get the connected user
    const userId = req.session.user._id
    
    //Try and delete retweet
    // if we can delete it so we are unRetweeting the post 
    //if we can not delete it ie it does not exist so nothing happen 
    const deletedPost = await Post.findOneAndDelete({postedBy : userId , retweetData : postId}).catch(error =>{
         console.log(error);
         res.sendStatus(400);
    })

    //option to pass  if the post is retweeted or not and   update it instead
    const option = deletedPost != null ? "$pull" : "$addToSet" ;

    let repost = deletedPost

    if(repost == null){
        repost = await Post.create({postedBy : userId , retweetData : postId}).catch(error => {
             console.log(error);
              res.sendStatus(400);
        })
    }

    //update user retweets array
       req.session.user = await User.findByIdAndUpdate( userId , { [option] : { retweets :  repost._id}} , {new : true}).catch(error => {
                  console.log(error);
                  res.sendStatus(400)
         })

    // update post retweetUser array
    const post = await Post.findByIdAndUpdate(postId , { [option] : {retweetUsers : userId}} , {new : true}).catch(error => {
         console.log(error);
         res.sendStatus(400);
    })

    // Send notification
    if(!deletedPost){
    await Notification.insertNotification(
        post.postedBy, 
        userId, 
        "retweet",
        post._id
    )
    }

    res.status(200).send(post)
});



/**
  * @description Pin a post
  */
 router.put("/:id" , async(req, res) => {

    // we make all the post posted By a user NOT PINNED
    if(req.body.pinned !== undefined){
        await Post.updateMany({postedBy: req.session.user} , {pinned: false}).catch(error => {
            console.log(error);
            res.sendStatus(400)
        })
    }

    Post.findByIdAndUpdate(req.params.id , req.body).then(() => {
        res.sendStatus(204)
    }).catch(error => {
        console.log(error);
        res.sendStatus(400)
    })
 })

/**
 * @description ReUse function to get all posts or one post based on the filter
 */
const getPosts = async (filter) => {

  let results =  await  Post.find(filter)
        .populate("postedBy")
        .populate("retweetData")
        .populate("replyTo")
        .sort({"createdAt" : -1})
        .catch(error => {
            console.log(error);
        })
      
      results =  await User.populate(results , {path : "replyTo.postedBy"})
      return  results = await User.populate(results , {path : "retweetData.postedBy"})
}


module.exports = router