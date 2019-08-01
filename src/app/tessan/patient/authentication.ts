import { SERVER_URL } from './config';

export class Authentification {

    public static async login(email: string, password: string): Promise<Patient> {
        const res = await fetch(SERVER_URL + '/api/patient/login', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        if (res.status !== 200) {
            throw new Error(await res.text());
        }
        return await res.json();
    }
}


export interface Patient {
    id: string;
    tessanId: string;
    accessToken: string;
    firstname: string;
    lastname: string;
    email: string;
}
