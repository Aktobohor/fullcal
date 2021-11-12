import {Component, OnInit, ViewChild} from '@angular/core';
import {CalendarOptions, formatDate, FullCalendarComponent} from "@fullcalendar/angular";
import {ByWeekday, Frequency, Options, RRule, RRuleSet, RRuleStrOptions} from "rrule";
import {HttpClient, HttpHeaders} from '@angular/common/http';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  })
};

interface Structure {
  id: number,
  idQuestionary: number
}

interface InstancesType {
  name: string,
  code: string
}

interface ReminderDto {
  id?: number,
  r_title: string,
  r_freq: string,
  r_dt_start: Date,
  r_interval: number,
  r_wkst: number,
  r_count: number,
  r_until?: Date,
  r_tzid?: string,
  r_bysetpos?: string,
  r_bymonth?: string,
  r_byyearday?: string,
  r_byweekno?: string,
  r_byweekday?: string,
  r_byhour?: string,
  r_byminute?: string,
  r_byseconds?: string,
}

interface StructureDto {
  id?: number;
  idQuestionary?: number;
  idTask?: number;
  idChallenges?: number;
  idRandomTask?: number;
}

interface StrsRemsDto {
  creator: string;
}

interface NewReminderDTO {
  reminderDto: ReminderDto;
  structureDto: StructureDto;
  strsRemsDto: StrsRemsDto;
}

interface event{
  title: string;
  date: string;
  color: string;
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
  eventList?: Array<event>;
  selectedDate?: Date;
  reminderDtoList?: Array<ReminderDto>;
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
      {name: "Giorni", code: "RRule.DAILY"},
      {name: "Settimane", code: "RRule.WEEKLY"},
      {name: "Mesi", code: "RRule.MONTHLY"},
      {name: "Anni", code: "RRule.YEARLY"}
    ];

  }

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    dateClick: this.handleDateClick.bind(this), // bind is important!
    events: this.eventList/*[
      {title: 'event 1', date: '2021-10-01', color: 'orange'},
      {title: 'event 2', date: '2021-10-06', color: 'lightblue'}
    ]*/,

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
    let prevMonth = (month === 0) ? 11 : month - 1;
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
    this.invalidDates = [today, invalidDate];

    this.http.get<Array<ReminderDto>>("http://localhost:8080/reminders")
      .subscribe(data => {
        this.reminderDtoList = data;
        console.log(this.reminderDtoList);
        this.createRRule();

        this.popolaEventsArray()

      });



  }

  createRRule(){

    let dateStart : Array<any> =  this.reminderDtoList![0].r_dt_start.toString().split(",");
    let dateUntil : Array<any> =  this.reminderDtoList![0].r_until!.toString().split(",");

    var option = RRule.parseString("");
    option.dtstart = new Date (dateStart[0],dateStart[1]-1,dateStart[2],dateStart[3],dateStart[4]);
    option.until = new Date (dateUntil[0],dateUntil[1]-1,dateUntil[2],dateUntil[3],dateUntil[4]);
    option.interval = this.reminderDtoList![0].r_interval;
    option.freq = this.getFrequencyFromString();

    var rule1 = new RRule(option);
    this.eventList = new Array<event>();
    var dateArray = rule1.all();
    for (let d of dateArray){
      let z : event = {title:'event', date:d.toDateString(), color:'orange'}
      this.eventList?.push(z);
    }
    console.log(this.eventList);
    //console.log(rule1.all());

    /*var rule2 = new RRule();
    rule2.origOptions.dtstart = new Date(dateStart[0],dateStart[1]-1,dateStart[2],dateStart[3],dateStart[4]);
    rule2.options.until = new Date(dateUntil[0],dateUntil[1]-1,dateUntil[2],dateUntil[3],dateUntil[4]);
    rule2.options.interval = this.reminderDtoList![0].r_interval;
    rule2.options.freq = this.getFrequencyFromString();
    console.log(rule2.all());*/

  }

  private popolaEventsArray() {

  }

  getFrequencyFromStringtoString() : string{
    switch(this.reminderDtoList![0].r_freq){
      case "RRule.DAILY": {
        return "DAILY";
      }
      case "RRule.WEEKLY": {
        return "WEEKLY";
      }
      case "RRule.MONTHLY": {
        return "MONTHLY";
      }
      case "RRule.YEARLY": {
        return "YEARLY";
      }
      default:{
        return "HOURLY";
      }
    }
  }

  getFrequencyFromString() : Frequency{
    switch(this.reminderDtoList![0].r_freq){
      case "RRule.DAILY": {
        return Frequency.DAILY;
      }
      case "RRule.WEEKLY": {
        return Frequency.WEEKLY;
      }
      case "RRule.MONTHLY": {
        return Frequency.MONTHLY;
      }
      case "RRule.YEARLY": {
        return Frequency.YEARLY;
      }
      default:{
        return Frequency.HOURLY;
      }
    }
  }

  getArrayByWeekday() : ByWeekday[]{
    let byWeekdayArray : Array<ByWeekday> = [];
    let a = this.reminderDtoList![0].r_byweekday?  this.reminderDtoList![0].r_byweekday : "";
    if(a != "") {
      a = a.replace("[", "");
      a = a.replace("]", "");
      let array: Array<String> = [];
      array = a.split(",");
      for (let r of array) {
        switch (r) {
          case "RRule.MO": {
            byWeekdayArray.push(RRule.MO);
            break;
          }
          case "RRule.TU": {
            byWeekdayArray.push(RRule.TU);
            break;
          }
          case "RRule.WE": {
            byWeekdayArray.push(RRule.WE);
            break;
          }
          case "RRule.TH": {
            byWeekdayArray.push(RRule.TH);
            break;
          }
          case "RRule.FR": {
            byWeekdayArray.push(RRule.FR);
            break;
          }
          case "RRule.SA": {
            byWeekdayArray.push(RRule.SA);
            break;
          }
          case "RRule.SU": {
            byWeekdayArray.push(RRule.SU);
            break;
          }
        }
      }
    }
    return byWeekdayArray;
  }

  showDialog() {
    this.display = true;
  }

  closeDialog() {
    this.display = false;
  }

  sendRequest() {

    let reminderDto: ReminderDto = {
      r_count: 0,
      r_wkst: 0,
      r_title: this.title,
      r_freq: this.selectedInstance!.code,
      r_dt_start: this.selectedDate!,
      r_interval: 0,
      r_byweekday: "[RRule.MO, RRule.FR]",
      r_until: this.date_picked,
      r_tzid: "local"
    };

    let structureDto: StructureDto = {
      idQuestionary: 1
    };

    let strsRemsDto: StrsRemsDto = {
      creator: "a@b.it"
    };

    var body: NewReminderDTO = {
      reminderDto: reminderDto,
      structureDto: structureDto,
      strsRemsDto: strsRemsDto
    };

    this.http.post<any>('http://localhost:8080/reminders/create', body).subscribe(data => {
      console.log(data);
    });


  }

  salvaEvento() {
    console.log("/////////////" + this.selectedDate);
    this.addEvents(this.selectedDate!);
    this.sendRequest();
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

  unlockElements() {
    if (this.endInstance == "Data") {
      this.disableDP = false;
    } else {
      this.disableDP = true;
    }
    if (this.endInstance == "Dopo") {
      this.disableOcc = false;
    } else {
      this.disableOcc = true;
    }
  }


}
