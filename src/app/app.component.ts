import { Component, ViewChild, ElementRef, EventEmitter } from '@angular/core';
import { Authentification as PatientAuth, Patient } from './tessan/patient/authentication';
import { Authentification as DoctorAuth, Doctor } from './tessan/doctor/authentication';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private patientCredential = {
    login : 'matthieu@patient.io',
    password : '123456'
  };

  private doctorCredential = {
    login : 'matthieu@tessan.io',
    password : '123456'
  };

  public doctor: Doctor;
  public patient: Patient;


  constructor() {

    setTimeout(() => {
      PatientAuth.login(this.patientCredential.login, this.patientCredential.password)
      .then(patient => this.patient = patient);
    }, 2000);

    DoctorAuth.login(this.doctorCredential.login, this.doctorCredential.password)
      .then(doctor => this.doctor = doctor);

    // doctorService.login(this.doctorCredential.login, this.doctorCredential.password)
    //   .then(user => this.doctor = user);

    // patientService.login(this.patientCredential.login, this.patientCredential.password)
    //   .then(user => this.patient = user);
  }
}

