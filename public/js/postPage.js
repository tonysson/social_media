$(document).ready(() => {
    // when the document is ready send request to our api to retrieve all the posts
    $.get(`/api/posts/${postId}` , results => {
        outPutPostsWithReplies(results , $(".postsContainer"))
    })
})


