// WHYZED Network Configuration
let mySerialNumber = ""; 
let myPeerInstance = null;
let activeMediaCall = null;
let localAudioStream = null;

const socket = io("https://whyzed-telco.onrender.com", {
    transports: ['websocket']
});

const PEER_CONFIG = {
    config: {
        'iceServers': [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ]
    }
};

window.addEventListener('DOMContentLoaded', () => {
    checkIdentity();
});

function checkIdentity() {
    const savedId = localStorage.getItem('whyzed_user_id');

    if (savedId) {
        // Option 1: Existing user on this device
        if (confirm(`Welcome back! Your number is ${savedId}. Use this number?`)) {
            assignNumber(savedId);
        } else {
            promptNewIdentity();
        }
    } else {
        // Option 2: New device - ask to recover or create
        promptNewIdentity();
    }
}

function promptNewIdentity() {
    const action = prompt("Enter 'new' for a new number, or paste your existing 060XXXXXX number to recover it:");
    
    if (action && action.toLowerCase() === 'new') {
        socket.emit('request-id');
    } else if (action && action.startsWith('060')) {
        assignNumber(action);
    } else {
        alert("Invalid input. Generating new number...");
        socket.emit('request-id');
    }
}

function assignNumber(id) {
    mySerialNumber = id;
    localStorage.setItem('whyzed_user_id', id);
    document.getElementById('my-id-display').innerText = mySerialNumber;
    initializeNetworkNode(id);
}

socket.on('assigned-id', (id) => {
    assignNumber(id);
});

function initializeNetworkNode(id) {
    const statusDisplay = document.getElementById('network-status');
    myPeerInstance = new Peer(id, PEER_CONFIG);

    myPeerInstance.on('open', (id) => {
        statusDisplay.innerText = "SECURE PROTOCOL ACTIVE";
        statusDisplay.className = "status online";
        console.log(`Node online. Identity: ${id}`);
    });

    myPeerInstance.on('call', (incomingCall) => {
        handleIncomingCall(incomingCall);
    });
}

function handleIncomingCall(incomingCall) {
    document.getElementById('call-state').innerText = "Incoming Secure Call...";
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((stream) => {
            localAudioStream = stream;
            activeMediaCall = incomingCall;
            incomingCall.answer(stream);
            toggleInterfaceElements(true);
            incomingCall.on('stream', (remoteStream) => {
                const audioPlayer = document.getElementById('remote-audio');
                audioPlayer.srcObject = remoteStream;
                document.getElementById('call-state').innerText = "Call Connected (Encrypted P2P)";
            });
        })
        .catch((err) => {
            document.getElementById('call-state').innerText = "Mic access denied.";
        });
}

function initiateVoiceCall() {
    const targetAddress = document.getElementById('destination-number').value.trim();
    if (targetAddress === mySerialNumber) {
        alert("Cannot call yourself.");
        return;
    }
    document.getElementById('call-state').innerText = `Dialing: ${targetAddress}...`;

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((stream) => {
            localAudioStream = stream;
            toggleInterfaceElements(true);
            activeMediaCall = myPeerInstance.call(targetAddress, stream);
            activeMediaCall.on('stream', (remoteStream) => {
                const audioPlayer = document.getElementById('remote-audio');
                audioPlayer.srcObject = remoteStream;
                document.getElementById('call-state').innerText = "Call Connected (Encrypted P2P)";
            });
            activeMediaCall.on('close', () => resetCallUI());
        })
        .catch(() => {
            document.getElementById('call-state').innerText = "Call Failed: Check Permissions.";
        });
}

function endVoiceCall() {
    if (activeMediaCall) activeMediaCall.close();
    resetCallUI();
}

function resetCallUI() {
    if (localAudioStream) localAudioStream.getTracks().forEach(track => track.stop());
    toggleInterfaceElements(false);
    document.getElementById('call-state').innerText = "Secure Line Disconnected";
}

function toggleInterfaceElements(isCalling) {
    const callBtn = document.getElementById('btn-call');
    const hangupBtn = document.getElementById('btn-hangup');
    isCalling ? callBtn.classList.add('hidden') : callBtn.classList.remove('hidden');
    isCalling ? hangupBtn.classList.remove('hidden') : hangupBtn.classList.add('hidden');
}
