import { DeviceConnection } from './DeviceConnection';
import { DeviceEvents, Event } from './Events';
import { IDevice } from './IDevice';
import { Request } from './Request';
import { UserDevice } from './DeviceConference';
import { RTCInformation, RTCConnection } from 'light-rtc';

export abstract class ADeviceReceiver implements IDevice {
  public readonly userId: string;
  public readonly deviceId: string;
  public readonly name: string;
  private readonly onEvent = new DeviceEvents();

  public constructor(
    protected connection: DeviceConnection,
    userDevice: UserDevice
  ) {
    this.userId = userDevice.userId;
    this.deviceId = userDevice.id;
    this.name = userDevice.name;
    this.init(this.onEvent);
  }

  public sendRequest(request: Request): Promise<any> {
    return this.connection.sendRequest(this, request);
  }

  public addRTCInformations(infos: RTCInformation): void { }

  public sendRTCInformations(infos: RTCInformation): void {
    this.connection.sendRTCInformations(this.userId, this.deviceId, infos, 'SENDER');
  }

  public init(events: DeviceEvents): void { }

  public publishEvent(event: Event): void {
    this.onEvent.next(event);
  }

  public sendStopRequest(...args: any[]): void {
    this.connection.stopDeviceRequest(this.deviceId, ...args);
  }

  public stop(...args: any[]): void {
    this.dispose();
    this.connection.receiverStopped(this);
  }

  public start(): void {
    this.connection.receiverStarted(this);
  }

  public dispose(): void { }
}
