import { Component, Input, ApplicationRef, OnInit } from '@angular/core';
import { RTCUserService, User } from 'src/app/services/rtc-user.service';
import { RTCConnection, RTCReceiver, RTCInitiator } from 'light-rtc';
import { DeviceConnection } from 'src/app/models/tessan-devices/DeviceConnection';
import { AVideoDeviceReceiver } from 'src/app/models/tessan-devices/AVideoDeviceReceiver';
import { AVideoDeviceSender } from 'src/app/models/tessan-devices/AVideoDeviceSender';
import { TessanUser } from 'src/app/models/tessan-devices/TessanUser';

@Component({
  selector: 'app-rtc-connection',
  templateUrl: './rtc-connection.component.html',
  styleUrls: ['./rtc-connection.component.scss']
})
export class RTCConnectionComponent implements OnInit {

  @Input()
  public user: TessanUser;
  public mainStream: MediaStream;
  public usersPeer: UserPeer[] = [];

  constructor() {

  }

  ngOnInit(): void {
    const deviceConfId = '';
    const devices = ['BLABLASCOPE'];
    const serverUrl = this.user.lastname === 'DOCTOR' ?
      'http://192.168.1.119/TelemedicineDoctor' : 'http://192.168.1.119/TelemedicinePatient';
    const deviceConnection = new DeviceConnection(serverUrl + '/hubs/device-conference', this.user, deviceConfId);
    const conference = deviceConnection
    .connect(devices, userDevice => {
      return new AVideoDeviceReceiver(deviceConnection, userDevice);
    }, (deviceId, deviceName) => {
      return new AVideoDeviceSender(deviceConnection,  'a');
    });
    deviceConnection.startDeviceRequest('lol');
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
