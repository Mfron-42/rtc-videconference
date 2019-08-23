import { RTCConnection, RTCReceiver, RTCInformation } from 'light-rtc';
import { DeviceRequests } from './Request';
import { ADeviceSender } from './ADeviceSender';
import { DeviceConnection } from './DeviceConnection';
import { Device } from './DeviceConference';

export class VideoDeviceSender extends ADeviceSender {
  private stream: MediaStream;
  public picturesUrls: string[] = [];

  constructor(connection: DeviceConnection, device: Device) {
    super(connection, device);
  }

  private createPeer(userId: string): RTCConnection {
    const peer = new RTCReceiver(this.stream, infos =>
      this.sendRTCInformations(userId, infos)
    );
    this.userPeers.push({ userId, peer });
    return peer;
  }

  public addRTCInformations(originId: string, infos: RTCInformation): void {
    const peer = this.getPeer(originId) || this.createPeer(originId);
    peer.addInformations(infos);
  }

  public async takePicture(): Promise<Blob> {
    const image = new ImageCapture(this.stream.getVideoTracks()[0]);
    const b = await image.takePhoto();
    const url = URL.createObjectURL(b);
    this.picturesUrls.push(url);
    return b;
  }

  private getPeer(userId: string): RTCConnection {
    const userPeer = this.userPeers.find(s => s.userId === userId);
    return userPeer ? userPeer.peer : undefined;
  }

  public start(stream: MediaStream, ...args: any[]): Promise<any> {
    this.stream = stream;
    return super.start();
  }

  public dispose(): void {
    this.userPeers.forEach(s => s.peer.getPeer().close());
    this.picturesUrls.forEach(URL.revokeObjectURL);
    this.picturesUrls = [];
  }
}
