import { RTCConnection, RTCReceiver, RTCInformation } from 'light-rtc';
import { DeviceRequests } from './Request';
import { ADeviceSender } from './ADeviceSender';
import { DeviceConnection } from './DeviceConnection';
import { Device } from './DeviceConference';

export class AVideoDeviceSender extends ADeviceSender {
  private stream: MediaStream;
  private unsubsciptions: (() => void)[] = [];
  public picturesUrls: string[] = [];

  constructor(connection: DeviceConnection, device: Device) {
    super(connection, device);
    this.RTCInfosSubscriptions();
  }

  public init(requests: DeviceRequests): void { requests.onRequest('lol', console.log); }

  private RTCInfosSubscriptions(): void {
    const unsubscribe = this.connection.onRTCInfos((senderId, device, infos, targetType: 'RECEIVER' | 'SENDER') => {
      if (targetType !== 'SENDER' || device.id !== this.deviceId) {
        return;
      }
      const peer = this.getPeer(senderId) || this.createPeer(senderId);
      peer.addInformations(infos);
    });
    this.unsubsciptions.push(unsubscribe);
  }

  private createPeer(userId: string): RTCConnection {
    const peer = new RTCReceiver(this.stream, infos =>
      this.sendRTCInfos(userId, infos)
    );
    this.streams.push({ userId, peer });
    return peer;
  }

  public sendRTCInfos(userId: string, infos: RTCInformation): void {
    this.connection.sendRTCInfos(userId, this.deviceId, infos, 'RECEIVER');
  }

  public async takePicture(): Promise<Blob> {
    const image = new ImageCapture(this.stream.getVideoTracks()[0]);
    const b = await image.takePhoto();
    const url = URL.createObjectURL(b);
    this.picturesUrls.push(url);
    return b;
  }

  private getPeer(userId: string): RTCConnection {
    const userPeer = this.streams.find(s => s.userId === userId);
    return userPeer ? userPeer.peer : undefined;
  }

  public start(...args: any[]): Promise<any> {
    return navigator
      .mediaDevices
      .getUserMedia({ video: true })
      .then(stream => this.stream = stream)
      .then(() => super.start());
  }

  public dispose(): void {
    this.picturesUrls.forEach(URL.revokeObjectURL);
    this.unsubsciptions.forEach(a => a());
    this.picturesUrls = [];
  }
}
