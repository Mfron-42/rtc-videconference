import { ConsultationUser, ConsultationPatient } from './ConsultationUser';
import { ConsultationDoctor } from '../doctor';
export interface Consultation {
    id: string;
    startedAt: string;
    endedAt: string;
    motive: string;
    patient: ConsultationPatient;
    doctor: ConsultationDoctor;
    guests: ConsultationUser[];
}
