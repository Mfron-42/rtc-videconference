import { Component, OnInit, Input } from '@angular/core';
import { Patient } from 'src/app/tessan/patient/authentication';
import { ConsultationClient, MatchingClient, Invitation, Consultation } from 'src/app/tessan/patient';
import { ConsultationUser } from 'src/app/tessan/patient';

@Component({
  selector: 'app-patient',
  templateUrl: './patient.component.html',
  styleUrls: []
})
export class PatientComponent implements OnInit {

  @Input()
  private patient: Patient;
  private consultationClient: ConsultationClient;
  private matchingClient: MatchingClient;
  public inviations: Invitation[];
  public consultation: Consultation;
  public streams: {user: ConsultationUser, stream: MediaStream}[] = [];
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
    this.matchingClient = new MatchingClient(this.patient);
    this.matchingClient.onInvitations(invitations => this.inviations = invitations);
    this.matchingClient.onConsultation(consultation => {
      this.consultationClient = new ConsultationClient(this.patient);
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
