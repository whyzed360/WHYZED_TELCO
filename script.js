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
        if (confirm(`Welcome back! Your number is ${savedId}. Use this number?`)) {
            assignNumber(savedId);
        } else {
            showPrompt();
        }
    } else {
        showPrompt();
    }
});

function showPrompt() {
    const action = confirm("No active ID found. Click OK to generate a New Number, or Cancel to enter an existing one.");
    if (action) {
        socket.emit('request-id');
    } else {
        const manualId = prompt("Enter your existing 060XXXXXX number:");
        if (manualId) assignNumber(manualId);
        else socket.emit('request-id');
    }
}

function assignNumber(id) {
    mySerialNumber = id;
    localStorage.setItem('whyzed_user_id', id);
    const display = document.getElementById('my-id-display');
    if (display) display.innerText = mySerialNumber;
    initializeNetworkNode(id);
}

socket.on('assigned-id', (id) => assignNumber(id));

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

function handleIncomingCall(incomingCall) {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((stream) => {
            localAudioStream = stream;
            activeMediaCall = incomingCall;
            incomingCall.answer(stream);
            toggleInterfaceElements(true);
            incomingCall.on('stream', (remoteStream) => {
                const audioPlayer = document.getElementById('remote-audio');
                if (audioPlayer) audioPlayer.srcObject = remoteStream;
            });
        });
}

function initiateVoiceCall() {
    const targetAddress = document.getElementById('destination-number').value.trim();
    if (!targetAddress || targetAddress === mySerialNumber) return;

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((stream) => {
            localAudioStream = stream;
            toggleInterfaceElements(true);
            activeMediaCall = myPeerInstance.call(targetAddress, stream);
            activeMediaCall.on('stream', (remoteStream) => {
                const audioPlayer = document.getElementById('remote-audio');
                if (audioPlayer) audioPlayer.srcObject = remoteStream;
            });
            activeMediaCall.on('close', () => resetCallUI());
        });
}

function endVoiceCall() {
    if (activeMediaCall) activeMediaCall.close();
    resetCallUI();
}

function resetCallUI() {
    if (localAudioStream) localAudioStream.getTracks().forEach(track => track.stop());
    toggleInterfaceElements(false);
}

function toggleInterfaceElements(isCalling) {
    const callBtn = document.getElementById('btn-call');
    const hangupBtn = document.getElementById('btn-hangup');
    if (callBtn && hangupBtn) {
        callBtn.classList.toggle('hidden', isCalling);
        hangupBtn.classList.toggle('hidden', !isCalling);
    }
}
