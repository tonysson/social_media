// get the name of the chat , load the chat  when the document is ready
let  typing = false
let lastTypingTime ; 

$(document).ready(() => {

    // join the chat room with socket
    socket.emit("join room" , chatId)

    //notification when a user is typing and show the dots gif
    socket.on("typing", () =>  $(".typingDots").show())

    //notification when the user stop typing and hide the dots gif
    socket.on("stop typing", () =>  $(".typingDots").hide())

    $.get(`/api/chats/${chatId}`, (data) => {
        $("#chatName").text(getChatName(data))
    })

   $.get(`/api/chats/${chatId}/messages`, (data) => {
       
           let messages = []
           let lastSenderId = ""
           data.forEach((message , index) => {
              let html = createMessageHtml(message, data[index + 1] , lastSenderId)
              messages.push(html)
              lastSenderId = message.sender._id
           })

           let messagesHtml = messages.join("")
           addMessageHtmlToPage(messagesHtml)
           scrollToButtom(false)
           markAllMessagesAsRead()

           $(".loadingSpinnerContainer").remove();
           $(".chatContainer").css("visibility" , "visible")
  })

})

// send request to our api and update the chatName
$("#chatNameButton").click(() => {
    let name = $("#chatNameTextbox").val().trim()
    $.ajax({
        url: `/api/chats/${chatId}`,
        type:"PUT",
        data:{ chatName: name},
        success : (data, status, xhr) => {
            if(xhr.status != 204){
                alert("Could not update the name of the chat")
            }else{
                location.reload()
            }
        }
    })
})

// when the send message buttton is clicked
$(".sendMessageButton").click(() => {
    messageSubmitted()
})

//When the user press the key "Enter" on the keyBoard
$(".inputTextbox").keydown((event) => {

    // send notification to the socket when the user is typing
    updateTyping()

    // 13 is the key for "enter"
    if(event.which === 13){
         messageSubmitted()
         return false
    }
    
})

// send notification to the socket when the user is typing
function updateTyping() {

    if(!connected) return ; 

    if(!typing){
        typing = true ;
        socket.emit("typing" , chatId)
    }

    lastTypingTime = new Date().getTime() ;
    let timerLength = 3000 ;

    setTimeout(() => {
        let timeNow = new Date().getTime()
        let timeDiff = timeNow - lastTypingTime
        if(timeDiff >= timerLength && typing){
            socket.emit("stop typing" , chatId)
            typing = false
        }
    }, timerLength)
}

function addMessageHtmlToPage(html) {
    $(".chatMessages").append(html)
}

function messageSubmitted () {
    let content = $(".inputTextbox").val().trim()
    if(content != "") {
        sendMessage(content)
       $(".inputTextbox").val("")
         socket.emit("stop typing" , chatId)
        typing = false
    }
    
}


function sendMessage(content){
    
    $.post("/api/messages", {content  , chatId} , (data , status , xhr) => {

        if(xhr.status != 201) {
             alert("Message is not sent")
             $(".inputTextButton").val(content)
             return
        }
        addChatMessageHtml(data)

        // create an emit handler when the user send a message
        // essentialy send a  notification to all the users and get the message in real Time
        if(connected){
            socket.emit("new message" , data)
        }
    })
}

function addChatMessageHtml(message){
    if(!message || !message._id){
        alert("Message is not valid")
        return
    }
    let messageDiv = createMessageHtml(message , null  , "")
    addMessageHtmlToPage(messageDiv)
     scrollToButtom(true)
}

function createMessageHtml(message , nextMessage , lastSenderId){

    let sender = message.sender;
    let senderName = sender.firstName;
    let currentSenderId = sender._id ;
    let nextSenderId = nextMessage != null ? nextMessage.sender._id : ""
    let isFirst = lastSenderId != currentSenderId
    let isLast = nextSenderId != currentSenderId
    let isMine = message.sender._id == userLoggedIn._id
    let liClassName = isMine ? "mine" : "theirs"
    let nameElement = ""

    if(isFirst){
        liClassName += " first"
        
        if(!isMine){
            nameElement = `<span class="senderName">${senderName}</span>`
        }
    }

    let profileImage =""
    if(isLast){
        liClassName += " last"
        profileImage = `<img src='${sender.profilePic}' alt='${sender.firstName}' />`
    }

    let imageContainer = "" ;
    if(!isMine){
        imageContainer = `
         <div class="imageContainer">
           ${profileImage}
         </div>
        
        `
    }

     return `
       <li class= 'message ${liClassName}'>
             ${imageContainer}
            <div class='messageContainer'>
                ${nameElement}
                <span class='messageBody'>
                   ${message.content}
                </span>
            </div>
       </li>
     `
}


function scrollToButtom(animated){

    let container = $(".chatMessages")
    let scrollHeight = container[0].scrollHeight
    if(animated){
        container.animate({scrollTop: scrollHeight} , "slow")
    }
    else{
        container.scrollTop(scrollHeight)
    }
}

/**
 * @description Mark all the message as read 
 */
function markAllMessagesAsRead() {

    $.ajax({
        url : `/api/chats/${chatId}/messages/markAsRead` , 
        type : "PUT",
        success : () => refreshMessagesBadge()
    })
}









