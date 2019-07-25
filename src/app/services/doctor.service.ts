import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { RTCInformation } from "light-rtc";
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AUserService, User } from './a-user.service';
import { HubConnection } from '@aspnet/signalr';

@Injectable({
    providedIn : "root"
})
export class DoctorService extends AUserService
{
    public userType: string = "Doctor";
    public readonly serverURL : string = "http://telemedicinedoctorserver-qa.azurewebsites.net";
    
    public constructor(http : HttpClient) {
        super(http);
    }

    public configure(doctor: Doctor): AUserService {
        const service = new DoctorService(this.http);
        service.setUser(doctor);
        return service;
    }

    public hubConnection() : HubConnection {
        return super.buildConnection("/hubs/waiting-room");
    }

    public login(email : string, password : string) : Promise<Doctor> {
        return super.login(email, password, "/api/doctor/login") as  Promise<Doctor>;
    }
}

export interface Doctor extends User {
}
  