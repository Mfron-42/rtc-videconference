import { Component, ViewChild, ElementRef, EventEmitter } from "@angular/core";
import { DoctorService, Doctor } from './services/doctor.service';
import { User } from './services/a-user.service';
import { PatientService } from './services/patient.service';
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  private patientCredential = {
    login : "matthieu@patient.io",
    password : "123456"
  }

  private doctorCredential = {
    login : "matthieu@tessan.io",
    password : "123456"
  }

  public doctor : Doctor;
  public patient : Doctor;

  constructor(public doctorService : DoctorService, public patientService : PatientService) {
    setTimeout(() => {
      doctorService.login(this.doctorCredential.login, this.doctorCredential.password)
      .then(user => this.doctor = user);
    }, 10000);
    patientService.login(this.patientCredential.login, this.patientCredential.password)
      .then(user => this.patient = user);
  }


}

