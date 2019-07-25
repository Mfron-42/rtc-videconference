import { HttpClient } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder, HttpTransportType } from '@aspnet/signalr';

export abstract class AUserService
{
    protected abstract serverURL : string;
    public abstract userType : string;
    protected user : User;

    public constructor(protected http : HttpClient){

    }

    public abstract configure(user : User) : AUserService;
    
    protected setUser(user : User) : void {
        this.user = user;
    }

    public abstract hubConnection() : HubConnection;

    protected buildConnection(path : string) : HubConnection {
        return new HubConnectionBuilder()
        .withUrl(this.serverURL + path, {
          transport : HttpTransportType.WebSockets,
          skipNegotiation : true,
          accessTokenFactory : () => this.user.accessToken
        }) //consultation
        .build();
    }

    public login(email : string, password : string, path : string) : Promise<User> {
        return this.http.post(this.serverURL + path, {
            email,
            password 
        })
        .toPromise() as Promise<User>
    }
}

export interface User {
    id : string,
    accessToken : string,
    firstname: string,
    lastname: string,
    email: string,
}
  