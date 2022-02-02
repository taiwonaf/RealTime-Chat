let inputBox = document.querySelector("#input-message")
let sendButton = document.querySelector("#send-button")
let chatHolder = document.querySelectorAll(".messages")[0]
let friendsNode = document.querySelectorAll(".friends-list .single-friend")
let friendList = [...friendsNode]
console.log(friendsNode)
friendList.map((item) => {
    item.addEventListener('click', (e) => {
        console.log(item.getElementsByTagName("h6")[0].innerHTML)
    })

})

const formatAMPM = (date) => {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}



const url = `ws://${window.location.host}/ws/chat/${"eny"}/`
const chatSocket = new ReconnectingWebSocket(url)


chatSocket.addEventListener('open', (e) => {
    console.log("Connection Established")
})
chatSocket.addEventListener('message', (e) => {
    let messageStatus = document.querySelectorAll('.chat-status')
    let spinnerIcon = document.querySelectorAll('.chat-status i:nth-child(1)')
    spinnerIcon[spinnerIcon.length - 1].classList.add("d-none")
    messageStatus[messageStatus.length - 1].innerHTML += '<i class="fas fa-check"></i>'



})
chatSocket.addEventListener('close', (e) => {
    console.error('Chat socket closed unexpectedly');
})


inputBox.focus()
inputBox.addEventListener('keyup', (e => {
    if (e.keyCode === 13) { // enter, return
        sendButton.click();
    }
}))



sendButton.addEventListener('click', (e) => {
    chatSocket.send(JSON.stringify({
        'message': inputBox.value
    }));
    let str = `<div class="outgoing-message">
                    <div class="chat-bubble">
                        <div class="msg">${inputBox.value}</div>
                        <span class ="msg-metadata">
                            <span class = "msg-time">${formatAMPM(new Date)}</span> 
                            <span class="chat-status">
                                <i class="fas fa-spinner"></i>
                            </span>
                        </span>
                    </div>
                </div>`

    chatHolder.innerHTML += str
    chatHolder.scrollTop = chatHolder.scrollHeight;
    inputBox.value = ""

})

// const divOutgoing = document.createElement("div")
//     const divchatBubble = document.createElement("div")
//     const divMsg = document.createElement("div")

//     divOutgoing.className = "outgoing-message"
//     divchatBubble.className = "chat-bubble"
//     divMsg.className = "msg"
//     divMsg.innerHTML = inputBox.value
//     divchatBubble.appendChild(divMsg)
//     divOutgoing.append(divchatBubble)