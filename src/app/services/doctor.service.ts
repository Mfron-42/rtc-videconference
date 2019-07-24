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
    public readonly serverURL : string = "http://192.168.43.28:5000";
    private users : User[] = [];
    public userJoined : Subject<User> = new Subject<User>();
    public userLeft : Subject<User> = new Subject<User>();
    private invitationSent : Subject<{invitation : RTCInformation, source: User, dest: User}> = new Subject<{invitation : RTCInformation, source: User,  dest: User}>();

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

    public onInvitation(user : User, func : (invitation : RTCInformation, user : User) => any) : void {
        this.invitationSent.subscribe(inv => {
            if (inv.dest !== user)
                return;
            func(inv.invitation, inv.source);
        })
    }

    public login(email : string, password : string) : Promise<Doctor> {
        return super.login(email, password, "/api/doctor/login") as  Promise<Doctor>;
    }    

    public join(user : User) : User[] {
        const currentUsers = this.users;
        this.users = [...currentUsers, user];
        this.userJoined.next(user);
        return currentUsers;
    }

    public leave(user : User){
        this.users = this.users.filter(u => u != user);
        this.userLeft.next(user);
    }

    public sendInvitation(source:  User, dest: User, invitation : RTCInformation) : void {
        this.invitationSent.next({source, invitation, dest});
    }
}

export interface Doctor extends User {
}
  