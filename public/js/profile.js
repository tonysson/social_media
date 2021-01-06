$(document).ready(() => {

    if(selectedTab === "replies"){
        loadReplies()
    }else{
         loadPost()
    }
   
})


function loadPost() {

     $.get("/api/posts", {postedBy: profileUserId , pinned : true} , results => {
        outPutPinnedPost(results , $(".pinnedPostContainer"))
    })

     $.get("/api/posts", {postedBy: profileUserId , isReply : false} , results => {
        outPutPosts(results , $(".postsContainer"))
    })
}

function loadReplies() {
     $.get("/api/posts", {postedBy: profileUserId , isReply : true} , results => {
        outPutPosts(results , $(".postsContainer"))
    })
}



//Output pinned post on the frontend
function outPutPinnedPost(results , container){

    // hide the pinnedContainer if there is no pinned post
    if(results.length == 0){
        container.hide();
        return
    }

    // we clear all the old content
    container.html("");

    //we loop throw the array of our results and  we pull out the content
    results.forEach(result => {
        const html = createPostHtml(result)
        container.append(html)
    })

}
