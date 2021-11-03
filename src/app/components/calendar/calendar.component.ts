import {Component, OnInit, ViewChild} from '@angular/core';
import {CalendarOptions, formatDate, FullCalendarComponent} from "@fullcalendar/angular";
import RRule from "rrule";
import {observable, Observable, throwError} from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {InputNumberModule} from 'primeng/inputnumber';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  })
};

interface Structure {
  id: number,
  idQuestionary: number
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})

export class CalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent?: FullCalendarComponent;
  today = "";
  display: boolean = false;
  selectedDate?: Date;
  a? : Array<Structure>;
  endInstance?: string;
  date_picked?: Date;
  minDate?: Date;
  maxDate?: Date;
  invalidDates?: Array<Date>;
  disableDP: boolean = false;
  disableOcc: boolean = false;
  repetitionNumber: number = 1;
  occurrencyNumber: number = 1;


  constructor(private http: HttpClient) {  }

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
    this.unlockElements();

    let str = formatDate(new Date(), {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
    this.today = str;
    console.log(this.today);

    let today = new Date();
    let month = today.getMonth();
    let year = today.getFullYear();
    let prevMonth = (month === 0) ? 11 : month -1;
    let prevYear = (prevMonth === 11) ? year - 1 : year;
    let nextMonth = (month === 11) ? 0 : month + 1;
    let nextYear = (nextMonth === 0) ? year + 1 : year;
    this.minDate = new Date();
    this.minDate.setMonth(prevMonth);
    this.minDate.setFullYear(prevYear);
    this.maxDate = new Date();
    this.maxDate.setMonth(nextMonth);
    this.maxDate.setFullYear(nextYear);

    let invalidDate = new Date();
    invalidDate.setDate(today.getDate() - 1);
    this.invalidDates = [today,invalidDate];

  }

  showDialog() {
    this.display = true;
  }
  closeDialog(){
    this.display = false;
  }

  senRequest(){

    /*let headers = new HttpHeaders();
    headers.append('Content-Type', 'application/json');
    headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    headers.append('Access-Control-Allow-Origin', '*');*/
    //http://localhost:8080/getAllReminders?title=Event1

    let params = new HttpParams();
    params = params.append("title", "Evento1");
    params = params.append("freq", "RRule.WEEKLY");
    params = params.append("interval", "2");
    params = params.append("byweekday", "[RRule.MO, RRule.FR]");
    params = params.append("dtstart", (new Date(Date.UTC(2021, 9, 1, 10, 30)).toString()));
    params = params.append("until", (new Date(Date.UTC(2022, 12, 31))).toString());
    console.log(params);
    this.http.get<Array<Structure>>("http://localhost:8080/getAllReminders", {params:params})
      .subscribe(data =>  {
        this.a = data;
        console.log(this.a);
      });
  }

  salvaEvento(){
    console.log("/////////////"+this.selectedDate);
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
    dtstart: new Date(date),
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

  unlockElements(){
    if(this.endInstance == "Data"){
      this.disableDP = false;
    }else{
      this.disableDP = true;
    }
    if(this.endInstance == "Dopo"){
      this.disableOcc = false;
    }else{
      this.disableOcc = true;
    }
  }
}
