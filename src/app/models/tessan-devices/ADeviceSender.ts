import { DeviceConnection } from './DeviceConnection';
import { Event } from './Events';
import { DeviceRequests, Request } from './Request';
import { IDevice } from './IDevice';
import { Device } from './DeviceConference';

export abstract class ADeviceSender implements IDevice {
  private readonly onRequest = new DeviceRequests();
  public deviceId: string;
  public name: string;

  public constructor(
    private readonly connection: DeviceConnection,
    device: Device
  ) {
    this.deviceId = device.id;
    this.name = device.name;
    this.init(this.onRequest);
  }

  public sendEvent(event: Event): Promise<any> {
    return this.connection.sendEvent(this, event);
  }

  public abstract init(requests: DeviceRequests): void;

  public publishRequest(originId: string, request: Request): void {
    this.onRequest.next({ originId, request });
  }

  public sendRTCInfos(userId: string, infos: any): void {
    this.connection.sendRTCInfos(userId, this.deviceId, infos);
  }

  public addRTCInfos(userId: string, infos: any): void {}

  public stop(...args: any[]): Promise<any> {
    return this.connection.stopSender(this);
  }

  public start(...params: any): Promise<any> {
    return this.connection.startSender(this);
  }
}
