import { RTCInitiator, RTCConnection, RTCInformation } from 'light-rtc';
import { DeviceEvents } from './Events';
import { ADeviceReceiver } from './ADeviceReceiver';
import { EventEmitter } from 'events';
import { DeviceConnection } from './DeviceConnection';
import { UserDevice } from './DeviceConference';

export class VideoDeviceReceiver extends ADeviceReceiver {
  private emitter: EventEmitter = new EventEmitter();
  protected peer: RTCConnection;
  public picturesUrls: string[] = [];
  private stream: MediaStream;

  constructor(connection: DeviceConnection, userDevice: UserDevice) {
    super(connection, userDevice);
    this.peer = new RTCInitiator(undefined, infos => this.sendRTCInformations(infos));
    this.peer.onStream(stream => this.emitter.emit('stream', stream));
    this.onStream(stream => this.stream = stream);
  }

  public getStream(): MediaStream {
    return this.stream;
  }

  public addRTCInformations(infos: RTCInformation): void {
    this.peer.addInformations(infos);
  }

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

  public dispose(): void {
    this.peer.getPeer().close();
    this.picturesUrls.forEach(URL.revokeObjectURL);
    this.picturesUrls = [];
  }
}
