import { Component, OnInit, Input } from '@angular/core';
import { Doctor } from 'src/app/tessan/doctor/authentication';
import { ConsultationClient, MatchingClient, Invitation, ConsultationUser } from 'src/app/tessan/doctor';
import { Consultation } from 'src/app/tessan/doctor';

@Component({
  selector: 'app-doctor',
  templateUrl: './doctor.component.html',
  styleUrls: []
})
export class DoctorComponent implements OnInit {

  @Input()
  private doctor: Doctor;
  private consultationClient: ConsultationClient;
  private matchingClient: MatchingClient;
  public inviations: Invitation[];
  public streams: {user: ConsultationUser, stream: MediaStream}[] = [];
  public consultation: Consultation;
  public chatHistory: ChatMessage[] = [];

  constructor() {
  }

  private async initConsultation() {
    const localStream = await navigator.mediaDevices.getUserMedia({video : true });
    this.consultationClient.onStream((user, stream) => this.streams.push({user, stream}));
    this.consultationClient.onChatMessage((sender: ConsultationUser, text: string) =>  this.chatHistory.push({sender, text}));
    this.consultation = await this.consultationClient.Connect(localStream);
    this.inviations = [];
  }

  ngOnInit() {
    this.matchingClient = new MatchingClient(this.doctor);
    this.matchingClient.onInvitations(invitations => this.inviations = invitations);
    this.matchingClient.onConsultation(consultation => {
      this.consultationClient = new ConsultationClient(this.doctor);
      this.initConsultation();
    });
    this.matchingClient.Connect();
  }

  public onSendText(event: KeyboardEvent): void {
    const input = event.srcElement as HTMLInputElement;
    this.consultationClient.sendChatMessage(input.value);
    input.value = '';
  }

  public accepteInvitation(invitation: Invitation): void {
    this.matchingClient.acceptInvitation(invitation.userId);
  }

  public refuseInvitation(invitation: Invitation): void {
    this.matchingClient.refuseInvitation(invitation.userId);
  }

  public abortConsultation(): void {
    this.consultationClient.abort();
  }
}

interface ChatMessage {
  sender: ConsultationUser;
  text: string;
}

