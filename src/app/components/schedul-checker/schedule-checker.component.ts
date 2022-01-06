import { Component, OnInit, ViewChild } from '@angular/core';
import {CalendarOptions, EventSourceInput, formatDate, FullCalendarComponent} from "@fullcalendar/angular";
import {ByWeekday, Frequency, RRule} from "rrule";
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import rrulePlugin from "@fullcalendar/rrule";
import dayGridPlugin from "@fullcalendar/daygrid";
import {UtilsService} from "../../utils.service";
import {ConfirmationService, ConfirmEventType, MessageService} from "primeng/api";

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


@Component({
  selector: 'app-schedule-checker',
  templateUrl: './schedule-checker.component.html',
  styleUrls: ['./schedule-checker.component.scss'],
  providers: [ConfirmationService,MessageService]
})

export class ScheduleCheckerComponent implements OnInit {
  @ViewChild('calendar') calendarComponent?: FullCalendarComponent;
  reminderDtoList?: Array<ReminderDto>;
  datesList : Date[] = [];
  position: string = 'top';

  constructor(private http: HttpClient, private confirmationService: ConfirmationService, private messageService: MessageService){

  }

  ngOnInit(): void {
    this.LoadListaEventiNonApprovati();
  }

  calendarOptions: CalendarOptions = {
    plugins: [rrulePlugin, dayGridPlugin],
    initialView: 'dayGridMonth',
    //dateClick: this.handleDateClick.bind(this), // bind is important!
    events: [],
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true, // includere i weekend nel calendario
    selectAllow: (info) => {
      if(UtilsService.selectedDateIsBeforeToday(info.start))
        return false;
      return true;
    },
    locale: "it",
    firstDay: 1
  };

  LoadListaEventiNonApprovati(){
    this.http.get<Array<ReminderDto>>("http://localhost:8080/reminders/notapproved")
      .subscribe(data => {
        this.reminderDtoList = data;
      });
  }

  showRRuleDateList(id : number | undefined){
    let eventToAddInCalendar: EventSourceInput = [];
    let reminderFound = this.reminderDtoList?.find(x => x.id == id);
    console.log(reminderFound);

    const reminderStartDate = reminderFound?.r_dt_start as Array<number>;
    const reminderEndDate = reminderFound?.r_until as Array<number>;
    let dateStart = new Date(reminderStartDate[0], reminderStartDate[1] - 1, reminderStartDate[2], reminderStartDate[3], reminderStartDate[4]);

    let byDayWeek: Array<ByWeekday> = [];
    byDayWeek = UtilsService.getArrayByWeekday(reminderFound?.r_byweekday);

    let rule = new RRule({
      freq : UtilsService.getFrequencyFromString(reminderFound?.r_freq),
      dtstart: dateStart,
      until: (reminderEndDate==null)? undefined : new Date(reminderEndDate[0], reminderEndDate[1] - 1, reminderEndDate[2], reminderEndDate[3], reminderEndDate[4]),
      interval:  reminderFound?.r_interval,
      byweekday: byDayWeek,
      count: (reminderFound?.r_count==0)? undefined : reminderFound?.r_count
    });

    eventToAddInCalendar.push({title: reminderFound?.r_title, rrule: rule.toString(), color: 'blue'});

    UtilsService.refreshCalendarEvents(this.calendarComponent!,eventToAddInCalendar);

  }

  confirmReminder(id: number | undefined) {
    console.log("confirmReminder");
    this.confirmationService.confirm({
      message: 'vuoi approvare la schedulazione? ',
      header: 'Confirma',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        console.log("post");
        this.http.post<any>("http://localhost:8080/reminders/confirmFromId", id)
          .subscribe(data => {
            this.LoadListaEventiNonApprovati();
            UtilsService.refreshCalendarEvents(this.calendarComponent!, null);
            this.messageService.add({severity:'success', summary: 'Success', detail: 'Evento ricorsivo approvato'});
          },error => {
            console.error('There was an error!', error);
          });
      },
      reject: (type:any) => {
        switch(type) {
          case ConfirmEventType.REJECT:
            this.messageService.add({severity:'error', summary:'Rejected', detail:'Evento ricorsivo non approvato'});
            break;
          case ConfirmEventType.CANCEL:
            this.messageService.add({severity:'warn', summary:'Cancelled', detail:'Chiusa la finestra di conferma'});
            break;
        }
      }
    });
  }

  rejectReminder(id: number | undefined) {

  }

  formatDateDD_MM_YYYY(date : Date | number[] | undefined){
    return UtilsService.formatDateDD_MM_YYYY(date);
  }
}
