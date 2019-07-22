import { Component, ViewChild, ElementRef, EventEmitter } from "@angular/core";
import { User } from './services/rtc-user.service';
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  public users : User[] = [];

  constructor() {
    this.addGeneratedUser();
  }

  public addGeneratedUser(){
    this.users.push(this.generateUser());
  }

  private generateUser() : User {
    return {
      id : Math.round(Math.random() * 100000)
    };
  }
}

