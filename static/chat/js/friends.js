let friendsNode = document.querySelectorAll(".friends-list .single-friend")
let friendList = [...friendsNode]

// Go to a particular room when you click on a friend's name
friendList.map((item) => {
    item.addEventListener('click', (e) => {
        window.location.href = `${window.location.origin}/chat/${item.id}/`

    })
})