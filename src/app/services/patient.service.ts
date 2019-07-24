import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AUserService, User } from './a-user.service';
import { HubConnection } from '@aspnet/signalr';

@Injectable({
    providedIn : "root"
})
export class PatientService extends AUserService
{
    public readonly serverURL : string = "http://telemedicinepatientserver-qa.azurewebsites.net";
    
    public constructor(http : HttpClient) {
        super(http);
    }

    public configure(doctor: Patient): AUserService {
        const service = new PatientService(this.http);
        service.setUser(doctor);
        return service;
    }

    public hubConnection() : HubConnection {
        return super.buildConnection("/hubs/waiting-room");
    }

    public login(email : string, password : string) : Promise<Patient> {
        return super.login(email, password, "/api/patient/login") as  Promise<Patient>;
    }
}

export interface Patient extends User {
}
  