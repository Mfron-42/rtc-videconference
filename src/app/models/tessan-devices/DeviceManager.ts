import { DeviceConnectionMethods } from './DeviceConnectionMethods';
import { DeviceConnectionEvents } from './DeviceConnectionEvents';
import { ADeviceReceiver } from './ADeviceReceiver';
import { ADeviceSender } from './ADeviceSender';
import { DeviceConference, UserDevice, Device, User } from './DeviceConference';
import { EventEmitter } from 'events';
import { Event } from './Events';
import { Request } from './Request';

export abstract class ADeviceManager {
    protected deviceConference: DeviceConference;
    protected events: DeviceConnectionEvents;
    protected methods: DeviceConnectionMethods;
    private receivers: ADeviceReceiver[] = [];
    private senders: ADeviceSender[] = [];
    private readonly localDevicesEmitter: EventEmitter = new EventEmitter();
    private receiverFactory: (userDevice: UserDevice) => ADeviceReceiver;
    private senderFactory: (device: Device, originUserId: string) => ADeviceSender;

    protected start(
        receiverFactory: (userDevice: UserDevice) => ADeviceReceiver,
        senderFactory: (device: Device, originUserId: string) => ADeviceSender
    ): void {
        this.receiverFactory = receiverFactory;
        this.senderFactory = senderFactory;
        this.receivers = this.deviceConference.activeDevices.map(
            this.receiverFactory
        );
        this.receivers.forEach(r => r.start());
        this.initSubscriptions();
    }

    private initSubscriptions(): void {
        this.events.onUserJoined(user => {
            const userRemoved = this.deviceConference.users.filter(u => u.userId !== user.userId);
            this.deviceConference.users = [...userRemoved, user];
        });
        this.events.onDeviceEvent((device, event) => {
            const receiver = this.getReceiver(device);
            if (!receiver) {
                console.warn('No receiver found for the event : ', event, device);
                return;
            }
            receiver.publishEvent(event);
        });
        this.events.onDeviceRequest((sernderId, device, event) => {
            const sender = this.getSender(device);
            if (sender) {
                sender.publishRequest(sernderId, event);
            }
        });
        this.events.onStartDeviceRequest((senderId, device, ...args) => {
            if (device.userId !== this.getUser().userId) {
                return;
            }
            this.senderFactory(device, senderId).start(...args);
        });
        this.events.onStopDeviceRequest((senderId, device, ...args: any[]) => {
            if (device.userId === this.getUser().userId) {
                this.getSender(device).stop(...args);
            }
        });
        this.events.onDeviceStarted(userDevice => {
            const device = this.receiverFactory(userDevice);
            if (!device) {
                console.warn('Cannot create', userDevice);
                return;
            }
            device.start();
        });
        this.events.onRTCInformations((senderId, userDevice, infos, targetType) => {
            if (targetType === 'RECEIVER') {
                this.getReceiver(userDevice).addRTCInformations(infos);
            }
            if (targetType === 'SENDER') {
                this.getSender(userDevice).addRTCInformations(senderId, infos);
            }
        });
        this.events.onDeviceStopped(device => this.getReceiver(device).stop());
    }
    public receiverStopped(device: ADeviceReceiver): void {
        this.receivers = this.receivers.filter(d => d !== device);
        this.localDevicesEmitter.emit('receiverStopped', device);
    }

    public receiverStarted(device: ADeviceReceiver): void {
        this.receivers.push(device);
        this.localDevicesEmitter.emit('receiverStarted', device);
    }

    public onLocalSenderStopped<T extends ADeviceSender>(action: (device: T) => any): () => void {
        this.localDevicesEmitter.addListener('senderStopped', action);
        return () => this.localDevicesEmitter.removeListener('senderStopped', action);
    }

    public onLocalSenderStarted<T extends ADeviceSender>(action: (device: T) => any): () => void {
        this.localDevicesEmitter.addListener('senderStarted', action);
        return () => this.localDevicesEmitter.removeListener('senderStarted', action);
    }

    public onLocalReceiverStopped<T extends ADeviceReceiver>(action: (device: T) => any): () => void {
        this.localDevicesEmitter.addListener('receiverStopped', action);
        return () => this.localDevicesEmitter.removeListener('receiverStopped', action);
    }

    public onLocalReceiverStarted<T extends ADeviceReceiver>(action: (device: T) => any): () => void {
        this.localDevicesEmitter.addListener('receiverStarted', action);
        return () => this.localDevicesEmitter.removeListener('receiverStarted', action);
    }

    private getReceiver(userDevice: UserDevice) {
        return this.receivers.find(d => d.deviceId === userDevice.id);
    }

    private getSender(userDevice: UserDevice) {
        return this.senders.find(d => d.deviceId === userDevice.id);
    }

    public startDeviceRequest(deviceId: string, ...args: any[]): Promise<void> {
        return this.methods.startDeviceRequest(deviceId, ...args);
    }

    public stopDeviceRequest(deviceId: string, ...args: any[]): Promise<void> {
        return this.methods.stopDeviceRequest(deviceId, ...args);
    }

    public async senderStopped(device: ADeviceSender): Promise<void> {
        this.senders = this.senders.filter(d => d !== device);
        await this.methods.senderStopped(device.deviceId);
        this.localDevicesEmitter.emit('senderStopped', device);
    }

    public async senderStarted(device: ADeviceSender): Promise<void> {
        this.senders.push(device);
        await this.methods.senderStarted(device.deviceId);
        this.localDevicesEmitter.emit('senderStarted', device);
    }

    public sendRTCInformations(
        userId: string,
        deviceId: string,
        rtcInfos: any,
        targetType: 'RECEIVER' | 'SENDER'
    ): Promise<void> {
        return this.methods.sendRTCInformations(userId, deviceId, rtcInfos, targetType);
    }

    public sendEvent(sender: ADeviceSender, event: Event): Promise<void> {
        return this.methods.sendEvent(sender.deviceId, event);
    }

    public sendRequest(receiver: ADeviceReceiver, request: Request): Promise<void> {
        return this.methods.sendRequest(receiver.deviceId, request);
    }

    public abstract getUser(): User;
}
