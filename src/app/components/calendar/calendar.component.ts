import {Component, OnInit, ViewChild} from '@angular/core';
import {CalendarOptions, EventSourceInput, formatDate, FullCalendarComponent} from "@fullcalendar/angular";
import {ByWeekday, Frequency, RRule} from "rrule";
import {HttpClient, HttpHeaders} from '@angular/common/http';
import rrulePlugin from "@fullcalendar/rrule";
import dayGridPlugin from "@fullcalendar/daygrid";
import {FormGroup, FormControl, Validators} from '@angular/forms';
import {SelectButtonModule} from 'primeng/selectbutton';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  })
};

interface daysOfTheWeek {
  name: string,
  code: string
}

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
  r_dt_start: Array<number> | Date,
  r_interval: number,
  r_wkst?: number,
  r_count?: number,
  r_until?: Array<number> | Date,
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

interface event {
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
  selectedDate: Date = new Date();
  reminderDtoList?: Array<ReminderDto>;
  endInstance?: string;
  until_date_picked?: Date;
  disableDP: boolean = false;
  disableOcc: boolean = false;
  disableDayOftheWeek: boolean = false;
  instanceType: InstancesType[];
  title: string = "";
  days: daysOfTheWeek[];


  constructor(private http: HttpClient) {
    this.unlockElements();
    this.instanceType = [
      {name: "Giorni", code: "RRule.DAILY"},
      {name: "Settimane", code: "RRule.WEEKLY"},
      {name: "Mesi", code: "RRule.MONTHLY"},
      {name: "Anni", code: "RRule.YEARLY"}
    ];

    this.days = [
      {name: 'L', code: 'RRule.MO'},
      {name: 'M', code: 'RRule.TU'},
      {name: 'M', code: 'RRule.WE'},
      {name: 'G', code: 'RRule.TH'},
      {name: 'V', code: 'RRule.FR'},
      {name: 'S', code: 'RRule.SA'},
      {name: 'D', code: 'RRule.SU'}
    ];

  }

  profileForm = new FormGroup({
    title: new FormControl('', Validators.required),
    endInstance: new FormControl(''),
    selectedInstance: new FormControl('' , Validators.required),
    repetitionNumber: new FormControl('1' , Validators.required),
    until_date_picked: new FormControl(''),
    occurrencyNumber: new FormControl(""),
    selectedDays:new FormControl("")
  });

  calendarOptions: CalendarOptions = {
    plugins: [rrulePlugin, dayGridPlugin],
    initialView: 'dayGridMonth',
    dateClick: this.handleDateClick.bind(this), // bind is important!
    events: [],
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true // includere i weekend nel calendario
  };


