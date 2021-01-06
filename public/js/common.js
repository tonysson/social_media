//Globals
let cropper;
let timer;
let selectedUsers = []

$(document).ready(() => {
    refreshMessagesBadge()
    refreshNotificationsBadge()
})



// when typing in the text area to send  post  or replying to a post
$("#postTextarea , #replyPostTextarea").keyup(event => {

    // get the textarea
    const textbox = $(event.target)
    // get it value
    const value = textbox.val().trim()

    //check if it is the modal we target or not
    const isModal = textbox.parents(".modal").length == 1
    // get the submi button
    const buttonSubmit = isModal ? $("#submitReplyButton") :  $("#submitPostButton")

    if(buttonSubmit.length === 0 ){
        return alert("No submit button found")
    }

    // active the disabled prop when there is no value in the textarea
    if(value == ""){
        buttonSubmit.prop("disabled", true)
        return;
    }

    // desactive the disabled prop when user type smthing
     buttonSubmit.prop("disabled", false)
});

// Create a post or reply to a post
$("#submitPostButton , #submitReplyButton").click((event) => {
    // get the button
    const button = $(event.target);

    //check if it is the modal we target or not
    const isModal = button.parents(".modal").length == 1
    // get the textarea
    const textbox = isModal ? $("#replyPostTextarea") : $("#postTextarea")
    // get the value of the textarea as an object
    let data = {
        content : textbox.val()
    }

    // get the id of the post
    if(isModal){
        // get the id of the post throw the button , we bind it to the button when we load the specific post in the modal
       const id = button.data().id ;
       if(id == null) return console.log("No post found");
       data.replyTo =  id
    }
    // send ajax request to our api
    $.post("/api/posts", data , (postData) => {
        // reload the page if we reply to a post
        if(postData.replyTo){
            emitNotification(postData.replyTo.postedBy)
            location.reload()
        }else{
             // create the html 
                const html = createPostHtml(postData)
             // we prepend our post in the postContainer
                $(".postsContainer").prepend(html)
            // we clear the textarea
                textbox.val("")
             //we disable the submit button
                button.prop("disabled" , true)
        }
    })
})

// load the post into the modal in order to reply to it
$("#replyModal").on("show.bs.modal" , (event) => {

    // get the button
    const button = $(event.relatedTarget);
    
    //get the post id
    const postId = getPostIdFromElement(button);

    //bind the post id to the reply button
    $("#submitReplyButton").data("id" , postId)

    //send request to our api to get the specific post and show it in the modal
    $.get(`/api/posts/${postId}`, (results) => {
        outPutPosts(results.postData , $("#originalPostContainer"))
    })
   
});

//Clear the content of the modal when we close it
$("#replyModal").on("hidden.bs.modal" , (event) => {
    $("#originalPostContainer").html("")
})

//Like a post logic
$(document).on("click" , ".likeButton", (event) => {

    // get the button
    const button = $(event.target);

    //get the post id
    const postId = getPostIdFromElement(button);
    if(postId === undefined) return ;

    $.ajax({
        url: `/api/posts/${postId}/like`,
        type: "PUT",
        success : (postData) => {

            // update the likes array length
            button.find("span").text(postData.likes.length || "")
            // if the post likes array contain the user id : if the user has already liked the post
            if(postData.likes.includes(userLoggedIn._id)) {
                button.addClass("active");
                emitNotification(postData.postedBy)
            }
            else {
                button.removeClass("active");
            }
        }
    })

});

//Retweet logic
$(document).on("click" , ".retweetButton", (event) => {

    // get the button
    const button = $(event.target);

    //get the post id
    const postId = getPostIdFromElement(button);
    if(postId === undefined) return ;

    //send request to our api
    $.ajax({
        url: `/api/posts/${postId}/retweet`,
        type: "POST",
        success : (postData) => {

             button.find("span").text(postData.retweetUsers.length || "")

            if(postData.retweetUsers.includes(userLoggedIn._id)) {
                button.addClass("active");
                 emitNotification(postData.postedBy)
            }
            else {
                button.removeClass("active");
            }
        }
    })

});

// Show a single post
$(document).on("click" , ".post", (event) => {


    const element = $(event.target);
    const postId = getPostIdFromElement(element)

    if(postId !== undefined && !element.is("button")){
        window.location.href = `/posts/${postId}`
    }

});

