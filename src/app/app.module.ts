import {LOCALE_ID, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

import {FullCalendarModule} from "@fullcalendar/angular";
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import { AppComponent } from './app.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {ButtonModule} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {HttpClientModule} from "@angular/common/http";


// @ts-ignore
FullCalendarModule.registerPlugins([ // register FullCalendar plugins
  rrulePlugin,
  dayGridPlugin,
  interactionPlugin
]);


@NgModule({
  declarations: [
    AppComponent,
    CalendarComponent,

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FullCalendarModule,
    OverlayPanelModule,
    ButtonModule,
    FullCalendarModule,
    DialogModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
