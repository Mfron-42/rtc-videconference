import { Component, Input, ApplicationRef, OnInit } from "@angular/core";
import { DoctorService } from 'src/app/services/doctor.service';
import { RTCConnection, RTCReceiver, RTCInitiator } from "light-rtc";
import { HubConnectionBuilder, HttpTransportType } from "@aspnet/signalr";
import { User, AUserService } from 'src/app/services/a-user.service';


@Component({
  selector: "app-rtc-connection",
  templateUrl: "./rtc-connection.component.html",
  styleUrls: ["./rtc-connection.component.scss"]
})
export class RTCConnectionComponent implements OnInit{
  @Input()
  public user: User;
  @Input()
  public userService : AUserService;
  public mainStream: MediaStream;
  public usersPeer: UserPeer[] = []

  constructor(private appRef: ApplicationRef) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        this.mainStream = stream;
        this.initRTC();
      });
  }

  public ngOnInit() {
    this.userService = this.userService.configure(this.user);
    this.initSignalR();
  }

  private initSignalR(): void {
    let connection = this.userService.hubConnection();
    connection.start()
      .then(() => {
        this.log("Connected");
        this.log("Invoking join");
        return connection.invoke("join");
      })
      .then(() => {
        this.log("Matching joined");
        this.log("Wait for invitation");
      });
      connection.on("invitations", (invitations) => {
        this.log("invitations received", invitations);
      });
      connection.onclose(e => {
        this.warn("Connection closed", e);
      });
  }

  private log(...params : any ){
    console.log(...[this.userService.userType, ...params]);
  }

  private warn(...params : any ){
    console.warn(...[this.userService.userType, ...params]);
  }

  private initRTC(): void {
    // this.userService.join(this.user).forEach(u => {
    //   const peer = new RTCReceiver(this.mainStream, (infos) => this.doctorService.sendInvitation(this.user, u, infos));
    //   this.addUser(u, peer);
    // });
    // this.doctorService.userJoined.subscribe(u => {
    //   const peer = new RTCInitiator(this.mainStream, (infos) => this.doctorService.sendInvitation(this.user, u, infos));
    //   this.addUser(u, peer);
    // });
    // this.doctorService.onInvitation(this.user, (invitation, user) => this.getPeer(user).addInformations(invitation));
  }

  private getPeer(user: User): RTCConnection {
    return this.usersPeer.find(p => p.user == user).peer;
  }

  private addUser(user: User, connection: RTCConnection): void {
    const userPeer = {
      user,
      peer: connection,
      stream: undefined
    };
    userPeer.peer.onStream(stream => {
      userPeer.stream = stream;
      this.appRef.tick();
    })
    this.usersPeer.push(userPeer);
  }
}

export class UserPeer {
  user: User;
  peer: RTCConnection;
  stream: MediaStream;
}