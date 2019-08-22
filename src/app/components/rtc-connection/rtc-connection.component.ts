import { Component, Input, ApplicationRef, OnInit } from '@angular/core';
import { RTCUserService, User } from 'src/app/services/rtc-user.service';
import { RTCConnection, RTCReceiver, RTCInitiator } from 'light-rtc';
import { DeviceConnection } from 'src/app/models/tessan-devices/DeviceConnection';
import { AVideoDeviceReceiver } from 'src/app/models/tessan-devices/AVideoDeviceReceiver';
import { AVideoDeviceSender } from 'src/app/models/tessan-devices/AVideoDeviceSender';
import { TessanUser } from 'src/app/models/tessan-devices/TessanUser';
import { DeviceConference } from 'src/app/models/tessan-devices/DeviceConference';
import { ADeviceReceiver } from 'src/app/models/tessan-devices/ADeviceReceiver';

@Component({
  selector: 'app-rtc-connection',
  templateUrl: './rtc-connection.component.html',
  styleUrls: ['./rtc-connection.component.scss']
})
export class RTCConnectionComponent implements OnInit {
  @Input()
  public user: TessanUser;
  public mainStream: MediaStream;
  public deviceConnection: DeviceConnection;
  public videoDevices: AVideoDeviceReceiver[] = [];

  constructor() { }

  ngOnInit(): void {
    const deviceConfId = '03f9202a-b2ec-4042-bae0-57ae43980eb0';
    const devices = ['BLABLASCOPE'];
    const serverUrl =
      this.user.lastname === 'DOCTOR'
        ? 'http://192.168.1.119:42924'
        : 'http://192.168.1.119:51051';
    this.deviceConnection = new DeviceConnection(
      serverUrl + '/hubs/device-conference',
      this.user,
      deviceConfId
    );
    const conference = this.deviceConnection.connect(
      devices,
      userDevice => {
        const device = new AVideoDeviceReceiver(this.deviceConnection, userDevice);
        return device;
      },
      (device, originId) => {
        return new AVideoDeviceSender(this.deviceConnection, device);
      }
    );

    this.deviceConnection.onReceiverStarted((receiver) => {
      console.log('Receiver started', receiver);
      receiver.sendRequest({ type: 'test', content: 'lol' });
    });
    this.deviceConnection.onSenderStarted((sender) => {
      console.log('Sender started', sender);
      sender.sendEvent({ type: 'test', content: 'lol' });
    });
  }

  public requestDevice() {
    const device = this.deviceConnection.getUsers()[0].availableDevices[0];
    if (!device) { return; }
    console.log('Start request', device);
    this.deviceConnection.startDeviceRequest(device.id);
  }

  private getDeviceInfos(deviceName: RegExp): Promise<MediaDeviceInfo> {
    return navigator.mediaDevices.enumerateDevices().then(devices => {
      return devices.find(device => {
        const deviceLabel = device.label.toLocaleLowerCase();
        return deviceName.test(deviceLabel);
      });
    });
  }
}

export class UserPeer {
  user: User;
  peer: RTCConnection;
  stream: MediaStream;
}