// bind the post id to button in order to send request to our api and delete the post
$("#deletePostModal").on("show.bs.modal" , (event) => {

    // get the button
    const button = $(event.relatedTarget);
    
    //get the post id
    const postId = getPostIdFromElement(button);

    //bind the post id to the delete button
    $("#deletePostButton").data("id" , postId)
});

// bind the post id to button in order to send request to our api and Pin  the post
$("#confirmPinModal").on("show.bs.modal" , (event) => {

    // get the button
    const button = $(event.relatedTarget);
    
    //get the post id
    const postId = getPostIdFromElement(button);

    //bind the post id to the pin button
    $("#pinPostButton").data("id" , postId)
});

// bind the post id to the button in order to unpinned a post
$("#unpinnedModal").on("show.bs.modal" , (event) => {

    // get the button
    const button = $(event.relatedTarget);
    
    //get the post id
    const postId = getPostIdFromElement(button);

    //bind the post id to the pin button
    $("#unpinPostButton").data("id" , postId)
});

// click event on the deleteModal button and ajax request to delete the post
 $("#deletePostButton").click(event => {
    const postId = $(event.target).data("id")

$.ajax({
        url: `/api/posts/${postId}`,
        type:"DELETE" ,
        success: (data , status , xhr) => {
             if(xhr.status != 202) {
                alert("could not delete post");
                return;
            }
            location.reload()
        }
    })
 })

 // click event on the PinModal button and ajax request to pin the post
 $("#pinPostButton").click(event => {
    const postId = $(event.target).data("id")

$.ajax({
        url: `/api/posts/${postId}`,
        type:"PUT" ,
        data : {pinned : true} , 
        success: (data , status , xhr) => {
             if(xhr.status != 204) {
                alert("could not PIN the post");
                return;
            }
            location.reload()
        }
    })
 })

 // click event on the unpinned Button and ajax request #unpinPostButton
 $("#unpinPostButton").click(event => {
    const postId = $(event.target).data("id")

$.ajax({
        url: `/api/posts/${postId}`,
        type:"PUT" ,
        data : {pinned : false} , 
        success: (data , status , xhr) => {
             if(xhr.status != 204) {
                alert("could not PIN the post");
                return;
            }
            location.reload()
        }
    })
 })


 //Image Upload preview
 $("#filePhoto").change(function() {
    if(this.files && this.files[0]){
        let reader = new FileReader()
        reader.onload = (e) => {

            let image = document.getElementById("imagePreview")
            image.src = e.target.result
            // $("imagePreview").attr("src", e.target.result ) avec jquery

            //cropperJs
            if(cropper !== undefined) {
                cropper.destroy()
            }

            cropper = new Cropper(image , {
                aspectRatio : 1 / 1 , 
                background : false
            })
        }

        reader.readAsDataURL(this.files[0])
    }

 })

 // Image upload 
 $("#imageUploadButton").click(() => {

    let canvas = cropper.getCroppedCanvas()

    if(!canvas){
        alert("Could not upload image.Make sure it is an image")
        return
    }

    canvas.toBlob((blob) => {
        let formData = new FormData()
        formData.append("croppedImage" , blob)

        $.ajax({
            url: "/api/users/profilePicture",
            type: "POST",
            data: formData,
            processData : false, // prevent jquery not convert the formData into string
            contentType: false, // prevent jquery not to add contentType header
            success : () => location.reload()
        })
    
    })

 })

//Cover Image upload Preview
 $("#coverPhoto").change(function() {
    if(this.files && this.files[0]){
        let reader = new FileReader()
        reader.onload = (e) => {

            let image = document.getElementById("coverPreview")
            image.src = e.target.result
            //cropperJs
            if(cropper !== undefined) {
                cropper.destroy()
            }

            cropper = new Cropper(image , {
                aspectRatio : 16 / 9 , 
                background : false
            })
        }

        reader.readAsDataURL(this.files[0])
    }

 })

 //Cover Image Upload
