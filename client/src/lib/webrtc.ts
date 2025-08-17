export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onSignalCallback?: (signal: any, targetUserId?: string) => void;

  constructor() {
    this.initializePeerConnection();
  }

  private initializePeerConnection() {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onSignalCallback) {
        this.onSignalCallback({
          type: 'ice-candidate',
          candidate: event.candidate,
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };
  }

  async startStreaming(videoElement: HTMLVideoElement) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      videoElement.srcObject = this.localStream;

      if (this.peerConnection) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      return this.localStream;
    } catch (error) {
      console.error('Error starting stream:', error);
      throw error;
    }
  }

  async stopStreaming() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) return null;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      if (this.onSignalCallback) {
        this.onSignalCallback({
          type: 'offer',
          offer: offer,
        });
      }

      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      return null;
    }
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) return null;

    try {
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      if (this.onSignalCallback) {
        this.onSignalCallback({
          type: 'answer',
          answer: answer,
        });
      }

      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      return null;
    }
  }

  async handleSignal(signal: any) {
    if (!this.peerConnection) return;

    try {
      switch (signal.type) {
        case 'offer':
          await this.createAnswer(signal.offer);
          break;
        case 'answer':
          await this.peerConnection.setRemoteDescription(signal.answer);
          break;
        case 'ice-candidate':
          await this.peerConnection.addIceCandidate(signal.candidate);
          break;
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onSignal(callback: (signal: any, targetUserId?: string) => void) {
    this.onSignalCallback = callback;
  }

  disconnect() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    this.remoteStream = null;
  }
}
