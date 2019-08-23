import { HubConnection } from '@aspnet/signalr';
import { ADeviceSender } from './ADeviceSender';
import { ADeviceReceiver } from './ADeviceReceiver';
import { Event } from './Events';
import { Request } from './Request';

const SERVER_METHODES = {
    SEND_RTC_INFOS: 'sendRTCInfos',
    CREATE_REQUEST: 'createRequest',
    CREATE_EVENT: 'createEvent',
    STOP_DEVICE_REQUEST: 'stopDeviceRequest',
    START_DEVICE_REQUEST: 'startDeviceRequest',
    DEVICE_STARTED: 'deviceStarted',
    DEVICE_STOPPED: 'deviceStopped'
};

export class DeviceConnectionMethods {
    constructor(private connection: HubConnection) {
    }

    public senderStopped(deviceId: string): Promise<void> {
        return this.connection.send(
            SERVER_METHODES.DEVICE_STOPPED,
            deviceId
        );
    }

    public senderStarted(deviceId: string): Promise<void> {
        return this.connection.send(
            SERVER_METHODES.DEVICE_STARTED,
            deviceId
        );
    }

    public sendRTCInformations(
        userId: string,
        deviceId: string,
        rtcInfos: any,
        targetType: 'RECEIVER' | 'SENDER'
    ): Promise<void> {
        return this.connection.send(
            SERVER_METHODES.SEND_RTC_INFOS,
            userId,
            deviceId,
            rtcInfos,
            [targetType]
        );
    }

    public startDeviceRequest(deviceId: string, ...args: any[]): Promise<void> {
        return this.connection.send(
            SERVER_METHODES.START_DEVICE_REQUEST,
            deviceId,
            args
        );
    }

    public stopDeviceRequest(deviceId: string, ...args: any[]): Promise<void> {
        return this.connection.send(
            SERVER_METHODES.STOP_DEVICE_REQUEST,
            deviceId,
            args
        );
    }

    public sendEvent(deviceId: string, event: Event): Promise<void> {
        return this.connection.send(
            SERVER_METHODES.CREATE_EVENT,
            deviceId,
            event
        );
    }

    public sendRequest(
        deviceId: string,
        request: Request
    ): Promise<void> {
        return this.connection.send(
            SERVER_METHODES.CREATE_REQUEST,
            deviceId,
            request
        );
    }
}
