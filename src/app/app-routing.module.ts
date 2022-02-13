import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CalendarComponent} from "./components/calendar/calendar.component";
import {ScheduleCheckerComponent} from "./components/schedul-checker/schedule-checker.component";
import {UserEventSelectorComponent} from "./components/user_event_selector/user_event_selector.component";

const routes: Routes = [
  { path: 'calendar', component: CalendarComponent },
  { path: 'admin', component: ScheduleCheckerComponent },
  { path: 'users', component: UserEventSelectorComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
