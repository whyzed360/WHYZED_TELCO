let mySerialNumber = "";
let myPeerInstance = null;
let activeMediaCall = null;
let localAudioStream = null;

const socket = io("https://whyzed-telco.onrender.com", { transports: ['websocket'] });

const PEER_CONFIG = {
    config: { 'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }] }
};

window.addEventListener('DOMContentLoaded', () => {
    const savedId = localStorage.getItem('whyzed_user_id');
    if (savedId) {
        console.log("Restoring existing ID: " + savedId);
        assignNumber(savedId);
    } else {
        console.log("No ID found. Requesting from server...");
        socket.emit('request-id');
    }
});

socket.on('assigned-id', (id) => {
    console.log("Server assigned new ID: " + id);
    assignNumber(id);
});

function assignNumber(id) {
    mySerialNumber = id;
    localStorage.setItem('whyzed_user_id', id);
    const display = document.getElementById('my-id-display');
    if (display) display.innerText = mySerialNumber;
    initializeNetworkNode(id);
}

function initializeNetworkNode(id) {
    myPeerInstance = new Peer(id, PEER_CONFIG);
    myPeerInstance.on('open', () => {
        const status = document.getElementById('network-status');
        if (status) {
            status.innerText = "SECURE PROTOCOL ACTIVE";
            status.className = "status online";
        }
    });
    myPeerInstance.on('call', (incomingCall) => handleIncomingCall(incomingCall));
}

function initiateVoiceCall() {
    const targetAddress = document.getElementById('destination-number').value.trim();
    if (!targetAddress) return;

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((stream) => {
            localAudioStream = stream;
            activeMediaCall = myPeerInstance.call(targetAddress, stream);
            activeMediaCall.on('stream', (remoteStream) => {
                const audioPlayer = document.getElementById('remote-audio');
                if (audioPlayer) audioPlayer.srcObject = remoteStream;
            });
            toggleInterfaceElements(true);
        });
}

function endVoiceCall() {
    if (activeMediaCall) activeMediaCall.close();
    if (localAudioStream) localAudioStream.getTracks().forEach(track => track.stop());
    toggleInterfaceElements(false);
}

function toggleInterfaceElements(isCalling) {
    document.getElementById('btn-call').classList.toggle('hidden', isCalling);
    document.getElementById('btn-hangup').classList.toggle('hidden', !isCalling);
}
