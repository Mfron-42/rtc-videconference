import { ConsultationUser } from './ConsultationUser';
import { ConsultationPatient } from '../patient';
export interface Consultation {
    id: string;
    startedAt: string;
    endedAt: string;
    motive: string;
    patient: ConsultationPatient;
    doctor: ConsultationUser;
    guests: ConsultationUser[];
}
