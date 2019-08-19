import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { RTCInformation } from 'light-rtc';

@Injectable({
    providedIn : 'root'
})
export class RTCUserService {
    private users: User[] = [];
    public userJoined: Subject<User> = new Subject<User>();
    public userLeft: Subject<User> = new Subject<User>();
    private invitationSent: Subject<{invitation: RTCInformation, source: User, dest: User}> = new Subject<{invitation: RTCInformation, source: User,  dest: User}>();

    public onInvitation(user: User, func: (invitation: RTCInformation, user: User) => any): void {
        this.invitationSent.subscribe(inv => {
            if (inv.dest !== user) {
                return;
            }
            func(inv.invitation, inv.source);
        });
    }

    public join(user: User): User[] {
        const currentUsers = this.users;
        this.users = [...currentUsers, user];
        this.userJoined.next(user);
        return currentUsers;
    }

    public leave(user: User) {
        this.users = this.users.filter(u => u !== user);
        this.userLeft.next(user);
    }

    public sendInvitation(source: User, dest: User, invitation: RTCInformation): void {
        this.invitationSent.next({source, invitation, dest});
    }
}

export interface User {
    id: number;
}
