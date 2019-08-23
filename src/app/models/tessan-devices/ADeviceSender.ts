import { DeviceConnection } from './DeviceConnection';
import { Event } from './Events';
import { DeviceRequests, Request } from './Request';
import { IDevice } from './IDevice';
import { Device } from './DeviceConference';
import { RTCConnection, RTCInformation } from 'light-rtc';

export abstract class ADeviceSender implements IDevice {
  private readonly onRequest = new DeviceRequests();
  protected userPeers: {
    userId: string;
    peer: RTCConnection;
  }[] = [];
  public deviceId: string;
  public name: string;

  public constructor(
    protected readonly connection: DeviceConnection,
    device: Device
  ) {
    this.deviceId = device.id;
    this.name = device.name;
    this.init(this.onRequest);
  }

  public sendEvent(event: Event): Promise<any> {
    return this.connection.sendEvent(this, event);
  }

  public init(requests: DeviceRequests): void { }

  public publishRequest(originId: string, request: Request): void {
    this.onRequest.next({ originId, request });
  }

  public addRTCInformations(senderId: string, infos: RTCInformation): void { }

  public sendRTCInformations(userId: string, infos: RTCInformation): void {
    this.connection.sendRTCInformations(userId, this.deviceId, infos, 'RECEIVER');
  }

  public stop(...args: any[]): Promise<any> {
    this.dispose();
    return this.connection.senderStopped(this);
  }

  public start(...params: any): Promise<any> {
    return this.connection.senderStarted(this);
  }

  public dispose(): void { }
}
