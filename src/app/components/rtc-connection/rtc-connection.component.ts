import { Component, Input, ApplicationRef, OnInit } from "@angular/core";
import { DoctorService } from 'src/app/services/doctor.service';
import { RTCConnection, RTCReceiver, RTCInitiator, RTCInformation } from "light-rtc";
import { HubConnectionBuilder, HttpTransportType, HubConnection, HubConnectionState } from "@aspnet/signalr";
import { User, AUserService, Invitation, Consultation, ConsultationUser, Option, ConnectionStatus } from 'src/app/services/a-user.service';


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
  public usersPeer: UserPeer[] = [];
  public invitations : Invitation[];
  private matchingConnection : HubConnection;
  private consultationConnection : HubConnection;
  private consultation : Consultation;
  public messages : Message[] = [];

  constructor(private appRef: ApplicationRef) {
    navigator.mediaDevices.getUserMedia({ video: true, audio : true })
      .then(stream => {
        this.mainStream = stream;
      });
  }

  public ngOnInit() {
    this.userService = this.userService.configure(this.user);
    this.initMatching();
  }

  public acceptInvitation(invitation : Invitation) : void {
    this.matchingConnection.invoke("acceptInvitation", invitation.userId);
  }

  public refuseInvitation(invitation : Invitation) : void {
    this.matchingConnection.invoke("refuseInvitation", invitation.userId);
  }

  public isConnectedToMatching() : boolean {
    return this.matchingConnection && this.matchingConnection.state == HubConnectionState.Connected;
  }

  public isConnectedToConsultation() : boolean {
    return this.consultationConnection && this.consultationConnection.state == HubConnectionState.Connected;
  }

  private initMatching(): void {
    this.matchingConnection = this.userService.matchingConnection();
    this.matchingConnection.start()
      .then(() => {
        this.log("Connected");
        this.log("Invoking join");
        return this.matchingConnection.invoke("join");
      })
      .then(() => {
        this.log("Matching joined");
        this.log("Wait for invitation");
      });
      this.matchingConnection.on("invitations", (...invitations) => {
        this.invitations = invitations;
        this.log("invitations received", invitations);
      });
      this.matchingConnection.onclose(e => {
        this.warn("Connection closed", e);
      });
      this.matchingConnection.on("consultation", consultation => {
        this.log("Consultation received");
        this.onConsultation();
        this.matchingConnection.stop();
      });
  }

  private onConsultation() : void {
    this.consultationConnection = this.userService.consultationConnection();
    this.consultationConnection.start()
      .then(() => this.log("Connected to the consultation hub"))
      .then(() => this.consultationConnection.invoke("join"))
      .then(consultation => { 
        this.log("Consultation joined", consultation)
        this.consultation = consultation;
        const users = this.getVideoConferenceUsers(consultation, "CONNECTED");
        this.log("Create peer for ", users);
        users.map(u => { 
          const peer = new RTCReceiver(this.mainStream, infos => this.sendRTCInformations(u.userId, infos));
          this.addUser(u, peer);
        });
      });
    this.consultationConnection.on("userJoined", user => {
      this.log("user joined", user);
      const peer = new RTCInitiator(this.mainStream, infos => this.sendRTCInformations(user.userId, infos));
      this.addUser(user, peer);
    });

    this.consultationConnection.on("userLeft", user => {
      this.log("remove user", user);
      this.removeUser(user);
    });

    this.consultationConnection.on("rtcConferenceHandshake", (userId, infos) => {
      const userpeer = this.getPeer(userId);
      userpeer.addInformations(infos);
    });
    this.consultationConnection.on("chatMessage", (senderId : string, message : string) => {
      this.messages.push({ user : this.getUser(senderId), text : message })
    });
  }


  public sendChatMessage(event: KeyboardEvent) : void {
    const input = event.srcElement as HTMLInputElement;
    this.consultationConnection.invoke("sendChatMessage", input.value);
    this.messages.push({ user : this.getUser(this.user.id), text : input.value});
    input.value = "";
  }

  private sendRTCInformations(userId : string, informations:  RTCInformation) {
    this.consultationConnection.send("sendRTCHandshake", userId, informations);
  }

  private log(...params : any ){
    console.log(...[this.userService.userType + " : ", ...params]);
  }

  private warn(...params : any ){
    console.warn(...[this.userService.userType + " : ", ...params]);
  }

  private getVideoConferenceUsers(consultation : Consultation, connectionStatus : ConnectionStatus) : ConsultationUser[] {
    return this.getUsers(consultation)
      .filter(u => u)
      .filter(u => u.status == connectionStatus)
      .filter(u  => u.enabledOptions.includes("VIDEO_CONFERENCE"))
      .filter(u => u.userId != this.user.tessanId);
  }

  private getUsers(consultation: Consultation) : ConsultationUser[]{
    return [consultation.patient, consultation.doctor, ...consultation.guests]
      .filter(u => u.userId != this.user.tessanId);
  }

  private getPeer(userId: string): RTCConnection {
    return this.getUserPeer(userId).peer;
  }

  private getUser(userId: string): ConsultationUser {
    return this.getUserPeer(userId).user;
  }

  private getUserPeer(userId: string): UserPeer {
    return this.usersPeer.find(p => p.user.userId == userId);
  }

  private addUser(user: ConsultationUser, connection: RTCConnection): void {
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

  
  private removeUser(user: ConsultationUser): void {
    const userPeer = this.getUserPeer(user.userId);
    userPeer.peer.getPeer().close(); 
    userPeer.stream = undefined;
    userPeer.peer = undefined;
  }
}

export class UserPeer {
  user: ConsultationUser;
  peer: RTCConnection;
  stream: MediaStream;
}

export class Message {
  user : ConsultationUser;
  text : string;
}