  ngOnInit(): void {
    let str = formatDate(new Date(), {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
    this.today = str;
    console.log(this.today);

    this.http.get<Array<ReminderDto>>("http://localhost:8080/reminders")
      .subscribe(data => {
        this.reminderDtoList = data;
        console.log(this.reminderDtoList);
        this.CaricaReminderDaDatabase(data);

      });


  }

  CaricaReminderDaDatabase(data: Array<ReminderDto>) {

    let eventToAddInCalendar: EventSourceInput = [];
    var rule1: RRule;
    for (let reminder of data) {

      const reminderStartDate = reminder.r_dt_start as Array<number>;
      const reminderEndDate = reminder.r_until as Array<number>;

      let dateStart = new Date(reminderStartDate[0], reminderStartDate[1] - 1, reminderStartDate[2], reminderStartDate[3], reminderStartDate[4]);

      console.log("datestart",dateStart)

      rule1 = new RRule({
        freq : this.getFrequencyFromString(reminder.r_freq),
        dtstart: dateStart,
        until: new Date(reminderEndDate[0], reminderEndDate[1] - 1, reminderEndDate[2], reminderEndDate[3], reminderEndDate[4]),
        interval:  reminder.r_interval,

      });
      eventToAddInCalendar.push({title: reminder.r_title, rrule: rule1.toString(), color: 'orange'});
      console.log(rule1.toString());
      console.log(rule1.all());
    }
    //load eventi su calendario
    this.calendarComponent?.getApi().addEventSource(eventToAddInCalendar);
  }

  getFrequencyFromString(freq: string): Frequency {
    switch (freq) {
      case "RRule.DAILY": {
        return RRule.DAILY;
      }
      case "RRule.WEEKLY": {
        return RRule.WEEKLY;
      }
      case "RRule.MONTHLY": {
        return RRule.MONTHLY;
      }
      case "RRule.YEARLY": {
        return RRule.YEARLY;
      }
      default: {
        return RRule.DAILY;
      }
    }
  }

  getArrayByWeekday(): ByWeekday[] {
    let byWeekdayArray: Array<ByWeekday> = [];
    let a = this.reminderDtoList![0].r_byweekday ? this.reminderDtoList![0].r_byweekday : "";
    if (a != "") {
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

  showRequest(){
    console.log(this.profileForm.value);
  }

  sendRequest() {

    /*let reminderDto: ReminderDto = {
      r_title: this.title,
      r_freq: this.selectedInstance!.code,
      r_dt_start: this.selectedDate!,
      r_interval: this.repetitionNumber,
      r_until: this.until_date_picked,
      r_tzid: "local"
    };
    const rule1 = new RRule({
      freq : this.getFrequencyFromString(this.selectedInstance!.code),
      interval: this.repetitionNumber,
      dtstart:this.selectedDate!,
      until:  this.until_date_picked,

    });*/

    //NEW
    let reminderDto: ReminderDto = {
      r_dt_start: this.selectedDate!,
      r_title: this.profileForm.value.title,
      r_freq: this.profileForm.value.selectedInstance.code,
      r_interval: this.profileForm.value.repetitionNumber,
      r_until: this.profileForm.value.until_date_picked
    };

    const rule1 = new RRule({
      freq : this.getFrequencyFromString(this.profileForm.value.instanceType),
      interval: this.profileForm.value.repetitionNumber,
      dtstart:this.selectedDate!,
      until:  this.profileForm.value.until_date_picked
    });

    console.log(rule1.options)
    console.log(rule1.toString())

    let structureDto: StructureDto = {
      idQuestionary: 1
    };

    let strsRemsDto: StrsRemsDto = {
      creator: "manuel@Outlook.it"
    };

    var body: NewReminderDTO = {
      reminderDto: reminderDto,
      structureDto: structureDto,
      strsRemsDto: strsRemsDto
    };

    console.log(body);

    this.http.post<any>('http://localhost:8080/reminders/create', body).subscribe(data => {
      console.log(data);
    });

  }

  salvaEvento() {
    console.log("/////////////" + this.selectedDate);
    //this.addEvents(this.selectedDate!);
    this.sendRequest();
    this.closeDialog();
  }

  handleDateClick(event: any) {
    console.log("click", event)
    this.selectedDate = event.date;
    this.showDialog();
  }

  /*addEvents(date: Date) {
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

  }*/

  toggleWeekends() {
    this.calendarOptions.weekends = !this.calendarOptions.weekends // toggle the boolean!
  }

  unlockElements() {
    if (this.profileForm.value.endInstance != null && this.profileForm.value.endInstance == "Data") {
      this.disableDP = false;
    } else {
      this.disableDP = true;
    }
    if (this.profileForm.value.endInstance != null && this.profileForm.value.endInstance == "Dopo") {
      this.disableOcc = false;
    } else {
      this.disableOcc = true;
    }
    if ( this.profileForm.value.selectedInstance != null && this.profileForm.value.selectedInstance.code == "RRule.WEEKLY") {
      this.disableDayOftheWeek = false;
    } else {
      this.disableDayOftheWeek = true;
    }

  }


}
