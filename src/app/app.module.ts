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
import {FormsModule} from "@angular/forms";
import {InputNumberModule} from "primeng/inputnumber";
import {RadioButtonModule} from "primeng/radiobutton";
import {CalendarModule} from "primeng/calendar";
import {DropdownModule} from "primeng/dropdown";
import {InputTextModule} from "primeng/inputtext";
import { ScheduleCheckerComponent } from './components/schedul-checker/schedule-checker.component';
import { ReactiveFormsModule } from '@angular/forms';
import {SelectButtonModule} from "primeng/selectbutton";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {ToastModule} from "primeng/toast";
import {CascadeSelectModule} from "primeng/cascadeselect";
import {ColorPickerModule} from "primeng/colorpicker";
import {UserEventSelectorComponent} from "./components/user_event_selector/user_event_selector.component";


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
    ScheduleCheckerComponent,
    UserEventSelectorComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FullCalendarModule,
    OverlayPanelModule,
    ButtonModule,
    FullCalendarModule,
    DialogModule,
    FormsModule,
    InputNumberModule,
    RadioButtonModule,
    CalendarModule,
    DropdownModule,
    InputTextModule,
    ReactiveFormsModule,
    SelectButtonModule,
    ConfirmDialogModule,
    ToastModule,
    CascadeSelectModule,
    ColorPickerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
