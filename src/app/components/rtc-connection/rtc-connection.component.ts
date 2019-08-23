import { Component, Input, ApplicationRef, OnInit } from '@angular/core';
import { RTCUserService, User } from 'src/app/services/rtc-user.service';
import { RTCConnection, RTCReceiver, RTCInitiator } from 'light-rtc';
import { DeviceConnection } from 'src/app/models/tessan-devices/DeviceConnection';
import { VideoDeviceReceiver } from 'src/app/models/tessan-devices/VideoDeviceReceiver';
import { VideoDeviceSender } from 'src/app/models/tessan-devices/VideoDeviceSender';
import { TessanUser } from 'src/app/models/tessan-devices/TessanUser';
import { DeviceConference } from 'src/app/models/tessan-devices/DeviceConference';
import { ADeviceReceiver } from 'src/app/models/tessan-devices/ADeviceReceiver';
import { ADeviceSender } from 'src/app/models/tessan-devices/ADeviceSender';
import { DeviceEvents } from 'src/app/models/tessan-devices/Events';
import { DeviceRequests } from 'src/app/models/tessan-devices/Request';

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
  public videoDevices: VideoDeviceReceiver[] = [];

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
        const device = new OxymeterReceiver(this.deviceConnection, userDevice);
        return device;
      },
      (device, originId) => {
        switch (device.name) {

        }
        if (device.name == 'OXYMETER') {
          return new OxymeterSender(this.deviceConnection, device);
        }
      }
    );


    this.deviceConnection.onLocalReceiverStarted((receiver) => {
      this.videoDevices.push(receiver as any);
    });
  }

  public startDeviceRequest() {
    const device = this.deviceConnection.getUsers()[0].availableDevices[0];
    if (!device) { return; }
    this.deviceConnection.startDeviceRequest(device.id);
  }
}

class OtoscopeSender extends VideoDeviceSender {
  public start(...params: any[]): Promise<any> {
    return navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => super.start(stream));
  }
}

class OxymeterReceiver extends ADeviceReceiver {
  public init(events: DeviceEvents) {
    events.onEvent('OXYGENE', (event) => console.log(event.content.value));
  }
}

class OxymeterSender extends ADeviceSender {
  public init(request: DeviceRequests) {
    setInterval(() => this.sendEvent({ type: 'OXYGENE', content: { value: 4 } }), 1000);
  }
}

export class UserPeer {
  user: User;
  peer: RTCConnection;
  stream: MediaStream;
}
