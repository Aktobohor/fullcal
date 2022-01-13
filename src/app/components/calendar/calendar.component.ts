import {Component, OnInit, ViewChild} from '@angular/core';
import {CalendarOptions, EventSourceInput, formatDate, FullCalendarComponent} from "@fullcalendar/angular";
import {ByWeekday, Frequency, RRule, Weekday} from "rrule";
import {HttpClient, HttpHeaders} from '@angular/common/http';
import rrulePlugin from "@fullcalendar/rrule";
import dayGridPlugin from "@fullcalendar/daygrid";
import {FormGroup, FormControl, Validators} from '@angular/forms';
import {SelectButtonModule} from 'primeng/selectbutton';
import {UtilsService} from "../../utils.service";
import {ConfirmationService, ConfirmEventType, MessageService} from "primeng/api";

const QUESTIONARIES = "Questionaries";
const TASKS = "Tasks";
const CHALLENGES = "Challenges";
const RANDOMTASKS = "RandomTask";

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'email': 'admin@example.com',
    'password':'superPss'
  })
};

interface Questionnaire{
  id: number,
  date: string,
  description: string,
  duration: number,
  name: string,
  ordering: string,
  questionid: string,
  status: string,
  target: string
  timeinterval: number
}
interface Question{
  id: number,
  content: string,
  date: string,
  description: string,
  name: string
}

interface GroupedQuestion{
  tipo: string,
  domande: Array<Question>
}

interface daysOfTheWeek {
  name: string,
  code:  number
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
  r_string_rule?:string
}

interface StructureDto {
  id?: number;
  idQuestionary?: string;
  idTasks?: string;
  idChallenges?: string;
  idRandomTask?: string;
}

interface StrsRemsDto {
  creator: string;
  event_duration: number;
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
  newReminderDtoList?: Array<NewReminderDTO>;
  endInstance?: string;
  until_date_picked?: Date;
  disableDP: boolean = false;
  disableOcc: boolean = false;
  disableDayOftheWeek: boolean = false;
  instanceType: InstancesType[];
  instanceSel: InstancesType | undefined;
  title: string = "";
  days: daysOfTheWeek[];
  questionariesList?: Array<Questionnaire>;
  questionList?: Array<Question>;
  elencoDomande?: any[] = new Array<GroupedQuestion>();


  constructor(private http: HttpClient, private messageService: MessageService) {
    this.unlockElements();
    this.instanceType = [
      {name: "Giorni", code: "RRule.DAILY"},
      {name: "Settimane", code: "RRule.WEEKLY"},
      {name: "Mesi", code: "RRule.MONTHLY"},
      {name: "Anni", code: "RRule.YEARLY"}
    ];

    this.days = [
      {name: 'L', code: 0},
      {name: 'M', code: 1},
      {name: 'M', code: 2},
      {name: 'G', code: 3},
      {name: 'V', code: 4},
      {name: 'S', code: 5},
      {name: 'D', code: 6}
    ];

  }

  //init del form presente nella dialog di inserimento dell'evento.
  profileForm = new FormGroup({
    title: new FormControl('', Validators.required),
    endInstance: new FormControl(''),
    selectedInstance: new FormControl(null , Validators.required),
    repetitionNumber: new FormControl('1' , Validators.required),
    until_date_picked: new FormControl(''),
    occurrencyNumber: new FormControl(''),
    selectedDays:new FormControl(null),
    ora_inizio: new FormControl(''),
    durata_evento:new FormControl(null),
    domanda_scelta: new FormControl(null)
  });

