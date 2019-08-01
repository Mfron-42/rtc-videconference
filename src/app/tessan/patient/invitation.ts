export interface Invitation {
    userId: string;
    firstname: string;
    lastName: string;
    specialities: string[];
    localStatus: 'ACCEPTED' | 'REFUSED' | 'PENDING';
    remoteStatus: 'ACCEPTED' | 'REFUSED' | 'PENDING';
    creationDate: string;
}
