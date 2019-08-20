import { RTCConnectionComponent } from './components/rtc-connection/rtc-connection.component';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RTCUserService } from './services/rtc-user.service';

@NgModule({
  declarations: [AppComponent, RTCConnectionComponent],
  imports: [BrowserModule, AppRoutingModule],
  providers: [RTCUserService],
  bootstrap: [AppComponent]
})
export class AppModule {}
