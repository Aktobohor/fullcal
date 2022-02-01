import {Component, OnInit, ViewChild} from '@angular/core';
import {CalendarOptions, EventSourceInput, formatDate, FullCalendarComponent} from "@fullcalendar/angular";
import {Frequency, RRule} from "rrule";
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import rrulePlugin from "@fullcalendar/rrule";
import dayGridPlugin from "@fullcalendar/daygrid";
import {UtilsService} from "../../utils.service";
import {ConfirmationService, ConfirmEventType, MessageService} from "primeng/api";
import {FormControl, FormGroup, Validators} from "@angular/forms";

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'email': 'admin@example.com',
    'password': 'superPss'
  })
};

const QUESTIONARIES = "Questionaries";
const TASKS = "Tasks";
const CHALLENGES = "Challenges";
const RANDOMTASKS = "RandomTask";

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
  r_string_rule?: string
}

interface StructureDto {
  id?: number;
  idQuestionary?: string;
  idTasks?: string;
  idChallenges?: string;
  idRandomTask?: string;
}

interface StrRemDto {
  id?: number,
  id_structure?: number,
  id_reminder?: number,
  approved?: string,
  event_duration?: number,
  creator?: string
  event_color?: string,
}

interface NewReminderDTO {
  reminderDto: ReminderDto,
  strsRemsDto: StrRemDto,
  structureDto: StructureDto
}

interface StrsRemsDto {
  creator: string,
  event_duration: number,
  event_color: string
}

interface Questionnaire {
  id: string,
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

interface Question {
  id: number,
  content: string,
  date: string,
  description: string,
  name: string
}

interface GroupedQuestion {
  tipo: string,
  domande: Array<Question>
}

interface daysOfTheWeek {
  name: string,
  code: number
}

interface InstancesType {
  name: string,
  code: string
}

@Component({
  selector: 'app-schedule-checker',
  templateUrl: './schedule-checker.component.html',
  styleUrls: ['./schedule-checker.component.scss'],
  providers: [ConfirmationService, MessageService]
})

export class ScheduleCheckerComponent implements OnInit {
  @ViewChild('calendar') calendarComponent?: FullCalendarComponent;
  reminderDtoList?: Array<NewReminderDTO>;
  today = "";
  display: boolean = false;
  selectedDate: Date = new Date();
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
  disableBtnNA: boolean = false;
  disableBtnQ: boolean = false;
  displayDetailModal: boolean = false;
  selectedReminderNADetail?: NewReminderDTO;
  selectedReminderQDetail?: Questionnaire;
  editQuestionarieDialog: boolean = false;

