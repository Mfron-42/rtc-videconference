import { Component, Input, ApplicationRef } from '@angular/core';
import { RTCUserService, User } from 'src/app/services/rtc-user.service';
import { RTCConnection, RTCReceiver, RTCInitiator } from 'light-rtc';

@Component({
  selector: 'app-rtc-connection',
  templateUrl: './rtc-connection.component.html',
  styleUrls: ['./rtc-connection.component.scss']
})
export class RTCConnectionComponent {
  @Input()
  public user: User;
  public mainStream: MediaStream;
  public usersPeer: UserPeer[] = [];

  constructor(private rtcUsers: RTCUserService, private appRef: ApplicationRef) {
    navigator.mediaDevices.getUserMedia({video : true})
      .then(stream => {
        this.mainStream = stream;
        this.initRTC();

      });
  }

  private initRTC(): void {
    this.rtcUsers.join(this.user).forEach(u => {
      const peer = new RTCReceiver(this.mainStream, (infos) => this.rtcUsers.sendInvitation(this.user, u, infos));
      peer.onMsg('channel-test', msg =>  console.log(u.id + ' receive : ' + msg));
      peer.send('channel-test', 'test message from ' + u.id);
      this.addUser(u, peer);

    });
    this.rtcUsers.userJoined.subscribe(u => {
      const peer =  new RTCInitiator(this.mainStream, (infos) => this.rtcUsers.sendInvitation(this.user, u, infos), undefined, {
        channels : ['channel-test']
      });
      peer.onMsg('channel-test', msg =>  console.log(u.id + ' receive : ' + msg));
      peer.send('channel-test', 'test message from ' + u.id);
      this.addUser(u, peer);
    });
    this.rtcUsers.onInvitation(this.user, (invitation, user) => this.getPeer(user).addInformations(invitation));
  }

  private getPeer(user: User): RTCConnection {
    return this.usersPeer.find(p => p.user === user).peer;
  }

  private addUser(user: User, connection: RTCConnection): void {
    const userPeer = {
      user,
      peer : connection,
      stream : undefined
    };
    userPeer.peer.onStream(stream => {
      userPeer.stream = stream;
      this.appRef.tick();
    });
    this.usersPeer.push(userPeer);
  }
}

export class UserPeer {
  user: User;
  peer: RTCConnection;
  stream: MediaStream;
}
