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

  public abstract init(events: DeviceEvents): void;

  public publishEvent(event: Event): void {
    this.onEvent.next(event);
  }

  public stop(...args: any[]): void {
    this.connection.receiverStopped(this);
  }

  public start(): void {
    this.connection.receiverStarted(this);
  }

}

export class EmptyDeviceReceiver extends ADeviceReceiver {
  constructor(connection: DeviceConnection, userDevice: UserDevice) {
    super(connection, userDevice);
    console.warn(
      'Empty receiver created. You wont be able to retreive the data of this device : ' +
      JSON.stringify(userDevice)
    );
  }

  public init(events: DeviceEvents): void { }
}