$("#coverUploadButton").click(() => {

    let canvas = cropper.getCroppedCanvas()

    if(!canvas){
        alert("Could not upload image.Make sure it is an image")
        return
    }

    canvas.toBlob((blob) => {
        let formData = new FormData()
        formData.append("croppedImage" , blob)

        $.ajax({
            url: "/api/users/coverPhoto",
            type: "POST",
            data: formData,
            processData : false, // prevent jquery not convert the formData into string
            contentType: false, // prevent jquery not to add contentType header
            success : () => location.reload()
        })
    
    })

 })

//Follow and unfollow logic
$(document).on("click" , ".followButton" , (event) => {

    const button = $(event.target)
    const userId = button.data().user
    
     //send request to our api
    $.ajax({
        url: `/api/users/${userId}/follow`,
        type: "PUT",
        success : (data , status , xhr) => {
            if(xhr.status == 404) return ;

            let difference = 1 
            if(data.following && data.following.includes(userId)){
                    button.addClass("following")
                    button.text("Following")
                    emitNotification(userId)
            }else{
                button.removeClass("following")
                button.text("Follow")
                difference = -1
            }

            let followersLabel = $("#followersValue")
            if(followersLabel.length  != 0){
              let followersText =   followersLabel.text()
                followersText = parseInt(followersText)
                followersLabel.text(followersText + difference)
            }
        }
    })

})

// When typing in the input on newMessage page to search for users
$("#userSearchTextBox").keydown((event) => {
    
    clearTimeout(timer);

    let textbox = $(event.target)
    let value = textbox.val();

    if( value == "" && (event.which ==8 || event.keyCode == 8)){
        //remove users from selection
        selectedUsers.pop()
        updateSelectedUsersHtml()
        $(".resultsContainer").html("");

        if(selectedUsers.length == 0){
            $("#createChatButton").prop("disabled", true)
        }
        return;
    }

    timer = setTimeout(() => {
        value = textbox.val().trim()
        if(value == ""){
            $(".resultsContainer").html("")
        }else{
            searchUsers(value)
        }
    }, 1000)
})

// Create a chat 
$("#createChatButton").click(() => {
    let data = JSON.stringify(selectedUsers);
    $.post("/api/chats" , {users: data} , chat => {
        if(!chat && !chat._id) return console.log("No chat found");
        window.location.href = `/messages/${chat._id}`
    })
})

//click handler on every notification to mark it as opened
$(document).on("click" , ".notification.active", (event) => {
    // get the element
    let container = $(event.target);
    //get the notfication id
    let notificationId = container.data().id
    // get the attr
    let href = container.attr("href");
    // not go the link yet
    event.preventDefault()
    // what will hapenned after we marked it as opened 
    let callback = () => window.location = href
    markedNotificationAsOpened(notificationId , callback)
})

// Ajax request to search for users
function searchUsers(searchTerm){
    $.get("/api/users" , {search: searchTerm} , results => {
        outPutSelectableUsers(results , $(".resultsContainer"))
    })
}

function outPutSelectableUsers(results , container) {

    container.html("")

    results.forEach(result => {

         if(result._id == userLoggedIn._id || selectedUsers.some(u => u._id == result._id)){
           return;
         }
        const html = createUserHtml(result , false)
        let element = $(html)
        element.click(() => userSelected(result))
        container.append(element)
    })

    if(results.length === 0) {
        container.append("<span class='noResults'>No User found</span>")
    }
}

// selected the searched user and put it in the  selectedUsers array
function userSelected(user){
   selectedUsers.push(user)
   updateSelectedUsersHtml()
   $("#userSearchTextBox").val("").focus()
   $(".resultsContainer").html("");
   $("#createChatButton").prop("disabled" , false)
}

// prepend the seletdUsers array into the html
function updateSelectedUsersHtml(){
    let elements = []
    selectedUsers.forEach((user) => {
        let name = user.firstName + " " + user.lastName
        let userElment = $(`<span class='selectedUser'>${name}</span>`)
        elements.push(userElment)
    })

    $(".selectedUser").remove()
    $("#selectedUsers").prepend(elements)
}

//get the post Id from element
// There is two scenarios:
// 1- Is when the user clicked  on the root element ie the post itself (.post)
// 2 - Is when the user clicked the chlid element (heart , retweet ,button)
function getPostIdFromElement(element) {
    
    //get the root element
    const isRoot = element.hasClass("post");
    // get the root element based on what the user clicked
    //closest is a jquery function that goes throw the tree to find the parent element
    const rootElement = isRoot ? element : element.closest(".post")
    // get the post id
    // we do this because we set this (data-id='${postData._id}') to the div.post
    const postId = rootElement.data().id

    if(postId === undefined){
        return console.log("post id  is undefined");
    }

    return postId
}

