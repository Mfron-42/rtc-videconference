import { HubConnection, HubConnectionBuilder, HttpTransportType } from '@aspnet/signalr';
import { EventEmitter } from 'events';
import { TessanUser } from './TessanUser';
import { Event } from './Events';
import { ADeviceReceiver, EmptyDeviceReceiver } from './ADeviceReceiver';
import { ADeviceSender } from './ADeviceSender';
import { Request } from './Request';
import { RTCInformation } from 'light-rtc';

export class DeviceConnection {
    private connection: HubConnection;
    private eventEmitter: EventEmitter = new EventEmitter();
    private receivers: ADeviceReceiver[] = [];
    private senders: ADeviceSender[] = [];
    private receiversFactory: (userDevice: UserDevice) => ADeviceReceiver;
    private sendersFactory: (deviceId: string, deviceName: string, originUserId: string) => ADeviceSender;
    private readonly user: TessanUser;
    private readonly conferenceId: string;

    constructor(serverUrl: string, user: TessanUser, conferenceId: string) {
        this.user = user;
        this.conferenceId = conferenceId;
        this.connection = new HubConnectionBuilder()
            .withUrl(serverUrl, {
                transport : HttpTransportType.WebSockets,
                skipNegotiation : true,
                accessTokenFactory : () => this.user.accessToken
            })
            .build();
        Object.values(SERVER_EVENTS).forEach(key => this.subscribe(key));
        this.connection.onclose(error => this.eventEmitter.emit(CONNECTION_EVENTS.CLOSE, error));
        this.initDevices();
    }

    public async connect(
        devices: string[], receiversFactory: (userDevice: UserDevice) => ADeviceReceiver,
        sendersFactory: (deviceId: string, deviceName: string, originUserId: string) => ADeviceSender
        ): Promise<void> {
        this.receiversFactory = receiversFactory;
        this.sendersFactory = sendersFactory;
        await this.connection.start();
        const enabledDevices = await this.connection.invoke('join', this.conferenceId, devices);
        this.receivers = enabledDevices.map(this.receiversFactory);
    }

    private initDevices(): void {
        this.onDeviceEvent((device, event) => this.getReceiver(device).publishEvent(event));
        this.onDeviceRequest((sernderId, device, event) => this.getSender(device).publishRequest(origin, event));
        this.onStartDeviceRequest((senderId, device, ...args) => {
            if (device.userId !== this.user.tessanId) {
                return;
            }
            this.sendersFactory(device.deviceId, device.deviceName, senderId).start(...args);
        });
        this.onDeviceStarted((userDevice, ...args) => {
            const device = this.receiversFactory(userDevice) || new EmptyDeviceReceiver(this, userDevice);
            device.start(args);
        });
        this.onStopDeviceRequest((senderId, device, ...args: any[]) => this.getSender(device).stop(...args));
        this.onDeviceStopped(device => this.getReceiver(device).stop());
        this.onRTCInfos((senderId, device, infos) => (this.getReceiver(device) || this.getSender(device)).addRTCInfos(senderId, infos));
    }

    public stopSender(device: ADeviceSender): Promise<void> {
        this.senders = this.senders.filter(d => d !== device);
        return this.connection.send(SERVER_METHODES.DEVICE_STOPPED, device.deviceId);
    }

    public startSender(device: ADeviceSender): Promise<void> {
        this.senders.push(device);
        return this.connection.send(SERVER_METHODES.DEVICE_STARTED, device.deviceId);
    }


    public stopReceiver(device: ADeviceReceiver): void {
        this.receivers = this.receivers.filter(d => d !== device);
    }

    public startReceiver(device: ADeviceReceiver): void {
        this.receivers.push(device);
    }

    private getReceiver(userDevice: UserDevice) {
        return this.receivers.find(d => d.deviceId === userDevice.deviceId);
    }

    private getSender(userDevice: UserDevice) {
        return this.senders.find(d => d.deviceId === userDevice.deviceId);
    }

