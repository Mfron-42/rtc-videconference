import {
  HubConnection,
  HubConnectionBuilder,
  HttpTransportType
} from '@aspnet/signalr';
import { EventEmitter } from 'events';
import { TessanUser } from './TessanUser';
import { Event } from './Events';
import { ADeviceReceiver, EmptyDeviceReceiver } from './ADeviceReceiver';
import { ADeviceSender } from './ADeviceSender';
import { Request } from './Request';
import { RTCInformation } from 'light-rtc';
import { DeviceConference, User, Device } from './DeviceConference';
import { UserDevice } from './DeviceConference';

const CONNECTION_EVENTS = {
  CLOSE: 'CLOSE',
  DEBUG: 'DEBUG'
};

const SERVER_EVENTS = {
  DEVICE_REQUEST: 'deviceRequest',
  DEVICE_EVENT: 'deviceEvent',
  USER_JOINED: 'userJoined',
  START_DEVICE_REQUEST: 'startDeviceRequest',
  STOP_DEVICE_REQUEST: 'stopDeviceRequest',
  DEVICE_RTC_INFOS: 'RTCInfos',
  DEVICE_STARTED: 'deviceStarted',
  DEVICE_STOPPED: 'deviceStopped'
};

const SERVER_METHODES = {
  SEND_RTC_INFOS: 'sendRTCInfos',
  CREATE_REQUEST: 'createRequest',
  CREATE_EVENT: 'createEvent',
  STOP_DEVICE_REQUEST: 'stopDeviceRequest',
  START_DEVICE_REQUEST: 'startDeviceRequest',
  DEVICE_STARTED: 'deviceStarted',
  DEVICE_STOPPED: 'deviceStopped'
};

export class DeviceConnection {
  private connection: HubConnection;
  private eventEmitter: EventEmitter = new EventEmitter();
  private receivers: ADeviceReceiver[] = [];
  private senders: ADeviceSender[] = [];
  private receiversFactory: (userDevice: UserDevice) => ADeviceReceiver;
  private sendersFactory: (
    device: Device,
    originUserId: string
  ) => ADeviceSender;
  private readonly tessanUser: TessanUser;
  private deviceConference: DeviceConference;
  private user: User;
  private readonly conferenceId: string;
  private readonly localDevicesEmitter: EventEmitter = new EventEmitter();

  constructor(serverUrl: string, user: TessanUser, conferenceId: string) {
    this.tessanUser = user;
    this.conferenceId = conferenceId;
    this.connection = new HubConnectionBuilder()
      .withUrl(serverUrl, {
        transport: HttpTransportType.WebSockets,
        skipNegotiation: true,
        accessTokenFactory: () => this.tessanUser.accessToken
      })
      .build();
    Object.values(SERVER_EVENTS).forEach(key => this.subscribe(key));
    this.connection.onclose(error =>
      this.eventEmitter.emit(CONNECTION_EVENTS.CLOSE, error)
    );
    this.initSubscriptions();
  }

  public async connect(
    devices: string[],
    receiversFactory: (userDevice: UserDevice) => ADeviceReceiver,
    sendersFactory: (device: Device, originUserId: string) => ADeviceSender
  ): Promise<void> {
    this.receiversFactory = receiversFactory;
    this.sendersFactory = sendersFactory;
    await this.connection.start();
    this.deviceConference = await this.connection.invoke(
      'join',
      this.conferenceId,
      devices
    );
    this.user = this.deviceConference.users.find(
      u => u.userId === this.tessanUser.tessanId
    );
    this.receivers = this.deviceConference.activeDevices.map(
      this.receiversFactory
    );
    this.receivers.forEach(r => r.start());
  }

  public getAllUsers(): User[] {
    return this.deviceConference.users;
  }

  public getUser(): User {
    return this.user;
  }

  public getUsers(): User[] {
    return this.getAllUsers().filter(u => u.userId !== this.getUser().userId);
  }

  private initSubscriptions(): void {
    this.onUserJoined(user => {
      const userRemoved = this.deviceConference.users.filter(u => u.userId !== user.userId);
      this.deviceConference.users = [...userRemoved, user];
    });
    this.onDeviceEvent((device, event) =>
      this.getReceiver(device).publishEvent(event)
    );
    this.onDeviceRequest((sernderId, device, event) =>
      this.getSender(device).publishRequest(origin, event)
    );
    this.onStartDeviceRequest((senderId, device, ...args) => {
      if (device.userId !== this.user.userId) {
        return;
      }
      this.sendersFactory(device, senderId).start(...args);
    });
    this.onDeviceStarted(userDevice => {
      const device =
        this.receiversFactory(userDevice) ||
        new EmptyDeviceReceiver(this, userDevice);
      device.start();
    });
    this.onStopDeviceRequest((senderId, device, ...args: any[]) =>
      this.getSender(device).stop(...args)
    );
    this.onDeviceStopped(device => this.getReceiver(device).stop());
  }

