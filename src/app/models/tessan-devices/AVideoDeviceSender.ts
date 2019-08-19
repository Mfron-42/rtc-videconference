import { RTCConnection, RTCReceiver } from 'light-rtc';
import { DeviceRequests } from './Request';
import { ADeviceSender } from './ADeviceSender';

export class AVideoDeviceSender extends ADeviceSender {
    private stream: MediaStream;
    public picturesUrls: string[] = [];
    private streams: {
        userId: string;
        peer: RTCConnection;
    }[];

    public init(requests: DeviceRequests): void {
    }

    public addRTCInfos(userId: string, infos: any): void {
        const peer = this.getPeer(userId) || this.createPeer(userId);
        peer.addInformations(infos);
    }

    private createPeer(userId: string): RTCConnection {
        const peer = new RTCReceiver(this.stream, infos => this.sendRTCInfos(userId, infos));
        this.streams.push({ userId, peer });
        return peer;
    }

    public async takePicture(): Promise<Blob> {
        const image = new ImageCapture(this.stream.getVideoTracks()[0]);
        const b = await image.takePhoto();
        const url = URL.createObjectURL(b);
        this.picturesUrls.push(url);
        return b;
    }

    private getPeer(userId: string): RTCConnection {
        return this.streams.find(s => s.userId === userId).peer;
    }

    public start(stream: MediaStream, ...args: any[]): Promise<any> {
        this.stream = stream;
        return super.start();
    }

    public dispose(): void {
        this.picturesUrls.forEach(URL.revokeObjectURL);
        this.picturesUrls = [];
    }
}
