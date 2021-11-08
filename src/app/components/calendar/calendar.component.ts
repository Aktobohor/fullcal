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

interface InstancesType{
  name: string,
  code: string
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
  instanceType: InstancesType[];
  selectedInstance?: InstancesType;
  title: string = "";

  constructor(private http: HttpClient) {
    this.unlockElements();
    this.instanceType = [
      {name: "Giorni", code: "RRule.DAYLY"},
      {name: "Settimane", code: "RRule.WEEKLY"},
      {name: "Mesi", code: "RRule.MONTHLY"},
      {name: "Anni", code: "RRule.YEARLY"}
    ];

  }

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

    var body = {
      r_title: this.title,
      r_freq: this.selectedInstance!.code,
      r_dt_start: this.selectedDate,
      r_interval: "",
      r_byweekday: "[RRule.MO, RRule.FR]",
      r_until: this.date_picked,
      r_tzid: "local"
    };

    this.http.post<any>('http://localhost:8080/post', body ).subscribe(data => {

      console.log(data);
    });

    /*let params = new HttpParams();
    params = params.append("title", this.title);
    params = params.append("freq", this.selectedInstance!.code);//istanza {giorni,settimana,mese,anni}
    params = params.append("dtstart", this.selectedDate!.toString()); //data inizio
    params = params.append("interval", "");//ogni quante volte in base alla frequenza
    params = params.append("byweekday", "[RRule.MO, RRule.FR]"); //quali giorni della settimana
    params = params.append("until", (this.date_picked? this.date_picked.toString(): ""));//fino a che data
    params = params.append("tzid", "local");//time zone ID

    console.log(params);
    this.http.get<Array<Structures>>("http://localhost:8080/getAllReminders", {params:params})
      .subscribe(data =>  {
        this.a = data;
        console.log(this.a);
      });*/
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
