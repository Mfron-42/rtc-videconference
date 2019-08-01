import { Patient } from './authentication';
import { HubConnection, HubConnectionBuilder, HttpTransportType } from '@aspnet/signalr';
import { SERVER_URL } from './config';
import { EventEmitter } from 'events';
import { Consultation } from './consultation';
import { Invitation } from './invitation';

export class MatchingClient {
    private readonly patient: Patient;
    private connection: HubConnection;
    private eventEmitter: EventEmitter = new EventEmitter();

    constructor(patient: Patient) {
        this.patient = patient;
    }

    public async Connect(): Promise<void> {
        this.connection = new HubConnectionBuilder()
        .withUrl(SERVER_URL + '/hubs/matching', {
          transport : HttpTransportType.WebSockets,
          skipNegotiation : true,
          accessTokenFactory : () => this.patient.accessToken
        })
        .build();
        await this.connection.start();
        Object.values(SERVER_EVENTS).forEach(key => this.subscribe(key));
        this.connection.onclose(error => this.eventEmitter.emit(CONNECTION_EVENTS.CLOSE, error));
        return await this.connection.invoke('join');
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

    public onInvitations(func: (intations: Invitation[]) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.INVITATIONS, func);
        return () => this.eventEmitter.removeListener(SERVER_EVENTS.INVITATIONS, func);
    }

    public onConsultation(func: (consultation: Invitation) => any): () => void {
        this.eventEmitter.addListener(SERVER_EVENTS.CONSULTATION, func);
        return () => this.eventEmitter.removeListener(SERVER_EVENTS.CONSULTATION, func);
    }

    public acceptInvitation(remoteUserId: string): Promise<void> {
        return this.connection.invoke('acceptInvitation', remoteUserId);
    }

    public refuseInvitation(remoteUserId: string): Promise<void> {
        return this.connection.invoke('refuseInvitation', remoteUserId);
    }
}

const SERVER_EVENTS = {
    INVITATIONS: 'invitations',
    CONSULTATION: 'consultation'
};

const CONNECTION_EVENTS = {
    CLOSE : 'CLOSE',
    DEBUG: 'DEBUG'
};
