import { RTCConnectionComponent } from "./components/rtc-connection/rtc-connection.component";

import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { DoctorService } from './services/doctor.service';
import { HttpClientModule } from '@angular/common/http';
import { PatientService } from './services/patient.service';

@NgModule({
  declarations: [
    AppComponent,
    RTCConnectionComponent
  ],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule],
  providers: [DoctorService, PatientService],
  bootstrap: [AppComponent]
})
export class AppModule {}
