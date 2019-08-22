import { RTCInitiator, RTCConnection, RTCInformation } from 'light-rtc';
import { DeviceEvents } from './Events';
import { ADeviceReceiver } from './ADeviceReceiver';
import { EventEmitter } from 'events';
import { DeviceConnection } from './DeviceConnection';
import { UserDevice } from './DeviceConference';

export class AVideoDeviceReceiver extends ADeviceReceiver {
  private emitter: EventEmitter = new EventEmitter();
  protected peer: RTCConnection;
  private unsubsciptions: (() => void)[] = [];
  public picturesUrls: string[] = [];
  public stream: MediaStream;

  constructor(connection: DeviceConnection, userDevice: UserDevice) {
    super(connection, userDevice);
    this.peer = new RTCInitiator(undefined, infos => this.sendRTCInfos(infos));
    this.peer.onStream(stream => this.emitter.emit('stream', stream));
    this.onStream((stream) => {
      console.log('stream', stream);
      this.stream = stream;
    });
    this.RTCInfosSubscriptions();
  }

  private RTCInfosSubscriptions(): void {
    const unsubscribe = this.connection.onRTCInfos((senderId, device, infos, targetType: 'RECEIVER' | 'SENDER') => {
      if (targetType !== 'RECEIVER' || device.id !== this.deviceId) {
        return;
      }
      this.peer.addInformations(infos);
    });
    this.unsubsciptions.push(unsubscribe);
  }

  public init(events: DeviceEvents): void { events.onEvent('lol', console.log); }

  public onStream(action: (stream: MediaStream) => void): () => void {
    this.emitter.addListener('stream', action);
    return () => this.emitter.removeListener('stream', action);
  }

  public async takePicture(): Promise<Blob> {
    const image = new ImageCapture(this.stream.getVideoTracks()[0]);
    const b = await image.takePhoto();
    const url = URL.createObjectURL(b);
    this.picturesUrls.push(url);
    return b;
  }

  public sendRTCInfos(infos: RTCInformation): void {
    this.connection.sendRTCInfos(this.userId, this.deviceId, infos, 'SENDER');
  }

  public dispose(): void {
    this.picturesUrls.forEach(URL.revokeObjectURL);
    this.unsubsciptions.forEach(a => a());
    this.picturesUrls = [];
  }
}
