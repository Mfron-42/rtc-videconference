export interface ConsultationUser {
    userType: 'DOCTOR' | 'PATIENT' | 'GUEST';
    userId: string;
    organizationId: string;
    firstname: string;
    lastname: string;
    enabledOptions: Option[];
    status: ConnectionStatus;
}

export interface ConsultationPatient {
    userType: 'PATIENT';
    userId: string;
    organizationId: string;
    firstname: string;
    lastname: string;
    enabledOptions: Option[];
    status: ConnectionStatus;
}

export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED';

export type Option = 'VIDEO_CONFERENCE';
