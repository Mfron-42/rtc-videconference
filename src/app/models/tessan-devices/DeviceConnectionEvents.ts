import { HubConnection } from '@aspnet/signalr';
import { EventEmitter } from 'events';
import { UserDevice, User } from './DeviceConference';
import { RTCInformation } from 'light-rtc';
import { Event } from './Events';
import { Request } from './Request';

const SERVER_EVENTS = {
    DEVICE_REQUEST: 'deviceRequest',
    DEVICE_EVENT: 'deviceEvent',
    USER_JOINED: 'userJoined',
    USER_LEFT: 'userLeft',
    START_DEVICE_REQUEST: 'startDeviceRequest',
    STOP_DEVICE_REQUEST: 'stopDeviceRequest',
    DEVICE_RTC_INFOS: 'RTCInfos',
    DEVICE_STARTED: 'deviceStarted',
    DEVICE_STOPPED: 'deviceStopped'
};

export class DeviceConnectionEvents {
    private eventEmitter: EventEmitter = new EventEmitter();

    constructor(private connection: HubConnection) {
        Object.values(SERVER_EVENTS).forEach(key => this.subscribe(key));
        this.connection.onclose(err => this.eventEmitter.emit('CLOSE', err));
        this.eventEmitter.addListener('*', console.log);
    }

    private subscribe(event: string): void {
        this.connection.on(event, (...args) => {
            this.eventEmitter.emit(event, ...args);
            this.eventEmitter.emit('__DEBUG__', ...args);
        });
    }

    public onUserJoined(action: (user: User) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.USER_JOINED, action);
        return () =>
            this.eventEmitter.removeListener(SERVER_EVENTS.USER_JOINED, action);
    }

    public onUserLeft(action: (user: User) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.USER_LEFT, action);
        return () =>
            this.eventEmitter.removeListener(SERVER_EVENTS.USER_LEFT, action);
    }

    public onDeviceRequest(
        action: (senderId: string, userDevice: UserDevice, request: Request) => any
    ): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_REQUEST, action);
        return () =>
            this.eventEmitter.removeListener(SERVER_EVENTS.DEVICE_REQUEST, action);
    }

    public onDeviceEvent(
        action: (userDevice: UserDevice, event: Event) => any
    ): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_EVENT, action);
        return () =>
            this.eventEmitter.removeListener(SERVER_EVENTS.DEVICE_EVENT, action);
    }

    public onDeviceStarted(action: (userDevice: UserDevice) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_STARTED, action);
        return () =>
            this.eventEmitter.removeListener(SERVER_EVENTS.DEVICE_STARTED, action);
    }

    public onDeviceStopped(action: (userDevice: UserDevice) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_STOPPED, action);
        return () =>
            this.eventEmitter.removeListener(SERVER_EVENTS.DEVICE_STOPPED, action);
    }

    public onStartDeviceRequest(
        action: (senderId: string, userDevice: UserDevice, ...args: any[]) => any
    ): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.START_DEVICE_REQUEST, action);
        return () =>
            this.eventEmitter.removeListener(
                SERVER_EVENTS.START_DEVICE_REQUEST,
                action
            );
    }

    public onStopDeviceRequest(
        action: (senderId: string, userDevice: UserDevice, ...args: any[]) => any
    ): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.STOP_DEVICE_REQUEST, action);
        return () =>
            this.eventEmitter.removeListener(
                SERVER_EVENTS.STOP_DEVICE_REQUEST,
                action
            );
    }

    public onRTCInformations(
        action: (
            senderId: string,
            userDevice: UserDevice,
            infos: RTCInformation,
            targetType: 'RECEIVER' | 'SENDER'
        ) => any
    ): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_RTC_INFOS,
            (senderId, userDevice, infos, args) => action(senderId, userDevice, infos, args[0]));
        return () =>
            this.eventEmitter.removeListener(SERVER_EVENTS.DEVICE_RTC_INFOS, action);
    }

    public onDebug(func: (...args: any[]) => any): () => void {
        this.eventEmitter.addListener('__DEBUG__', func);
        return () =>
            this.eventEmitter.removeListener('__DEBUG__', func);
    }
}
