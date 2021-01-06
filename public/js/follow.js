$(document).ready(() => {

    if(selectedTab === "followers"){
        loadFollowers()
    }else{
         loadFollowing()
    }
   
})


function loadFollowers() {
     $.get(`/api/users/${profileUserId}/followers` , results => {
       outPutUsers(results.followers , $(".resultsContainer"))
    })
}

function loadFollowing() {
     $.get(`/api/users/${profileUserId}/following`, results => {
       outPutUsers(results.following , $(".resultsContainer"))
    })
}







