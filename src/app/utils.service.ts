import { Injectable } from '@angular/core';
import {EventSourceInput, FullCalendarComponent} from "@fullcalendar/angular";
import {CalendarComponent} from "./components/calendar/calendar.component";
import {HttpClient} from "@angular/common/http";
import {ByWeekday, Frequency, RRule} from "rrule";
import {BigInteger} from "@angular/compiler/src/i18n/big_integer";

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

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  static selectedDateIsAfterToday(dateSelected : Date) : boolean{
    var a = new Date();
    a.setHours(0,0,0,0);
    return (dateSelected >= a);
  }

  static selectedDateIsBeforeToday(dateSelected : Date) : boolean{
    var a = new Date();
    a.setHours(0,0,0,0);
    return (dateSelected < a);
  }

  static refreshCalendarEvents(calendarComponent: FullCalendarComponent,eventToAddInCalendar: EventSourceInput | null) {
    //pulisce il calendario
    calendarComponent.getApi().removeAllEvents();
    if (eventToAddInCalendar != null) {
      //load eventi su calendario
      calendarComponent.getApi().addEventSource(eventToAddInCalendar);
    }
  }

  //ricrea un array di RRule per il campo byweekday.
  //se è vuoto prende la stringa da "this.reminderDtoList![0].r_byweekday"
  //se l'argomento è avvalorato allora rielabora i dati ricevuti dalla
  // chiamata passandogli una stringa contenente le RRule.MO,RRule.TU ecc.
  static getArrayByWeekday(daysPerWeek : string | undefined): ByWeekday[] {
    let a = "";
    let byWeekdayArray: Array<ByWeekday> = [];
    if(daysPerWeek != undefined && daysPerWeek != ""){
      a = daysPerWeek;
    }
    if (a != "") {
      a = a.replace("[", "");
      a = a.replace("]", "");
      let array: Array<String> = [];
      array = a.split(",");
      for (let r of array) {
        switch (r) {
          case "0": {
            byWeekdayArray.push(RRule.MO);
            break;
          }
          case "1": {
            byWeekdayArray.push(RRule.TU);
            break;
          }
          case "2": {
            byWeekdayArray.push(RRule.WE);
            break;
          }
          case "3": {
            byWeekdayArray.push(RRule.TH);
            break;
          }
          case "4": {
            byWeekdayArray.push(RRule.FR);
            break;
          }
          case "5": {
            byWeekdayArray.push(RRule.SA);
            break;
          }
          case "6": {
            byWeekdayArray.push(RRule.SU);
            break;
          }
        }
      }
    }
    return byWeekdayArray;
  }

  static getFrequencyFromString(freq: string | undefined): Frequency {
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

  static createListOfReminder(data: Array<ReminderDto>, reminderDtoList : Array<ReminderDto>){
    for (let reminder of data) {
      if (reminder != undefined) {
        reminderDtoList.push(reminder);
      }
    }
  }

  static formatDateDD_MM_YYYY(date : Date | number[] | undefined): string {
    if (date != undefined) {
      let a = date.toString().split(",");
      return a[2]+"/"+a[1]+"/"+a[0];
    }
    return "00/00/0000";
  }

  static formatDateDD_MM_YYYY_FromString(date : string | undefined): string {
    if (date != undefined) {
      let a = date.substr(0,10);
      return a.substr(8,2)+"/"+a.substr(5,2)+"/"+a.substr(0,4);
    }
    return "00/00/0000";
  }

  static CreateDateFromString(date : string | undefined): Date {
    if (date != undefined) {
      let a = date.substr(0,10);
      return new Date(a);
    }
    return new Date();
  }
}
