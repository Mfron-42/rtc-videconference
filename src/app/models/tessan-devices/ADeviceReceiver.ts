import { DeviceConnection, UserDevice } from './DeviceConnection';
import { DeviceEvents, Event } from './Events';
import { IDevice } from './IDevice';
import { Request } from './Request';

export abstract class ADeviceReceiver implements UserDevice, IDevice {
    public readonly userId: string;
    public readonly deviceId: string;
    public readonly deviceName: string;
    private readonly onEvent = new DeviceEvents();

    public constructor(private connection: DeviceConnection, userDevice: UserDevice) {
        this.userId = userDevice.userId;
        this.deviceId = userDevice.deviceId;
        this.deviceName = userDevice.deviceName;
        this.init(this.onEvent);
    }

    public sendRequest(request: Request): Promise<any> {
        return this.connection.sendRequest(this, request);
    }

    public sendRTCInfos(infos: any): void {
        this.connection.sendRTCInfos(this.userId, this.deviceId, infos);
    }

    public abstract init(events: DeviceEvents): void;

    public publishEvent(event: Event): void {
        this.onEvent.next(event);
    }

    public addRTCInfos(userId: string, infos: any): void { }

    public stop(...args: any[]): void {
        this.connection.stopReceiver(this);
    }

    public start(...args: any[]): void {
        this.connection.startReceiver(this);
    }
}

export class EmptyDeviceReceiver extends ADeviceReceiver {
    constructor(connection: DeviceConnection, userDevice: UserDevice) {
        super(connection, userDevice);
        console.warn('Empty receiver created. You wont be able to retreive the data of this device : ' + JSON.stringify(userDevice));
    }

    public init(events: DeviceEvents): void {
    }
}
