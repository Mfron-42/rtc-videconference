import { EventEmitter } from 'events';
import { Subject, Observable, PartialObserver, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

export class DeviceEvents extends Subject<Event> {
  public onEvent<TEvent extends Event>(
    eventType: string,
    action: (event: TEvent) => any
  ): Subscription {
    return (this.pipe(filter(e => e.type === eventType)) as Observable<
      TEvent
    >).subscribe(action);
  }
}

export interface StreamEvent extends Event {
  content: MediaStream;
}

export interface Event {
  type: string;
  content: any;
}