    private onDeviceRequest(action: (senderId: string, userDevice: UserDevice, request: Request) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_REQUEST, action);
        return () => this.eventEmitter.removeListener(SERVER_EVENTS.DEVICE_REQUEST, action);
    }

    private onDeviceEvent(action: (userDevice: UserDevice, event: Event) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_EVENT, action);
        return () => this.eventEmitter.removeListener(SERVER_EVENTS.DEVICE_EVENT, action);
    }

    private onDeviceStarted(action: (userDevice: UserDevice) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_STARTED, action);
        return () => this.eventEmitter.removeListener(SERVER_EVENTS.DEVICE_STARTED, action);
    }

    private onDeviceStopped(action: (userDevice: UserDevice) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_STOPPED, action);
        return () => this.eventEmitter.removeListener(SERVER_EVENTS.DEVICE_STOPPED, action);
    }

    public onStartDeviceRequest(action: (senderId: string, userDevice: UserDevice, ...args: any[]) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_STARTED, action);
        return () => this.eventEmitter.removeListener(SERVER_EVENTS.START_DEVICE_REQUEST, action);
    }

    public onStopDeviceRequest(action: (senderId: string, userDevice: UserDevice, ...args: any[]) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_STOPPED, action);
        return () => this.eventEmitter.removeListener(SERVER_EVENTS.STOP_DEVICE_REQUEST, action);
    }

    public onRTCInfos(action: (sernderId: string, userDevice: UserDevice, infos: RTCInformation) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_RTC_INFOS, action);
        return () => this.eventEmitter.removeListener(SERVER_EVENTS.DEVICE_RTC_INFOS, action);
    }

    public sendRTCInfos(userId: string, deviceId: string, rtcInfos: any): Promise<void> {
        return this.connection.send(SERVER_METHODES.SEND_RTC_INFOS, userId, deviceId, rtcInfos);
    }

    public sendEvent(sender: ADeviceSender, event: Event): Promise<void> {
        return this.connection.send(SERVER_METHODES.CREATE_EVENT, sender.deviceId, event);
    }

    public startDeviceRequest(deviceId: string, ...args: any[]): Promise<void> {
        return this.connection.send(SERVER_METHODES.START_DEVICE_REQUEST, deviceId, ...args);
    }

    public stopDeviceRequest(deviceId: string, ...args: any[]): Promise<void> {
        return this.connection.send(SERVER_METHODES.STOP_DEVICE_REQUEST, deviceId, ...args);
    }

    public sendRequest(receiver: ADeviceReceiver, request: Request): Promise<void> {
        return this.connection.send(SERVER_METHODES.CREATE_REQUEST, receiver.deviceId, request);
    }

    private subscribe(event: string): void {
        this.connection.on(event, (...args) => {
            this.eventEmitter.emit(event, ...args);
            this.eventEmitter.emit(CONNECTION_EVENTS.DEBUG, ...args);
        });
    }

    public onDebug(func: (...args: any[]) => any): () => void {
        this.eventEmitter.addListener(CONNECTION_EVENTS.DEBUG, func);
        return () => this.eventEmitter.removeListener(CONNECTION_EVENTS.DEBUG, func);
    }
}

export interface UserDevice {
    deviceName: string;
    userId: string;
    deviceId: string;
}

const SERVER_EVENTS = {
    DEVICE_REQUEST : 'deviceRequest',
    DEVICE_EVENT : 'deviceEvent',
    START_DEVICE_REQUEST : 'startDeviceRequest',
    STOP_DEVICE_REQUEST : 'stopDeviceRequest',
    DEVICE_RTC_INFOS : 'RTCInfos',
    DEVICE_STARTED : 'deviceStarted',
    DEVICE_STOPPED : 'deviceStopped'
};


const SERVER_METHODES = {
    SEND_RTC_INFOS : 'sendRTCInfos',
    CREATE_REQUEST : 'createRequest',
    CREATE_EVENT : 'createEvent',
    STOP_DEVICE_REQUEST : 'stopDeviceRequest',
    START_DEVICE_REQUEST : 'startDeviceRequest',
    DEVICE_STARTED : 'deviceStarted',
    DEVICE_STOPPED : 'deviceStopped'
};

const CONNECTION_EVENTS = {
    CLOSE : 'CLOSE',
    DEBUG : 'DEBUG'
};