  public async senderStopped(device: ADeviceSender): Promise<void> {
    this.senders = this.senders.filter(d => d !== device);
    await this.connection.send(
      SERVER_METHODES.DEVICE_STOPPED,
      device.deviceId
    );
    this.localDevicesEmitter.emit('senderStopped', device);
  }

  public async senderStarted(device: ADeviceSender): Promise<void> {
    this.senders.push(device);
    await this.connection.send(
      SERVER_METHODES.DEVICE_STARTED,
      device.deviceId
    );
    this.localDevicesEmitter.emit('senderStarted', device);
  }

  public receiverStopped(device: ADeviceReceiver): void {
    this.receivers = this.receivers.filter(d => d !== device);
    this.localDevicesEmitter.emit('receiverStopped', device);
  }

  public receiverStarted(device: ADeviceReceiver): void {
    this.receivers.push(device);
    this.localDevicesEmitter.emit('receiverStarted', device);
  }

  public onSenderStopped<T extends ADeviceSender>(action: (device: T) => any): () => void {
    this.localDevicesEmitter.addListener('senderStopped', action);
    return () => this.localDevicesEmitter.removeListener('senderStopped', action);
  }

  public onSenderStarted<T extends ADeviceSender>(action: (device: T) => any): () => void {
    this.localDevicesEmitter.addListener('senderStarted', action);
    return () => this.localDevicesEmitter.removeListener('senderStarted', action);
  }

  public onReceiverStopped<T extends ADeviceReceiver>(action: (device: T) => any): () => void {
    this.localDevicesEmitter.addListener('receiverStopped', action);
    return () => this.localDevicesEmitter.removeListener('receiverStopped', action);
  }

  public onReceiverStarted<T extends ADeviceReceiver>(action: (device: T) => any): () => void {
    this.localDevicesEmitter.addListener('receiverStarted', action);
    return () => this.localDevicesEmitter.removeListener('receiverStarted', action);
  }

  private getReceiver(userDevice: UserDevice) {
    return this.receivers.find(d => d.deviceId === userDevice.id);
  }

  private getSender(userDevice: UserDevice) {
    return this.senders.find(d => d.deviceId === userDevice.id);
  }

  private onDeviceRequest(
    action: (senderId: string, userDevice: UserDevice, request: Request) => any
  ): () => void {
    this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_REQUEST, action);
    return () =>
      this.eventEmitter.removeListener(SERVER_EVENTS.DEVICE_REQUEST, action);
  }

  private onDeviceEvent(
    action: (userDevice: UserDevice, event: Event) => any
  ): () => void {
    this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_EVENT, action);
    return () =>
      this.eventEmitter.removeListener(SERVER_EVENTS.DEVICE_EVENT, action);
  }


  private onUserJoined(
    action: (user: User) => any
  ): () => void {
    this.eventEmitter.addListener(SERVER_EVENTS.USER_JOINED, action);
    return () =>
      this.eventEmitter.removeListener(SERVER_EVENTS.USER_JOINED, action);
  }

  private onDeviceStarted(action: (userDevice: UserDevice) => any): () => void {
    this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_STARTED, action);
    return () =>
      this.eventEmitter.removeListener(SERVER_EVENTS.DEVICE_STARTED, action);
  }

  private onDeviceStopped(action: (userDevice: UserDevice) => any): () => void {
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
    this.eventEmitter.addListener(SERVER_EVENTS.DEVICE_STOPPED, action);
    return () =>
      this.eventEmitter.removeListener(
        SERVER_EVENTS.STOP_DEVICE_REQUEST,
        action
      );
  }

  public onRTCInfos(
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

  public sendRTCInfos(
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

  public sendEvent(sender: ADeviceSender, event: Event): Promise<void> {
    return this.connection.send(
      SERVER_METHODES.CREATE_EVENT,
      sender.deviceId,
      event
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

  public sendRequest(
    receiver: ADeviceReceiver,
    request: Request
  ): Promise<void> {
    return this.connection.send(
      SERVER_METHODES.CREATE_REQUEST,
      receiver.deviceId,
      request
    );
  }

  private subscribe(event: string): void {
    this.connection.on(event, (...args) => {
      this.eventEmitter.emit(event, ...args);
      this.eventEmitter.emit(CONNECTION_EVENTS.DEBUG, ...args);
    });
  }

  public onDebug(func: (...args: any[]) => any): () => void {
    this.eventEmitter.addListener(CONNECTION_EVENTS.DEBUG, func);
    return () =>
      this.eventEmitter.removeListener(CONNECTION_EVENTS.DEBUG, func);
  }
}