  //inizializzazione del Calendario
  calendarOptions: CalendarOptions = {
    plugins: [rrulePlugin, dayGridPlugin],
    initialView: 'dayGridMonth',
    dateClick: this.handleDateClick.bind(this), // bind is important!
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


  ngOnInit(): void {
    //init ora attuale
    let str = formatDate(new Date(), {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
    this.today = str;
    console.log(this.today);

    this.getAllQuestionaries();

    this.getAllQestions();

    /*this.http.get<Array<ReminderDto>>("http://localhost:8080/reminders/approved")
      .subscribe(data => {
        this.reminderDtoList = data;
        console.log(this.reminderDtoList);
        this.CaricaReminderDaDatabase(data);

      });*/

    /*this.http.get<Array<NewReminderDTO>>("http://localhost:8080/reminders/approvedfulldata")
      .subscribe(data => {
        this.newReminderDtoList = data;
        console.log(this.reminderDtoList);
        this.CaricaReminderDaDatabaseFullData(data);

      });*/

  }

  /**
   * prendo tutti i questionaries
   */
  getAllQuestionaries(){
    this.http.get<Array<Questionnaire>>("http://localhost:8090/questionnaires", httpOptions)
      .subscribe(data => {
        this.questionariesList = data;
        //mostro sul calendario tutte le ricorrenze della tabella questionaries (discriminare in base allo stato)
        this.CaricaQuestionariesDaDatabase(data);
      });
  }

  /**
   * Recupero tutte le domande (di questionaries).
   */
  getAllQestions(){
    this.http.get<Array<Question>>("http://localhost:8090/questions", httpOptions)
      .subscribe(data => {
        this.questionList = data;

        let tmp = {
          tipo: QUESTIONARIES,
          domande: data
        }
        console.log(tmp);
        this.elencoDomande?.push(tmp);
      });
  }

  CaricaQuestionariesDaDatabase(data: Array<Questionnaire>) {

    let eventToAddInCalendar: EventSourceInput = [];
    var rule: RRule;
    for (let questionarie of data) {

      let reminderStartDate = new Date(questionarie.date);
      console.log(reminderStartDate);

      let byDayWeek: Array<ByWeekday> = [];

      rule = new RRule({
        dtstart: reminderStartDate,
        count: 1
      });
      eventToAddInCalendar.push({title: questionarie.name, rrule: rule.toString(), color: 'orange'});
      console.log(rule.toString());
      console.log(rule.all());
    }
    //load eventi su calendario
    this.calendarComponent?.getApi().addEventSource(eventToAddInCalendar);
  }

  /**
   * reminder da db per visualizzare le ricorrenze
   * @Array<ReminderDto> data
   */
  CaricaReminderDaDatabase(data: Array<ReminderDto>) {

    let eventToAddInCalendar: EventSourceInput = [];
    var rule1: RRule;
    for (let reminder of data) {

      const reminderStartDate = reminder.r_dt_start as Array<number>;
      const reminderEndDate = reminder.r_until as Array<number>;

      let dateStart = new Date(reminderStartDate[0], reminderStartDate[1] - 1, reminderStartDate[2], reminderStartDate[3], reminderStartDate[4]);

      console.log("datestart",dateStart)

      let byDayWeek: Array<ByWeekday> = [];
      byDayWeek = this.getArrayByWeekday(reminder.r_byweekday);

      rule1 = new RRule({
        freq : this.getFrequencyFromString(reminder.r_freq),
        dtstart: dateStart,
        until: (reminderEndDate==null)? undefined : new Date(reminderEndDate[0], reminderEndDate[1] - 1, reminderEndDate[2], reminderEndDate[3], reminderEndDate[4]),
        interval:  reminder.r_interval,
        byweekday: byDayWeek,
        count: (reminder.r_count==0)? undefined : reminder.r_count
      });
      eventToAddInCalendar.push({title: reminder.r_title, rrule: rule1.toString(), color: 'orange'});
      console.log(rule1.toString());
      console.log(rule1.all());
    }
    //load eventi su calendario
    this.calendarComponent?.getApi().addEventSource(eventToAddInCalendar);
  }

  /**
   * mappatura string -> RRule
   * @stirng freq
   */
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

  /**
   * ricrea un array di RRule per il campo byweekday.
   * se è vuoto prende la stringa da "this.reminderDtoList![0].r_byweekday"
   * se l'argomento è avvalorato allora rielabora i dati ricevuti dalla
   * chiamata passandogli una stringa contenente le RRule.MO,RRule.TU ecc.
   * @string daysPerWeek
   */
  getArrayByWeekday(daysPerWeek : string | undefined): ByWeekday[] {
    let a = "";
    let byWeekdayArray: Array<ByWeekday> = [];
    if(daysPerWeek == undefined || daysPerWeek == ""){
      a = this.reminderDtoList![0].r_byweekday ? this.reminderDtoList![0].r_byweekday : "";
    }else{
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

  showDialog() {
    this.display = true;
  }

  closeDialog() {
    this.display = false;
  }

  showRequest(){
    console.log(this.profileForm.value);
  }

  /**
   * invio richiesta di creazione delle ricorrenze di un evento in base alle info inserite
   */
  sendRequest() {

    //necessaria per generare la RRULE come stringa da salvare a DB.
    let rule = new RRule({
      freq: this.getFrequencyFromString(this.profileForm.value.instanceType),
      interval: this.profileForm.value.repetitionNumber,
      dtstart: this.selectedDate!,
      until: this.profileForm.value.until_date_picked,
      count: (this.profileForm.value.endInstance == "Dopo") ? this.profileForm.value.occurrencyNumber : undefined,
      byweekday: this.profileForm.value.selectedDays, //array di numeri per creare correttamente la RRule in stringa
      byhour: this.profileForm.value.ora_inizio.getHours(),
      byminute: this.profileForm.value.ora_inizio.getMinutes(),
      bysecond: this.profileForm.value.ora_inizio.getSeconds()
    });

    //informazioni delle RRULE che possono essere utilizzate per creare la RRULE.
    let reminderDto: ReminderDto = {
      r_dt_start: this.selectedDate!,
      r_title: this.profileForm.value.title,
      r_freq: this.profileForm.value.selectedInstance.code,
      r_interval: this.profileForm.value.repetitionNumber,
      r_until: (this.profileForm.value.endInstance == "Data") ? this.profileForm.value.until_date_picked : undefined,
      r_count: (this.profileForm.value.endInstance == "Dopo") ? this.profileForm.value.occurrencyNumber : undefined,
      r_byweekday: (this.profileForm.value.selectedDays == null) ? "" : this.profileForm.value.selectedDays.toString(), //in stringa perche a db salviamo l'array di interi in stringa.
      r_byhour: this.profileForm.value.ora_inizio.getHours(),
      r_byminute: this.profileForm.value.ora_inizio.getMinutes(),
      r_byseconds: this.profileForm.value.ora_inizio.getSeconds(),
      r_string_rule: rule.toString()
    };

    //informazioni sul questionario.
    debugger
    let structureDto: StructureDto = {};
    //recupero tipo di domanda in base alla domanda selezionata.
    let qType = this.elencoDomande?.find(t=>t.domande[0].id == this.profileForm.value.domanda_scelta.id).tipo;
    switch(qType){
      case QUESTIONARIES:{
        structureDto = {
          idQuestionary: this.profileForm.value.domanda_scelta.id
        };
        break;
      }
      case TASKS:{
        structureDto = {
          idTasks: this.profileForm.value.domanda_scelta.id
        };
        break;
      }
      case CHALLENGES:{
        structureDto = {
          idChallenges: this.profileForm.value.domanda_scelta.id
        };
        break;
      }
      case RANDOMTASKS:{
        structureDto = {
          idRandomTask: this.profileForm.value.domanda_scelta.id
        };
        break;
      }
    }

    //informazioni sulla tabella delle relazioni.
    let strsRemsDto: StrsRemsDto = {
      creator: "manuel@Outlook.it",
      event_duration: this.profileForm.value.durata_evento
    };

    //oggetto che racchiude le 3 informazioni.
    var body: NewReminderDTO = {
      reminderDto: reminderDto,
      structureDto: structureDto,
      strsRemsDto: strsRemsDto
    };

    console.log(body);

    this.http.post<any>('http://localhost:8080/reminders/create', body).subscribe(data => {
      console.log(data);
      this.messageService.add({severity:'success', summary: 'Success', detail: 'Dati salvati in attesa di approvazione.'});
    },error => {
      this.messageService.add({severity:'error', summary: 'Error', detail: 'Errore nell\'invio dei dati. Verificare i campi nel form di invio'});
    });
  }

  salvaEvento() {
    console.log("/////////////" + this.selectedDate);
    //this.addEvents(this.selectedDate!);
    this.sendRequest();
    this.closeDialog();
  }

  handleDateClick(event: any) {
    if(UtilsService.selectedDateIsAfterToday(event.date)) {
      console.log("click", event)
      this.selectedDate = event.date;
      this.showDialog();
    }
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
