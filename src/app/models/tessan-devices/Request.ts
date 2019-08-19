import { Subject, Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

export class DeviceRequests extends Subject<UserRequest> {
    public onRequest<TRequest extends UserRequest>(requestType: string, action: (originId : string, request: Request) => any): Subscription {
        return (this.pipe(filter(e => e.request.type == requestType)) as Observable<TRequest>)
            .subscribe(userRequest => action(userRequest.originId, userRequest.request));
    }
}

export interface UserRequest {
    request : Request;
    originId : string;
}

export interface Request {
    type : string;
    content : any;
}