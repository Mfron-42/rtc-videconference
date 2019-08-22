import { Component, ViewChild, ElementRef, EventEmitter } from '@angular/core';
import { User } from './services/rtc-user.service';
import { TessanUser } from './models/tessan-devices/TessanUser';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public users: TessanUser[] = [
    {
      accessToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySWQiOiI1ZDIzZTdkNy03MjU1LTQ2MTYtYWE3Mi00ZmJjMTQxZDZmMzIiLCJGaXJzdG5hbWUiOiJtYXRpZW50IiwiTGFzdG5hbWUiOiJwYXR0aGlldSIsIkVtYWlsIjoibWF0dGhpZXVAdGVzc2FuLmlvIiwibmJmIjoxNTY2MjMyMjYzLCJleHAiOjE1NjYyMzU4NjMsImlhdCI6MTU2NjIzMjI2M30.BogSYqV0BUknE9BkH3xoejyMrXlTiWR_FP4Czm5oBYg',
      lastname: 'PATIENT',
      firstname: 'Patient Mat',
      tessanId: '980831df-917d-4193-bf1e-16da8a0b52db'
    }
  ];

  constructor() {
    setTimeout(() => {
      this.users.push({
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySWQiOiJmNDY4NmEyZS0xNDA5LTQxNGQtYmM3Zi03YWM3YzY0OTI1YzUiLCJGaXJzdG5hbWUiOiJNYXR0aGlldSIsIkxhc3RuYW1lIjoiRnJvbiIsIkVtYWlsIjoibWF0dGhpZXVAdGVzc2FuLmlvIiwibmJmIjoxNTY2MjMzOTU4LCJleHAiOjE1NjYyMzc1NTgsImlhdCI6MTU2NjIzMzk1OH0.-qnAVpoS1ekK1kt1rRk3JHHZ2mMiNDL9Zu2UuTcvdrg',
        lastname: 'DOCTOR',
        firstname: 'Doctor Mat',
        tessanId: '1848bb71-ee18-4269-98d3-ed385bf39848'
      });
    }, 2000);
  }
}