// Create a post  html
function createPostHtml(postData , largeFont = false){

    // if no postData? 
    if(!postData) return console.log("No post data found");

    // verify if the post is retweet or not;
    let isRetweet = postData.retweetData !== undefined;

    // find the user who retweet it
    const retweetedBy = isRetweet ? postData.postedBy.username : null 

    // asset the postData to isRetweet or to postData
    postData = isRetweet ? postData.retweetData : postData

    const displayName =postData.postedBy.firstName
    const timesTamp = timeDifference(new Date() , new Date(postData.createdAt))
    //active the color on like button when the page is loaded
    const likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active" : "" ;
     //active the color on retweet button when the page is loaded
    const retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? "active" : ""
    const largeFontClass = largeFont ? "largeFont" : ""

    let retweetText = ""

    if(isRetweet){
        retweetText = `
           <span>
            <i class="fas fa-retweet"></i>
            Retweeted by <a href = "/profile/${retweetedBy}" >@${retweetedBy} </a>
           </span>
        `
    }

    let replyFlag = ""
    if(postData.replyTo && postData.replyTo._id){
        if(!postData.replyTo._id) return console.log("");

        const replyToUsername= postData.replyTo.postedBy.username

         replyFlag = `
           <div class='replyFlag'>
            Replying to <a href = "/profile/${replyToUsername}" >@${replyToUsername} </a>
           </div>
        `
    }

    // create the delete button
    let buttons = ""
    let pinnedPostText = ""

    if(postData.postedBy._id == userLoggedIn._id){

        let pinnedClass = ""
        let dataTarget = "#confirmPinModal";

        if(postData.pinned === true) {
            pinnedClass = "active"
            dataTarget = "#unpinnedModal"
            pinnedPostText = "<i class='fas fa-thumbtack'></i> <span>Pinned post</span>"
        }


        buttons = `
          <button class="pinnedButton ${pinnedClass}" data-id="${postData._id}" data-toggle="modal" data-target='${dataTarget}'>
             <i class="fas fa-thumbtack"></i>
          </button>

          <button class="deleteButton" data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal">
          <i class="fas fa-times"></i>
          </button>
        `
    }
    
    return `
       <div class="post ${largeFontClass}" data-id='${postData._id}'>
            <div class="postActionContainer">
                ${retweetText}
            </div>
            <div class="mainContentContainer">
                 <div class="userImageContainer">
                    <img src="${postData.postedBy.profilePic}" alt="${postData.postedBy.username}" />
                </div>
                <div class="postContentContainer">
                    <div class="pinnedPostText">
                        ${pinnedPostText}
                    </div>
                    <div class="header">
                        <a href="/profile/${postData.postedBy.username}" class="displayName">
                            ${displayName}
                        </a>
                        <span class="username">
                            @${postData.postedBy.username}
                        </span>
                        <span class="date">
                            ${timesTamp}
                        </span>
                        ${buttons}
                    </div>
                    ${replyFlag}
                    <div class="postBody">
                        <span>${postData.content}</span>
                    </div>
                    <div class="postFooter">
                        <div class="postButtonContainer">
                            <button data-toggle='modal' data-target='#replyModal' >
                                <i class="far fa-comment"></i>
                            </button>
                        </div>
                        <div class="postButtonContainer green ">
                            <button  class="retweetButton ${retweetButtonActiveClass} "  >
                                <i class="fas fa-retweet"></i>
                                 <span>${postData.retweetUsers.length || ""}</span>
                            </button>
                        </div>
                       <div class='postButtonContainer red'>
                                <button class='likeButton ${likeButtonActiveClass } '>
                                    <i class='far fa-heart'></i>
                                    <span>${postData.likes.length || ""}</span>
                                </button>
                        </div>
                    </div>
                </div>
            </div>
       </div>
    `
}

//Outputting post on the frontend
function outPutPosts(results , container){
    // we clear all the old content
    container.html("");

    //transform results into array
    if(!Array.isArray(results)){
        results = [results]
    }
    //we loop throw the array of our results and  we pull out the content
    results.forEach(result => {
        const html = createPostHtml(result)
        container.append(html)
    })

    if(results.length == 0) {
        container.append("<span class='noResult'>No results found</span>")
    }
}

