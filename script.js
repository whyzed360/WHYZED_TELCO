// WHYZED Network Configuration
const MY_SERIAL_NUMBER = '060-000-001'; 
let myPeerInstance = null;
let activeMediaCall = null;
let localAudioStream = null;

// Initialize the Network Node when the page finishes loading
window.addEventListener('DOMContentLoaded', () => {
    initializeNetworkNode();
});

function initializeNetworkNode() {
    const statusDisplay = document.getElementById('network-status');
    
    // Create Peer connection bound directly to your custom number schema
    myPeerInstance = new Peer(MY_SERIAL_NUMBER);

    myPeerInstance.on('open', (id) => {
        statusDisplay.innerText = "SECURE PROTOCOL ACTIVE";
        statusDisplay.className = "status online";
        console.log(`Node online. Identity verified as: ${id}`);
    });

    myPeerInstance.on('error', (err) => {
        statusDisplay.innerText = "CONNECTION FAILURE";
        statusDisplay.className = "status error";
        document.getElementById('call-state').innerText = `Error context: ${err.type}`;
        console.error('PeerJS Protocol Error:', err);
    });

    // Automatically listen for incoming secure audio requests
    myPeerInstance.on('call', (incomingCall) => {
        console.log("Receiving incoming connection handshake...");
        
        // Request micro-permissions from browser locally to answer
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then((stream) => {
                localAudioStream = stream;
                activeMediaCall = incomingCall;
                
                // Answer the connection instantly and push local audio stream back
                incomingCall.answer(stream);
                toggleInterfaceElements(true);
                
                incomingCall.on('stream', (remoteStream) => {
                    const audioTracks = document.getElementById('remote-audio');
                    audioTracks.srcObject = remoteStream;
                    document.getElementById('call-state').innerText = "Call Connected (Encrypted P2P)";
                });
            })
            .catch((err) => {
                console.error("Hardware initialization blocked:", err);
                document.getElementById('call-state').innerText = "Failed to access local microphone.";
            });
    });
}

function initiateVoiceCall() {
    const targetAddress = document.getElementById('destination-number').value.trim();
    if (!targetAddress) {
        alert("Please output a valid 060 destination address.");
        return;
    }

    document.getElementById('call-state').innerText = `Dialing secure line: ${targetAddress}...`;

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((stream) => {
            localAudioStream = stream;
            toggleInterfaceElements(true);
            
            // Execute the secure P2P handshake directly to the destination number
            activeMediaCall = myPeerInstance.call(targetAddress, stream);
            
            activeMediaCall.on('stream', (remoteStream) => {
                const audioTracks = document.getElementById('remote-audio');
                audioTracks.srcObject = remoteStream;
                document.getElementById('call-state').innerText = "Call Connected (Encrypted P2P)";
            });

            activeMediaCall.on('close', () => {
                resetCallUI();
            });
        })
        .catch((err) => {
            console.error("Hardware initiation failed:", err);
            document.getElementById('call-state').innerText = "Call Aborted. Check device mic access permissions.";
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
