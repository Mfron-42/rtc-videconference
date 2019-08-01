import { SERVER_URL } from './config';

export class Authentification {

    public static async login(email: string, password: string): Promise<Doctor> {
        const res = await fetch(SERVER_URL + '/api/doctor/login', {
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


export interface Doctor {
    id: string;
    tessanId: string;
    accessToken: string;
    firstname: string;
    lastname: string;
    email: string;
}