// outputtin post with replies
function outPutPostsWithReplies(results,  container){

     // we clear all the old content
    container.html("");

    // we load all the results.replyTo
    if(results.replyTo !== undefined && results.replyTo._id !== undefined){
          const html = createPostHtml(results.replyTo)
          container.append(html)
    }

    // we load the main Post
        const mainPostHtml = createPostHtml(results.postData , true)
        container.append(mainPostHtml)

    //we loop throw the array of our results.replies and  we pull out the content
    results.replies.forEach(result => {
        const html = createPostHtml(result)
        container.append(html)
    })

    
}

//Formatted date 
function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        if(elapsed/1000 < 30) return "Just now";
        
        return Math.round(elapsed/1000) + ' seconds ago';   
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';   
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';   
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' days ago';   
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + ' months ago';   
    }

    else {
        return Math.round(elapsed/msPerYear ) + ' years ago';   
    }
}


function outPutUsers(results , container) {

    container.html("")

    results.forEach(result => {
        const html = createUserHtml(result , true)
        container.append(html)
    })

    if(results.length === 0) {
        container.append("<span class='noResults'>No User found</span>")
    }
}

function createUserHtml (userData , showFollowButton){

    let name = userData.firstName + " " + userData.lastName

    let isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id)

    let text = isFollowing ? "Following" : "Follow"
    let buttonClass = isFollowing ? "followButton following" : "followButton"

    let followButton = ""

    if(showFollowButton && userLoggedIn._id != userData._id) {
        followButton = `
          <div className="followButtonContainer">
            <button class='${buttonClass}' data-user='${userData._id}'>
                ${text}
            </button>
          </div>
        `
    }
    
    return `

        <div class="user">
            <div class="userImageContainer">
                <img src='${userData.profilePic}'/>
            </div>
            <div class="userDetailsContainer">
                <div class="header">
                    <a href='/profile/${userData.username}'>
                        ${name}
                    </a>
                    <span class="username">
                        @${userData.username}
                    </span>
                </div>
            </div>
            ${followButton}
        </div>
    
    `
}

// get the chat Name
function getChatName(chatData){
    let chatName = chatData.chatName ; 
    if(!chatName){
        let otherChatUsers = getOtherChatUsers(chatData.users)
        let namesArray = otherChatUsers.map(user => user.firstName + " " + user.lastName )
        chatName = namesArray.join(", ")
    }

    return chatName
}

function getOtherChatUsers(users) {
    if(users.length == 1) {
        return users
    }
    return users.filter( user =>  user._id !== userLoggedIn._id)
}

// notification when the message is received 
function messageReceived(newMessage) {
    // we are checking for data attribute on the chatContainer 
    // in order word we are checking if we are in the right chat page
    if($(`[data-room="${newMessage.chat._id}"]`).length == 0){
        showMessagePopup(newMessage)
    }else{
        addChatMessageHtml(newMessage)
    }
    refreshMessagesBadge()
}


/**
 * @description mark the notification as read 
 * when we spicify the parameters that will maked a single notification as read
 * ottherwise all the notification will be marked as read
 */
function markedNotificationAsOpened(notificationId= null , callback= null) {

    if(callback == null) callback = () => location.reload()

    let url = notificationId != null ? `/api/notifications/${notificationId}/opened` : `/api/notifications/opened`

    $.ajax({
        url : url,
        type: "PUT", 
        success : () => callback()
    })
}

/**
 * @description Get the number of unRead message
 */
function refreshMessagesBadge() {
    $.get("/api/chats" , {unreadOnly: true} , (data) => {
        let numResults = data.length ;
        if(numResults > 0){
            $("#messageBadge").text(numResults).addClass("active")
        }else{
             $("#messageBadge").text("").removeClass("active")
        }
    })
}



/**
 * @description Get the number of notifcations
 */
function refreshNotificationsBadge() {
    $.get("/api/notifications" , {unreadOnly: true} , (data) => {
        let numResults = data.length ;
        if(numResults > 0){
            $("#notificationBadge").text(numResults).addClass("active")
        }else{
             $("#notificationBadge").text("").removeClass("active")
        }
    })
}

