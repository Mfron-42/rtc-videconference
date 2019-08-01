import { HubConnection, HubConnectionBuilder, HttpTransportType } from '@aspnet/signalr';
import { SERVER_URL } from './config';
import { EventEmitter } from 'events';
import { Consultation } from './consultation';
import { ConsultationUser, ConsultationDoctor} from './ConsultationUser';
import { RTCConnection, RTCReceiver, RTCInformation, RTCInitiator } from 'light-rtc';
import { ConsultationPatient } from '../patient';
import { Doctor } from './authentication';

export class ConsultationClient {
    private readonly doctor: Doctor;
    private consultation: Consultation;
    private connection: HubConnection;
    private eventEmitter: EventEmitter = new EventEmitter();
    private userPeers: UserPeer[] = [];

    constructor(doctor: Doctor) {
        this.doctor = doctor;
    }

    public async Connect(stream?: MediaStream): Promise<Consultation> {
        this.connection = new HubConnectionBuilder()
        .withUrl(SERVER_URL + '/hubs/consultation', {
          transport : HttpTransportType.WebSockets,
          skipNegotiation : true,
          accessTokenFactory : () => this.doctor.accessToken
        })
        .build();
        await this.connection.start();
        Object.values(SERVER_EVENTS).forEach(key => this.subscribe(key));
        this.connection.onclose(error => this.eventEmitter.emit(CONNECTION_EVENTS.CLOSE, error));
        this.consultation = await this.connection.invoke('join');
        this.initVideoConference(stream);
        return this.consultation;
    }

    private user(): ConsultationDoctor {
        return this.consultation.doctor as ConsultationDoctor;
    }

    private initVideoConference(stream?: MediaStream): void {
        if (!stream) {
            return;
        }
        this.onUserJoined(user => {
            this.updateUser(user);
            const rtc = new RTCInitiator(stream, infos => this.sendRTCInformations(user.userId, infos));
            const userPeer = {
                userId : user.userId,
                peer : this.subscribeEvents(rtc, user.userId)
            };
            this.userPeers.push(userPeer);
        });
        this.onUserLeft(user => this.removeRTCUser(user.userId));
        this.connection.on('rtcConferenceHandshake', (userId, infos) => {
            const userpeer = this.getPeer(userId) || this.createUserPeer(userId, stream);
            userpeer.addInformations(infos);
        });
    }

    private createUserPeer(userId: string, stream: MediaStream): RTCConnection {
        const rtc = new RTCReceiver(stream, infos => this.sendRTCInformations(userId, infos));
        const userPeer = {
            userId,
            peer : this.subscribeEvents(rtc, userId)
        };
        this.userPeers.push(userPeer);
        return rtc;
    }

    private subscribeEvents(rtc: RTCConnection, userId: string): RTCConnection {
        rtc.onStream(stream => this.eventEmitter.emit(RTC_EVENTS.NEW_STREAM, this.getUser(userId), stream));
        return rtc;
    }

    private removeRTCUser(userId: string): void {
        const peer = this.getPeer(userId);
        this.userPeers = this.userPeers.filter(up => up.peer !== peer);
    }

    private getPeer(userId: string): RTCConnection {
        const userPeer = this.userPeers.find(up => up.userId === userId);
        return userPeer ? userPeer.peer : undefined;
    }

    private getUser(userId: string): ConsultationUser {
        return this.getUsers().find(u => u.userId === userId);
    }

    private updateUser(user: ConsultationUser): void {
        switch (user.userType) {
            case 'DOCTOR' :
                this.consultation.doctor = user;
                return;
            case 'PATIENT' :
                this.consultation.patient = user as ConsultationPatient;
                return;
            case 'GUEST' :
                this.consultation.guests = [...this.consultation.guests.filter(g => g.userId !== user.userId), user];
                return;
        }
    }

    private sendRTCInformations(userId: string, informations: RTCInformation): Promise<void> {
        return this.connection.send('sendRTCHandshake', userId, informations);
    }

    private getUsers(): ConsultationUser[] {
        return [this.consultation.patient, this.consultation.doctor, ...this.consultation.guests];
    }

    private subscribe(event: string): void {
        this.connection.on(event, (...args) => {
            this.eventEmitter.emit(event, ...args);
            this.eventEmitter.emit('DEBUG', ...args);
        });
    }

    public onDebug(func: (...args: any[]) => any): () => void {
        this.eventEmitter.addListener(CONNECTION_EVENTS.DEBUG, func);
        return () => this.eventEmitter.removeListener(CONNECTION_EVENTS.DEBUG, func);
    }

    public onClose(func: (error?: Error) => any): () => void {
        this.eventEmitter.addListener(CONNECTION_EVENTS.CLOSE, func);
        return () => this.eventEmitter.removeListener(CONNECTION_EVENTS.CLOSE, func);
    }

    public onStream(func: (user: ConsultationUser, stream: MediaStream) => any): () => void {
        this.eventEmitter.addListener(RTC_EVENTS.NEW_STREAM, func);
        return () => this.eventEmitter.removeListener(RTC_EVENTS.NEW_STREAM, func);
    }

    public onUserJoined(func: (user: ConsultationUser) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.USER_JOINED, func);
        return () => this.eventEmitter.removeListener(SERVER_EVENTS.USER_JOINED, func);
    }

    public onUserLeft(func: (user: ConsultationUser) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.USER_LEFT, userId => func(this.getUser(userId)));
        return () => this.eventEmitter.removeListener(SERVER_EVENTS.USER_LEFT, func);
    }

    public onChatMessage(func: (sender: ConsultationUser, text: string) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.CHAT_MESSAGE, (userId, text) => func(this.getUser(userId), text));
        return () => this.eventEmitter.removeListener(SERVER_EVENTS.CHAT_MESSAGE, func);
    }

    public sendChatMessage(text: string): Promise<void> {
        return this.connection.invoke('sendChatMessage', text);
    }

    public async abort(): Promise<void> {
        await this.connection.invoke('abortConsultation');
        return this.clean();
    }

    private async clean(): Promise<void> {
        this.userPeers.forEach(up => up.peer.getPeer().close());
        return this.connection.stop();
    }
}

export interface UserPeer {
    peer: RTCConnection;
    userId: string;
}

const SERVER_EVENTS = {
    USER_JOINED : 'userJoined',
    USER_LEFT : 'userLeft',
    CHAT_MESSAGE : 'chatMessage'
};

const RTC_EVENTS = {
    NEW_STREAM : 'on'
};


const CONNECTION_EVENTS = {
    CLOSE : 'CLOSE',
    DEBUG : 'DEBUG'
};
