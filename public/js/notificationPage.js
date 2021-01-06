$(document).ready(() => {

    $.get("/api/notifications", (data) => {
        outPutNotificationList(data , $(".resultsContainer"))
    })
})

//marked all th enotification as read
$("#markedAsRead").click(() => markedNotificationAsOpened())





