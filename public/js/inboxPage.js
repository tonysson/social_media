// Send request to our api to get all the chats we are in
$(document).ready(() => {
    $.get("/api/chats" , (data , status , xhr) =>{

        if(xhr.status == 400){
            console.log("Could not get Chat list");
        }else{
            outPutChatList(data , $(".resultsContainer"))
        }
    })
})

function outPutChatList(chatList , container){
    container.html("")
    chatList.forEach(chat => {
        let html = createChatHtml(chat)
        container.append(html)
    })

    if(chatList.length == 0) {
        return container.append("<span class=''noResults>Nothing to show</span>")
    }
}