  constructor(private http: HttpClient, private confirmationService: ConfirmationService, private messageService: MessageService) {

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

  ngOnInit(): void {
    this.LoadListaEventiNonApprovati();
    let str = formatDate(new Date(), {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
    this.today = str;
    console.log(this.today);

    this.getAllQestions();
  }

  //init del form presente nella dialog di inserimento dell'evento.
  profileForm = new FormGroup({
    title: new FormControl('', Validators.required),
    endInstance: new FormControl(''),
    selectedInstance: new FormControl(null, Validators.required),
    repetitionNumber: new FormControl('1', Validators.required),
    until_date_picked: new FormControl(''),
    occurrencyNumber: new FormControl(''),
    selectedDays: new FormControl(null),
    ora_inizio: new FormControl(''),
    durata_evento: new FormControl(null),
    domanda_scelta: new FormControl(null),
    colore_evento: new FormControl("#FF0000")
  });

  domanda_evento = new FormControl("");
  data_evento = new FormControl("");
  ora_evento = new FormControl("");
  durata_evento = new FormControl("");

  calendarOptions: CalendarOptions = {
    plugins: [rrulePlugin, dayGridPlugin],
    initialView: 'dayGridMonth',
    dateClick: this.handleDateClick.bind(this), // bind is important!
    events: [],
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    nextDayThreshold: "24:00:00",
    weekends: true, // includere i weekend nel calendario
    selectAllow: (info) => {
      if (UtilsService.selectedDateIsBeforeToday(info.start))
        return false;
      return true;
    },
    locale: "it",
    firstDay: 1,
    timeZone: "local",
    eventClick: (info) => {
      this.selectedReminderNADetail = undefined;
      this.selectedReminderQDetail = undefined;
      if (this.disableBtnNA) {
        this.selectedReminderNADetail = this.reminderDtoList!.find(x => x.strsRemsDto.id + "" === info.event.id);
        console.log(this.selectedReminderNADetail)
        this.displayDetailModal = true
      } else if (this.disableBtnQ) {


        this.selectedReminderQDetail = this.questionariesList!.find(x => x.id + "" === info.event.id)
        console.log(this.selectedReminderQDetail)

        this.displayDetailModal = true
      }

    }
  };

  LoadListaEventiNonApprovati() {
    this.disableBtnNA = true;
    this.disableBtnQ = false;

    this.http.get<Array<NewReminderDTO>>("http://localhost:8080/reminders/notapprovedNEW")
      .subscribe(data => {
        this.reminderDtoList = data;
        //console.log(data);
        this.showAllRRuleDateList();
      });
  }

  LoadQuestionaries() {
    this.disableBtnQ = true;
    this.disableBtnNA = false;

    this.getAllQuestionaries();
  }

  showAllRRuleDateList() {
    let eventToAddInCalendar: EventSourceInput = [];
    for (let r of this.reminderDtoList!) {
      console.log(r.reminderDto.r_string_rule);
      eventToAddInCalendar.push({
        id: r.strsRemsDto.id + "",
        title: r.reminderDto.r_title,
        rrule: r.reminderDto.r_string_rule,
        color: r.strsRemsDto.event_color,
        duration: r.strsRemsDto.event_duration
      });
    }
    UtilsService.refreshCalendarEvents(this.calendarComponent!, eventToAddInCalendar);
  }

  showRRuleDateList(id: number | undefined) {
    let eventToAddInCalendar: EventSourceInput = [];
    let reminderFound = this.reminderDtoList!.find(x => x.strsRemsDto.id == id);
    console.log(reminderFound!.reminderDto.r_string_rule);

    eventToAddInCalendar.push({
      id: reminderFound!.strsRemsDto.id + "",
      title: reminderFound!.reminderDto.r_title,
      rrule: reminderFound!.reminderDto.r_string_rule,
      color: reminderFound!.strsRemsDto.event_color,
      duration: reminderFound!.strsRemsDto.event_duration
    });

    UtilsService.refreshCalendarEvents(this.calendarComponent!, eventToAddInCalendar);

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
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Evento ricorsivo approvato'});
          }, error => {
            console.error('There was an error!', error);
          });
      },
      reject: (type: any) => {
        switch (type) {
          case ConfirmEventType.REJECT:
            this.messageService.add({severity: 'error', summary: 'Rejected', detail: 'Evento ricorsivo non approvato'});
            break;
          case ConfirmEventType.CANCEL:
            this.messageService.add({severity: 'warn', summary: 'Cancelled', detail: 'Chiusa la finestra di conferma'});
            break;
        }
      }
    });
  }

  formatDateDD_MM_YYYY(date: Date | number[] | undefined) {
    return UtilsService.formatDateDD_MM_YYYY(date);
  }

  formatDate(date: string | undefined){
    return UtilsService.formatDateDD_MM_YYYY_FromString(date);
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

    console.log(rule.toString());

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
    let structureDto: StructureDto = {};
    //recupero tipo di domanda in base alla domanda selezionata.
    let qType = this.elencoDomande?.find(t => t.domande[0].id == this.profileForm.value.domanda_scelta.id).tipo;
    switch (qType) {
      case QUESTIONARIES: {
        structureDto = {
          idQuestionary: this.profileForm.value.domanda_scelta.id
        };
        break;
      }
      case TASKS: {
        structureDto = {
          idTasks: this.profileForm.value.domanda_scelta.id
        };
        break;
      }
      case CHALLENGES: {
        structureDto = {
          idChallenges: this.profileForm.value.domanda_scelta.id
        };
        break;
      }
      case RANDOMTASKS: {
        structureDto = {
          idRandomTask: this.profileForm.value.domanda_scelta.id
        };
        break;
      }
    }

    //informazioni sulla tabella delle relazioni.
    let strsRemsDto: StrsRemsDto = {
      creator: "manuel@Outlook.it",
      event_duration: this.profileForm.value.durata_evento,
      event_color: this.profileForm.value.colore_evento
    };

    //oggetto che racchiude le 3 informazioni.
    var body: NewReminderDTO = {
      reminderDto: reminderDto,
      strsRemsDto: strsRemsDto,
      structureDto: structureDto
    };

    console.log(body);

    this.http.post<any>('http://localhost:8080/reminders/create', body).subscribe(data => {
      console.log(data);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Dati salvati in attesa di approvazione.'
      });
      this.LoadListaEventiNonApprovati();
    }, error => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Errore nell\'invio dei dati. Verificare i campi nel form di invio'
      });
    });
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
    if (this.profileForm.value.selectedInstance != null && this.profileForm.value.selectedInstance.code == "RRule.WEEKLY") {
      this.disableDayOftheWeek = false;
    } else {
      this.disableDayOftheWeek = true;
    }

  }

  /**
   * Recupero tutte le domande (di questionaries).
   */
  getAllQestions() {
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

  /**
   * prendo tutti i questionaries
   */
  getAllQuestionaries() {
    this.http.get<Array<Questionnaire>>("http://localhost:8090/questionnaires", httpOptions)
      .subscribe(data => {
        this.questionariesList = data;
        //mostro sul calendario tutte le ricorrenze della tabella questionaries (discriminare in base allo stato)
        this.CaricaQuestionariesDaDatabase(this.questionariesList);
      });
  }

  /**
   * Carica le domande già approvate per visualizzazione su calendario.
   * @param data
   * @constructor
   */
  CaricaQuestionariesDaDatabase(data: Array<Questionnaire>) {

    let eventToAddInCalendar: EventSourceInput = [];
    for (let questionarie of data) {

      let reminderStartDate = new Date(questionarie.date);

      eventToAddInCalendar.push({id: questionarie.id, title: questionarie.name, date: reminderStartDate, color: 'Green'});
    }
    UtilsService.refreshCalendarEvents(this.calendarComponent!, eventToAddInCalendar);
  }

  salvaEvento() {
    console.log("/////////////" + this.selectedDate);
    //this.addEvents(this.selectedDate!);
    this.sendRequest();
    this.closeDialog();
  }

  handleDateClick(event: any) {
    if (UtilsService.selectedDateIsAfterToday(event.date)) {
      console.log("click", event)
      this.selectedDate = event.date;
      this.showDialog();
    }
  }

  showDialog() {
    this.display = true;
  }

  closeDialog() {
    this.display = false;
  }


  deleteQuestionarie(id: string) {
    this.confirmationService.confirm({
      message: 'Vuoi proseguire con l\'eliminazione dell\'evento? ',
      header: 'Confirma',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        console.log("post");
        this.http.post<any>("http://localhost:8080/reminders/deleteQuestionarieFromid", id)
          .subscribe(data => {
            this.getAllQuestionaries();
            this.displayDetailModal = false;
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Evento eliminato'});
          }, error => {
            console.error('There was an error!', error);
          });
      },
      reject: (type: any) => {
        switch (type) {
          case ConfirmEventType.REJECT:
            this.messageService.add({severity: 'error', summary: 'Rejected', detail: 'Evento non eliminato'});
            break;
          case ConfirmEventType.CANCEL:
            this.messageService.add({severity: 'warn', summary: 'Cancelled', detail: 'Ciusa la finestra di eliminazione'});
            break;
        }
      }
    });


  }

  editQuestionarie(id: string) {
    console.log(this.selectedReminderQDetail!.date.substr(0,10));
    this.displayDetailModal = false;
    this.editQuestionarieDialog = true;
    let questionareFound = this.questionariesList!.find(x => x.id == id);
    let d = new Date(questionareFound!.date);
    console.log(this.elencoDomande);
    console.log(questionareFound!.questionid);
    this.domanda_evento.setValue(questionareFound!.questionid);
    this.data_evento.setValue(d);
    this.ora_evento.setValue(d);
    this.durata_evento.setValue(questionareFound!.duration);
  }

    SendModificaEvento() {

      let a = new Date(this.ora_evento.value);
      let b = new Date(this.data_evento.value);
      b.setHours(a.getHours());
      b.setMinutes(a.getMinutes());



    let modifiedQuestionary: Questionnaire = {
      id:this.selectedReminderQDetail!.id,
      questionid: this.domanda_evento.value,
      duration: this.durata_evento.value,
      name: this.selectedReminderQDetail!.name,
      date: b.toISOString(),
      status: this.selectedReminderQDetail!.status,
      target:this.selectedReminderQDetail!.target,
      ordering:this.selectedReminderQDetail!.ordering,
      timeinterval: this.selectedReminderQDetail!.timeinterval,
      description: this.selectedReminderQDetail!.description
    }
    console.log(modifiedQuestionary);

    this.confirmationService.confirm({
      message: 'Vuoi proseguire con la modifica dell\'evento? ',
      header: 'Confirma',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        console.log("post");
        this.http.post<any>("http://localhost:8080/reminders/modificaQuestionarie", modifiedQuestionary)
          .subscribe(data => {
            this.getAllQuestionaries();
            this.editQuestionarieDialog = false;
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Evento eliminato'});
          }, error => {
            console.error('There was an error!', error);
          });
      },
      reject: (type: any) => {
        switch (type) {
          case ConfirmEventType.REJECT:
            this.messageService.add({severity: 'error', summary: 'Rejected', detail: 'Evento non eliminato'});
            break;
          case ConfirmEventType.CANCEL:
            this.messageService.add({severity: 'warn', summary: 'Cancelled', detail: 'Chiusa la finestra di eliminazione'});
            break;
        }
      }
    });

  }

  deleteReminder(id: number|undefined) {
    this.confirmationService.confirm({
      message: 'Vuoi proseguire con la modifica dell\'evento? ',
      header: 'Confirma',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        console.log("post");
        this.http.post<any>("http://localhost:8080/reminders/deleteFromId", id)
          .subscribe(data => {
            this.LoadListaEventiNonApprovati();
            this.displayDetailModal = false;
            this.messageService.add({severity: 'success', summary: 'Success', detail: 'Ricorrenze eliminate'});
          }, error => {
            console.error('There was an error!', error);
          });
      },
      reject: (type: any) => {
        switch (type) {
          case ConfirmEventType.REJECT:
            this.messageService.add({severity: 'error', summary: 'Rejected', detail: 'Ricorrenze non eliminate'});
            break;
          case ConfirmEventType.CANCEL:
            this.messageService.add({severity: 'warn', summary: 'Cancelled', detail: 'Chiusa la finestra di eliminazione'});
            break;
        }
      }
    });
  }

}
