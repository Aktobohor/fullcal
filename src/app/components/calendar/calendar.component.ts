import {Component, OnInit, ViewChild} from '@angular/core';
import {CalendarOptions, formatDate, FullCalendarComponent} from "@fullcalendar/angular";
import RRule from "rrule";
import {observable, Observable, throwError} from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})


export class CalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent?: FullCalendarComponent;

  constructor(private http: HttpClient) { }

  res = "";
  today = "";
  display: boolean = false;
  selectedDate?: Date;

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    dateClick: this.handleDateClick.bind(this), // bind is important!
    events: [
      {title: 'event 1', date: '2021-10-01', color: 'orange'},
      {title: 'event 2', date: '2021-10-06', color: 'lightblue'}
    ],

    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,

    weekends: false // initial value
  };

  ngOnInit(): void {
    console.log("inti1");
    let str = formatDate(new Date(), {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
    this.today = str;
    console.log(this.today);
  }

  showDialog() {
    this.display = true;
  }
  closeDialog(){
    this.display = false;
  }

  senRequest(){
    this.http.get("https://localhost:8080").subscribe(res => {
      console.log(res);
    });
  }
  salvaEvento(){
    this.addEvents(this.selectedDate!);
    this.senRequest();
    this.closeDialog();
  }

  handleDateClick(event: any) {
    console.log("click", event)
    this.selectedDate = event.date;
    this.showDialog();
  }

  addEvents(date: Date) {

    const rule = new RRule({
    freq: RRule.WEEKLY,
    interval: 2,
    byweekday: [RRule.MO, RRule.FR],
    dtstart: new Date(Date.UTC(2021, 9, 1, 10, 30)),
    until: new Date(Date.UTC(2022, 12, 31))
  })


    let event = [
      {
        title: 'event 1', color: 'red', allDay: true, rrule: rule.origOptions
      }
    ]

    console.log(rule.toString())
    console.log(rule.toText())

    this.calendarComponent?.getApi().addEventSource(event);

  }

  changetime() {
    this.today = formatDate(new Date(), {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  toggleWeekends() {
    this.calendarOptions.weekends = !this.calendarOptions.weekends // toggle the boolean!
  }

}