function outPutNotificationList(notifications , container) {
    if(notifications.length == 0){
        return container.append("<span class='noResults'>Nothing to show</span>")
    }
    notifications.forEach(notification => {
        let html  =  createNotificationHtml(notification)
        container.append(html)
    })
}

function createNotificationHtml(notification){

    let userFrom = notification.userFrom
    let text = getNotificationText(notification)
    let url = getNotificationLink(notification)
    let className = notification.opened ? "" : "active"

    return `
      <a href='${url}' class='resultListItem notification ${className}' data-id='${notification._id}'>
        <div class="resultsImageContainer">
            <img src='${userFrom.profilePic}' alt='${userFrom.firstName}'/>
        </div>
         <div class="resultsDetailsContainer ellipsis">
               <span class="ellipsis">
                    ${text}
               </span>
            </div>
      </a>
    
    `
}

function getNotificationText(notification){

    let userFrom = notification.userFrom

    if(!userFrom.firstName || !userFrom.lastName) return alert("User from data not populated")
 
    let userFromName = `${userFrom.firstName} ${userFrom.lastName}`
    let text;

    if(notification.notificationType == "retweet"){
        text = `${userFromName} retweeted one of your posts`
    }else if(notification.notificationType == "postLike"){
         text = `${userFromName} liked one of your posts`
    }else if(notification.notificationType == "reply"){
         text = `${userFromName} replied to one of your posts`
    }else if(notification.notificationType == "follow"){
         text = `${userFromName} followed you `
    }

    return `
      <span class="ellipsis">
        ${text}
      </span>
    `
}


function getNotificationLink(notification){
    let hrf = "#"
    if(notification.notificationType == "retweet" ||
       notification.notificationType == "postLike" ||
       notification.notificationType == "reply"){
        hrf = `/posts/${notification.entityId}`
    }else if(notification.notificationType == "follow"){
         hrf = `/profile/${notification.entityId}`
    }

    return hrf
}

/**
 * @description Allow us to send a  popup  to the user when he gets a notifictaion
 */
function showNotificationPopup(data) {
    let html = createNotificationHtml(data)
    let element = $(html)
    element.hide().prependTo("#notificationList").slideDown("fast")
    setTimeout(() => element.fadeOut(400), 5000)
}

/**
 * @description Allow us to send a  popup  to the user when he gets a message
 */
function showMessagePopup(data) {
    if(!data.chat.latestMessage._id){
        data.chat.latestMessage = data
    }
    let html = createChatHtml(data.chat)
    let element = $(html)
    element.hide().prependTo("#notificationList").slideDown("fast")
    setTimeout(() => element.fadeOut(400), 5000)
}

function createChatHtml(chatData){

    let chatName = getChatName(chatData)
    let image = getChatImageElement(chatData)
    let latestMessage = getLatestMessage(chatData.latestMessage)
    let activeClass = !chatData.latestMessage || chatData.latestMessage.readBy.includes(userLoggedIn._id) ? "" :"active"

    return `
    <a class='resultListItem ${activeClass}' href='/messages/${chatData._id}'>
         ${image}
        <div class="resultsDetailsContainer ellipsis">
            <span class="heading ellipsis">
                ${chatName}
            </span>
            <span class="subText ellipsis">
                ${latestMessage}
            </span>
        </div>
    </a>
    `
}

function getLatestMessage(latestMessage){

    if(latestMessage != null){
        let sender = latestMessage.sender;
        return `
        ${sender.firstName} : ${latestMessage.content}
        `
    }
    return "New chat"
}


function getChatImageElement(chatData){

    let otherChatUsers = getOtherChatUsers(chatData.users) ; 
    let groupChatClass = "" ; 
    let chatImage = getUserChatImageElement(otherChatUsers[0])

    if(otherChatUsers.length > 1){
        groupChatClass = "groupChatImage"
        chatImage += getUserChatImageElement(otherChatUsers[1])
    }

    return `
     <div class="resultsImageContainer ${groupChatClass}">
        ${chatImage}
     </div>
    `
}

function  getUserChatImageElement(user){
    if(!user || !user.profilePic){
        return console.log("User passed into function is invalid");
    }
    return `
        <img src='${user.profilePic}' alt='${user.firstName}'/>
    `
}
