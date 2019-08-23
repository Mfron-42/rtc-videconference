import {
  HubConnection,
  HubConnectionBuilder,
  HttpTransportType
} from '@aspnet/signalr';
import { EventEmitter } from 'events';
import { TessanUser } from './TessanUser';
import { Event } from './Events';
import { ADeviceReceiver } from './ADeviceReceiver';
import { ADeviceSender } from './ADeviceSender';
import { Request } from './Request';
import { DeviceConference, User, Device } from './DeviceConference';
import { UserDevice } from './DeviceConference';
import { DeviceConnectionEvents } from './DeviceConnectionEvents';
import { DeviceConnectionMethods } from './DeviceConnectionMethods';
import { ADeviceManager } from './DeviceManager';

export class DeviceConnection extends ADeviceManager {
  private connection: HubConnection;
  private user: User;
  private readonly tessanUser: TessanUser;
  private readonly conferenceId: string;


  constructor(serverUrl: string, user: TessanUser, conferenceId: string) {
    super();
    this.tessanUser = user;
    this.conferenceId = conferenceId;
    this.connection = new HubConnectionBuilder()
      .withUrl(serverUrl, {
        transport: HttpTransportType.WebSockets,
        skipNegotiation: true,
        accessTokenFactory: () => this.tessanUser.accessToken
      })
      .build();
    this.events = new DeviceConnectionEvents(this.connection);
    this.methods = new DeviceConnectionMethods(this.connection);
    this.events.onUserJoined(u => this.updateUser(u));
    this.events.onUserLeft(u => this.updateUser(u));
    this.events.onDebug(console.log);
  }

  public async connect(
    devices: string[],
    receiverFactory: (userDevice: UserDevice) => ADeviceReceiver,
    senderFactory: (device: Device, originUserId: string) => ADeviceSender
  ): Promise<void> {
    await this.connection.start();
    this.deviceConference = await this.connection.invoke(
      'join',
      this.conferenceId,
      devices
    );
    this.user = this.deviceConference.users.find(
      u => u.userId === this.tessanUser.tessanId
    );
    this.start(receiverFactory, senderFactory);
  }

  public updateUser(user: User): void {
    this.deviceConference.users = [
      ...this.deviceConference.users.filter(u => u.userId !== user.userId),
      user
    ];
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
}
