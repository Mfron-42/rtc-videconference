import { RTCInitiator, RTCConnection } from 'light-rtc';
import { DeviceEvents } from './Events';
import { ADeviceReceiver } from './ADeviceReceiver';

export class AVideoDeviceReceiver extends ADeviceReceiver {
    private peer: RTCConnection;
    public picturesUrls: string[] = [];
    public stream: MediaStream;

    public init(events: DeviceEvents): void {
        this.peer = new RTCInitiator(undefined, infos => this.sendRTCInfos(infos));
        this.peer.onStream(stream => this.stream = stream);
    }

    public async takePicture(): Promise<Blob> {
        const image = new ImageCapture(this.stream.getVideoTracks()[0]);
        const b = await image.takePhoto();
        const url = URL.createObjectURL(b);
        this.picturesUrls.push(url);
        return b;
    }

    public addRTCInfos(infos: any): void {
        this.peer.addInformations(infos);
    }

    public dispose(): void {
        this.picturesUrls.forEach(URL.revokeObjectURL);
        this.picturesUrls = [];
    }
}
