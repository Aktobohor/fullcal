import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CalendarComponent} from "./components/calendar/calendar.component";
import {ScheduleCheckerComponent} from "./components/schedul-checker/schedule-checker.component";

const routes: Routes = [
  { path: 'calendar', component: CalendarComponent },
  { path: 'admin', component: ScheduleCheckerComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
