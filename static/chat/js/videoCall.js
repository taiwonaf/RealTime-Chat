import { chatSocket } from "./index.js";
const user = document.querySelector("#username").textContent;
const videoContainer = document.querySelector('.video-container')
const friendName = JSON.parse(document.getElementById('room-name').textContent);
const acceptCall = document.querySelector("#accept_call");
const mediaConstraints = {
    audio: true, // We want an audio track
    video: true
};
let targetUsername = friendName;
let myPeerConnection = null;
let myStream = null;
export const closeVideoCall = () => {
    let remoteVideo = document.querySelector("#received_video");
    let localVideo = document.querySelector("#local_video");
    if (myPeerConnection) {
        myPeerConnection.ontrack = null;
        myPeerConnection.onremovetrack = null;
        myPeerConnection.onremovestream = null;
        myPeerConnection.onicecandidate = null;
        myPeerConnection.oniceconnectionstatechange = null;
        myPeerConnection.onsignalingstatechange = null;
        myPeerConnection.onicegatheringstatechange = null;
        myPeerConnection.onnegotiationneeded = null;

        if (remoteVideo.srcObject) {
            remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        }

        if (localVideo.srcObject) {
            localVideo.srcObject.getTracks().forEach(track => track.stop());
        }

        myPeerConnection.close();
        myPeerConnection = null;
    }

    remoteVideo.removeAttribute("src");
    remoteVideo.removeAttribute("srcObject");
    localVideo.removeAttribute("src");
    remoteVideo.removeAttribute("srcObject");
    document.querySelector("#hangup-button").disabled = true;
    targetUsername = null;
    videoContainer.classList.add("d-none")
}

const handleGetUserMediaError = (e) => {
        switch (e.name) {
            case "NotFoundError":
                alert("Unable to open your call because no camera and/or microphone" +
                    "were found.");
                break;
            case "SecurityError":
            case "PermissionDeniedError":
                // Do nothing; this is the same as the user canceling the call.
                break;
            default:
                alert("Error opening your camera and/or microphone: " + e.message);
                break;
        }

        closeVideoCall();
    }
    // The caller initiating the call
export const invite = async(e) => {

    if (myPeerConnection) {
        alert("You can't start a call because you already have one open!");
    } else {
        createPeerConnection();
        try {
            myStream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
            videoContainer.classList.remove("d-none")
            document.querySelector("#local_video").srcObject = myStream;
            myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));
        } catch (error) {
            handleGetUserMediaError(error)
        }
    }
}

export const handleNegotiationNeededEvent = async() => {
    try {
        let offer = await myPeerConnection.createOffer();
        console.log(myPeerConnection.signalingState);

        // If the connection hasn't yet achieved the "stable" state,
        // return to the caller. Another negotiationneeded event
        // will be fired when the state stabilizes.
        if (myPeerConnection.signalingState != "stable") {
            console.log("     -- The connection isn't stable yet; postponing...")
            return;
        }

        await myPeerConnection.setLocalDescription(offer);
        console.log(myPeerConnection.signalingState);
        chatSocket.send(JSON.stringify({
            caller: user,
            target: targetUsername,
            type: "video-offer",
            sdp: myPeerConnection.localDescription
        }));

    } catch (e) {
        reportError(e)
    }

}
export const handleVideoOfferMsg = (msg) => {
    let localStream = null;
    targetUsername = msg.caller;
    createPeerConnection();


    let desc = new RTCSessionDescription(msg.sdp);
    myPeerConnection.setRemoteDescription(desc).then(() => {
            return navigator.mediaDevices.getUserMedia(mediaConstraints);
        })
        .then((stream) => {
            // Make the video visible
            videoContainer.classList.remove("d-none")
            localStream = stream;
            document.querySelector("#local_video").srcObject = localStream;
            localStream.getTracks().forEach(track => myPeerConnection.addTrack(track, localStream));
        })
        .then(() => {
            acceptCall.addEventListener("click", (e) => {
                console.log("clicked accept")
            })
            console.log("pass either ways")
            return myPeerConnection.createAnswer();
        })
        .then((answer) => {
            return myPeerConnection.setLocalDescription(answer);
        })
        .then(() => {
            let msg = {
                caller: user,
                target: targetUsername,
                type: "video-answer",
                sdp: myPeerConnection.localDescription
            };

            chatSocket.send(JSON.stringify(msg));
        })
        .catch(handleGetUserMediaError);
}

export const handleVideoAnswerMsg = (msg) => {
    // Configure the remote description, which is the SDP payload
    // in our "video-answer" message.
    let desc = new RTCSessionDescription(msg.sdp);
    myPeerConnection.setRemoteDescription(desc).catch(reportError);
}


export const handleICECandidateEvent = (event) => {
    if (event.candidate) {
        chatSocket.send(JSON.stringify({
            type: "new-ice-candidate",
            target: targetUsername,
            candidate: event.candidate
        }));
    };
}

export const handleNewICECandidateMsg = (msg) => {
    let candidate = new RTCIceCandidate(msg.candidate);

    myPeerConnection.addIceCandidate(candidate)
        .catch(reportError);
}

export const handleTrackEvent = (event) => {
    document.querySelector("#received_video").srcObject = event.streams[0];
    document.querySelector("#hangup-button").disabled = false;
}

export const handleRemoveTrackEvent = (event) => {
    let stream = document.querySelector("#received_video").srcObject;
    let trackList = stream.getTracks();

    if (trackList.length == 0) {
        closeVideoCall();
    }
}

export const handleICEConnectionStateChangeEvent = (event) => {
    switch (myPeerConnection.iceConnectionState) {
        case "closed":
        case "failed":
            closeVideoCall();
            break;
        default:
            break;
    }
}

export const handleSignalingStateChangeEvent = (event) => {
    switch (myPeerConnection.signalingState) {
        case "closed":
            closeVideoCall();
            break;
    }
};

export const handleICEGatheringStateChangeEvent = (event) => {
    // Our sample just logs information to console here,
    // but you can do whatever you need.
    // console.log(event)
}

export const handleHangUpMsg = (msg) => {
    closeVideoCall();
}


export const hangUpCall = () => {
    closeVideoCall();
    chatSocket.send(JSON.stringify({
        name: user,
        target: targetUsername,
        type: "hang-up"
    }));
}
const createPeerConnection = () => {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [ // Information about ICE servers - Use your own!
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });

    myPeerConnection.onicecandidate = handleICECandidateEvent;
    myPeerConnection.ontrack = handleTrackEvent;
    myPeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
    myPeerConnection.onremovetrack = handleRemoveTrackEvent;
    myPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
    myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
    myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
}