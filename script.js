// WHYZED Network Configuration
const MY_SERIAL_NUMBER = '060-000-001'; 
let myPeerInstance = null;
let activeMediaCall = null;
let localAudioStream = null;

// Socket.io initialization for Signaling (Point to your live Render URL)
const socket = io("https://whyzed-telco.onrender.com", {
    transports: ['websocket']
});

// STUN Servers to bypass mobile firewalls/NAT
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
    initializeNetworkNode();
});

function initializeNetworkNode() {
    const statusDisplay = document.getElementById('network-status');
    
    // Initialize PeerJS with STUN configuration
    myPeerInstance = new Peer(MY_SERIAL_NUMBER, PEER_CONFIG);

    myPeerInstance.on('open', (id) => {
        statusDisplay.innerText = "SECURE PROTOCOL ACTIVE";
        statusDisplay.className = "status online";
        console.log(`Node online. Identity verified as: ${id}`);
        // Notify signaling server
        socket.emit("register", id);
    });

    myPeerInstance.on('error', (err) => {
        console.error('PeerJS Protocol Error:', err);
        document.getElementById('call-state').innerText = `Error context: ${err.type}`;
        if (err.type === 'unavailable-id') {
            alert("This ID is already taken or unavailable.");
        }
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
            console.error("Hardware initialization blocked:", err);
            document.getElementById('call-state').innerText = "Mic access denied.";
        });
}

function initiateVoiceCall() {
    const targetAddress = document.getElementById('destination-number').value.trim();
    
    if (targetAddress === MY_SERIAL_NUMBER) {
        alert("Cannot call yourself on the WHYZED network.");
        return;
    }
    if (!targetAddress) {
        alert("Please enter a valid destination address.");
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
        .catch((err) => {
            console.error("Hardware initiation failed:", err);
            document.getElementById('call-state').innerText = "Call Failed: Check Permissions.";
        });
}

function endVoiceCall() {
    if (activeMediaCall) {
        activeMediaCall.close();
    }
    resetCallUI();
}

function resetCallUI() {
    if (localAudioStream) {
        localAudioStream.getTracks().forEach(track => track.stop());
    }
    toggleInterfaceElements(false);
    document.getElementById('call-state').innerText = "Secure Line Disconnected";
}

function toggleInterfaceElements(isCalling) {
    const callBtn = document.getElementById('btn-call');
    const hangupBtn = document.getElementById('btn-hangup');
    if (isCalling) {
        callBtn.classList.add('hidden');
        hangupBtn.classList.remove('hidden');
    } else {
        callBtn.classList.remove('hidden');
        hangupBtn.classList.add('hidden');
    }
}
