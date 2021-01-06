$(document).ready(() => {
    // when the document is ready send request to our api to retrieve all the posts for users we are following
    $.get("/api/posts" , {followingOnly : true} ,  results => {
        outPutPosts(results , $(".postsContainer"))
    })
})


