import {MeteorObservable} from "meteor-rxjs";
import { HTTP } from 'meteor/http'
import { MatDialog, MatDialogRef } from '@angular/material';
import {Component, OnInit, ChangeDetectorRef, ViewChild, Input, OnChanges, Output, OnDestroy} from '@angular/core';
import { FormGroup, FormBuilder, Validators} from '@angular/forms';
import {NotificationsService} from 'angular2-notifications';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {DatePickerDirective, IDayCalendarConfig} from 'ng2-date-picker';
import * as moment from 'moment';
import * as _ from "underscore";
import { CustomerMeeting } from '../../../../../../both/models/customerMeeting.model';
import { MeetingNote } from '../../../../../../both/collections/meetingNotes.collection';
import * as funcs from '../../../../../../both/functions/common';
import * as SystemConfig from '../../../../../../both/config/systemConfig';
import { Random } from 'meteor/random';
import { meetingNotesComponent } from '../meeting-notes/meeting-notes.component';
import {EventEmitter} from '@angular/core';

import {SystemLogsService} from "../../../../services/SystemLogs.service";
import {EventEmitterService} from "../../../../services";
import {CustomersService} from "../../customers.service";
import { map, switchMap, tap } from "rxjs/operators";

@Component({
  selector: 'customers-meetings-form',
  templateUrl: 'customers-meetings-create.component.html',
  styleUrls: ['customers-meetings-create.component.scss']
})

export class CustomersMeetingsCreateComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild("dateFromDp") public dateFromDp: DatePickerDirective;
  @ViewChild("dateToDp") public dateToDp: DatePickerDirective;
  @ViewChild(meetingNotesComponent) public meetingNotes: meetingNotesComponent;
  @Input() newMeeting : any;
  @Output() eventEmitter = new EventEmitter<any>();

  eventSubscriber :any;
  options = SystemConfig.alertOptions;
  isDataReady: boolean = false;
  isUserMeeting: boolean = false;
  meetingId: string;
  meeting: any = {};
  notesObj: any = {};
  previousNotes: any = {};
  completeStatus = false;
  showCompleteButton: boolean = false;
  showPreviousNotes: boolean = false;
  dateTimeConfig = <IDayCalendarConfig>{
    locale: moment.locale(),
    disableKeypress: true,
    drops: 'down',
    firstDayOfWeek: "su",
    format: "DD MMM YYYY hh:mm A",
    dayBtnFormat: "D",
    minutesInterval: 15,
  };
  endDateTimeConfig = <IDayCalendarConfig>{
    locale: moment.locale(),
    disableKeypress: true,
    drops: 'down',
    firstDayOfWeek: "su",
    format: "DD MMM YYYY hh:mm A",
    dayBtnFormat: "D",
    minutesInterval: 15,
  };
  externalStages:any = [{
    $limit: 5
  }];
  view: string;
  email: string;
  userName: string;
  microsoftId: string;
  shipTo: string;
  customerMeeting: FormGroup;
  followUp: any = {};
  customerNameTitle: string;
  customerNumber: string;
  customerHasNoBranches: boolean = false;
  customerId: string;
  customerAddress: string;
  documentId: string;
  labelTabs: any = {
    sales: 'Sales',
    pricing: 'Pricing',
    customerService: 'Customer Service',
    coolAir: 'Cool Air',
    marketing: 'Marketing',
    turbo: 'Turbo 200',
    ditek: 'Ditek',
    ductTies: 'Duct Ties',
    hungRite: 'Hung-Rite',
    noark: 'Noark',
    mueller: 'Mueller'
  };
  statuses = [{
    value: 'Pending',
    viewValue: 'Pending'
  },
    {
      value: 'Cancelled',
      viewValue: 'Cancelled'
    },
    {
      value: 'Complete',
      viewValue: 'Complete'
    }
  ];
  meetingTypes = [
    "Appointment",
    "Branch Call",
    "Counter Date",
    "Contractor Ride Along",
    "Contractor Call",
    "Corporate Call",
    "Open House",
    "Trade Show"
  ];

  lookupConfig = {
    removeShadow: true,
    isReactiveUpdate: true,
    enableMultipleUsersUpdate: true
  }
  pageHeaderInput:String = "Customer Meetings";
  noteState: boolean = false;

  constructor(private dialog: MatDialog, private route: ActivatedRoute,
              private _service: NotificationsService, private router: Router, private cdRef: ChangeDetectorRef,
              private _fb: FormBuilder,
              private _router: Router,
              private systemLogsService: SystemLogsService,
              public _customerService: CustomersService
              ) {}

  ngOnInit() {
    const newMeeting = new CustomerMeeting();

    this.customerMeeting = this._fb.group({
      description: ['', < any > Validators],
      dateTime: [newMeeting.dateTime, < any > Validators],
      endDateTime: [newMeeting.endDateTime, < any > Validators],
      contact: [""],
      branch: ['', < any > Validators],
      status: [newMeeting.status, < any > Validators],
      userName: ['', < any > Validators],
      customerName: ['', < any > Validators],
      userId: [newMeeting.userId, < any > Validators],
      customerId: ['', < any > Validators],
      microsoftId: ['', < any > Validators],
      branchShipTo: ['', < any > Validators],
      branchId: ['', < any > Validators],
      contactId: ['', < any > Validators],
      meetingType: ['Appointment', < any > Validators],
    });

    this.followUp = {
      dateTime: moment(new Date(newMeeting.dateTime)).format(this.dateTimeConfig.format),
      endDateTime: moment(new Date(newMeeting.endDateTime)).format(this.dateTimeConfig.format)
    };

    this.route.params.subscribe((params: Params) => {
      this.meetingId = params['meetingId'];
      this.completeStatus = false;
      if (this.meetingId) {

        // let buttons = [
        //   {
        //     "title": "Delete Meeting",
        //     "eventName": "delete"
        //   },
        // ]
        // this.headerButton(buttons);
        MeteorObservable.call('findOne', 'customerMeetings', {
          _id: this.meetingId
        }).subscribe(meeting => {
          if (meeting) {
            this.isUserMeeting = Meteor.userId() === meeting['userId'] ? true : false;
            this.meeting = meeting;
            this.documentId = meeting['customerId'];
            this.userName = meeting['userName'];
            let previousNotesValues = {
              customerService: meeting['customerServiceNotes'],
              ditek: meeting['ditekNotes'],
              hungRite: meeting['hungRiteNotes'],
              marketing: meeting['marketingNotes'],
              ductTies: meeting['ductTiesNotes'],
              noark: meeting['noarkNotes'],
              mueller: meeting['muellerNotes'],
              pricing: meeting['pricingNotes'],
              coolAir: meeting['coolAirNotes'],
              sales: meeting['salesNotes'],
              turbo: meeting['turboNotes'],
            }
            for (let key in meeting) {
              if (key === "dateTime") {
                meeting[key] = moment(new Date(meeting[key])).format(this.dateTimeConfig.format);
                this.endDateTimeConfig['min'] = meeting[key];
              }
              if (key === "endDateTime") {
                meeting[key] = (meeting['endDateTime'] !== undefined) ? moment(new Date(meeting[key])).format(this.dateTimeConfig.format) : moment(new Date(meeting[key])).add(1, 'hours').format(this.dateTimeConfig.format);
              }
              this.customerMeeting.patchValue({
                [key]: meeting[key]
              });
            }
            for (let key in previousNotesValues) {
              if (previousNotesValues[key] !== undefined && previousNotesValues[key] !== "") {
                this.labelTabs[key] += (this.labelTabs[key].indexOf(" *") > -1) ? "" : " *";
              }
            }
            this.microsoftId = meeting['microsoftId'];
            this.customerNameTitle = meeting['customerName'];

            if (meeting['parentMeetingId']){
              this.followUp.parentMeetingId = meeting['parentMeetingId'];
            }

            MeteorObservable.call('findOne', 'customers', {
              _id: meeting['customerId']
            }).subscribe(customer => {
              if (customer) {
                this.customerId = customer['_id'];
                this.customerNumber = customer['customer'];
                this.customerAddress = customer["address1"] + ", " +
                  customer["city"] + ", " +
                  customer["state"] + ", " +
                  customer["zipCode"];
                this.pageHeaderInput = `Customer Meetings > ${this.customerNumber} - ${this.customerNameTitle}`;

                this.isDataReady = true;
              }
            })

            if (meeting['status'] === "Complete") {
              this.completeStatus = true;
            }
          } else {
            this._service.error(
              "Error",
              "Could not find the meeting"
            );
            setTimeout(() => {
              this.router.navigate(['/customers/meetings']);
            }, 3000)
          }
        })
      } else {
        this.endDateTimeConfig['min'] = newMeeting.dateTime.toString();
        this.isDataReady = true;
      }
    });

    MeteorObservable.call('returnUser', Meteor.userId()).subscribe(user => {
      this.email = user["emails"][0].address;
      this.customerMeeting.patchValue({
        userName: user["profile"].firstName + " " + user["profile"].lastName
      });
    })

    this.customerMeeting.get("dateTime").valueChanges.subscribe(value => {
      if (this.dateToDp !== undefined) {
        this.dateToDp.config = {
          min: value,
          ...this.dateTimeConfig
        }
      }
    });
    console.log(this.meetingNotes)
    this.hookEvents();
  }

  getState(event){
    this.noteState = event;
  }

  hookEvents() {
    this.eventSubscriber = EventEmitterService.Events.subscribe(res => {
      if (res.name) {
        switch (res.name) {
          case 'addMeeting':
            this._addMeeting(this.customerMeeting);
            break;
          case 'delete':
            this.openDialog();
            break;
          case 'complete':
            this._completeMeeting(this.customerMeeting);
            break;
          default:
        }
      }
    });
  }

  trigger(){
    // return this.customerMeeting.valid
  }

  getNotes(){
    let notes = this.meetingNotes.returnNotes();
    console.log(notes);
    
    const objControl = this.customerMeeting.controls;
    this.customerMeeting = this._fb.group({...objControl, ...this.generateNewFormControlObj(notes)});
    this.customerMeeting.patchValue(notes)
  }
  
  generateNewFormControlObj(notes){
    let obj = {};
    let noteObject = notes;

    for (let note in noteObject) {
      obj[note] = ['', <any>Validators];
    }

    return obj;
  }

  ngOnChanges(changes) {
    if (this.customerMeeting) {
      Object.keys(changes.newMeeting.currentValue).forEach(_key => {
        if (_key == 'customerId') {
          this.documentId = changes.newMeeting.currentValue[_key];
        }
        this.customerMeeting.controls[_key].setValue(changes.newMeeting.currentValue[_key]);
      })
    }
  }

  addMeeting() {
    if (!this.meetingId) {
      let email = this.email;
      let eventData = {
        subject: this.customerMeeting.value.customerName + " " + this.customerMeeting.value.branch,
        start: {
          "dateTime": moment(new Date(this.customerMeeting.value.dateTime)).format().toString(),
          "timeZone": "UTC"
        },
        end: {
          "dateTime": moment(new Date(this.customerMeeting.value.endDateTime)).format().toString(),
          "timeZone": "UTC"
        },
      };
      let data = {
        email: email,
        eventData: eventData
      };

      this.callMethod(data);
    }
  }

  generate365Data(customData?) {
    let meetingData = customData ? customData : this.customerMeeting.value
    let email = this.email;
    let eventData = {
      subject: meetingData.customerName + " " + meetingData.branch,
      start: {
        "dateTime": moment(new Date(meetingData.dateTime)).format().toString(),
        "timeZone": "UTC"
      },
      end: {
        "dateTime": moment(new Date(meetingData.endDateTime)).format().toString(),
        "timeZone": "UTC"
      },
    };
    let data = {
      email: email,
      eventData: eventData
    };

    return data;
  }

  addToMicroSoft365(data) {
    return this.methodFor365(data, "POST", '/addMeeting');
  }

  async callMethod(data) {
    this.isDataReady = false;
    let eventResult = await this.addToMicroSoft365(data).catch(error => console.log(error));
    // let eventResult = null;
    if (eventResult !== null && eventResult !== "" && eventResult !== undefined) {
      this.customerMeeting.patchValue({
        microsoftId: eventResult['id'],
      });

      let meetingObj = this.customerMeeting.value;
      meetingObj['dateTime'] = new Date(this.customerMeeting.value.dateTime);
      meetingObj['endDateTime'] = new Date(this.customerMeeting.value.endDateTime);
      meetingObj['tenantId'] = Session.get('tenantId');

      MeteorObservable.call('insert', 'customerMeetings', meetingObj).subscribe((res: any) => {
        this._service.success(
          "New Meeting Added",
          this.customerMeeting.value.customerName, {
            timeOut: 5000,
            showProgressBar: true,
            pauseOnHover: false,
            clickToClose: false,
            maxLength: 10
          }
        );
        this.router.navigate(['customers/meetings/']);
      });
    } else {
      this.isDataReady = true;
      this._service.error(
        "Meeting Not Added",
        'Contact Support', {
          timeOut: 5000,
          showProgressBar: true,
          pauseOnHover: false,
          clickToClose: false,
          maxLength: 10
        }
      )
      let emailData = {
        to: "support@globalthesource.com",
        from: this.email,
        bcc: "",
        subject: this.customerMeeting.value.userName + ' - Issue Submitting Meeting',
        html: ""
      };
      emailData.html = `Meeting could not be submitted. No Microsoft ID created.<br>`;
      emailData.html += `<h3>Meeting Info:</h3>`;
      emailData.html += `<strong>Customer: </strong> ` + this.customerMeeting.value.customerName + `<br>`;
      emailData.html += `<strong>CustomerId: </strong> ` + this.customerMeeting.value.customerId + `<br>`;
      emailData.html += `<strong>Branch: </strong> ` + this.customerMeeting.value.branch + `<br>`;
      emailData.html += `<strong>Meeting Date: </strong> ` + this.customerMeeting.value.dateTime + `<br>`;
      MeteorObservable.call('sendSupportEmail', emailData).subscribe(meeting => { })
    }
  }

  setMeeting(meeting) {
    this.customerMeeting = meeting;
  }

  getMeeting() {
    return this.customerMeeting;
  }

  async _addMeeting(customerMeeting) {
    this.isDataReady = false;

    let meetingId = await this._addMeetingToDatabase(customerMeeting).catch(error => console.log(error));
    // let followUpMeeting = await this._addFollowUpMeeting(customerMeeting).catch(error => console.log(error));
    if (!funcs.isEmptyString(meetingId)) {
      // if get meeting id
      this.meetingId = meetingId;
      this.isDataReady = true;
      this.router.navigate(['customers/meetings/']);
    } else {
      // failed
    }
  }

  async _addFollowUpMeeting(customerMeeting) {
    let meetingObj = customerMeeting.value;
    
    meetingObj = Object.assign(meetingObj, {
      dateTime: this.followUp.dateTime,
      endDateTime: this.followUp.endDateTime,
      status: 'Pending',
      followUp: true,
      parentMeetingId: ('parentMeetingId' in this.followUp) ? this.followUp['parentMeetingId']: this.meetingId,
      tenantId: Session.get('tenantId'),
    })

    let data = this.generate365Data(meetingObj);
    let eventResult = await this.addToMicroSoft365(data).catch(error => console.log(error));
    if (!funcs.isEmptyObject(eventResult)) {
      meetingObj = Object.assign(meetingObj, {
        microsoftId: eventResult['id'],
      })
    }
    meetingObj['dateTime'] = new Date(meetingObj.dateTime);
    meetingObj['endDateTime'] = new Date(meetingObj.endDateTime);
    let insertResult: any = await funcs.callbackToPromise(MeteorObservable.call('insert', 'customerMeetings', meetingObj));

    let log = {
      _id: Random.id(),
      collectionName: 'customerMeetings',
      type: "Insert",
      log: 'customers/meetings/create, follow-up ' + this.customerId + ', ' + meetingObj.branch,
      createdAt: new Date(),
    };
    this.systemLogsService._log$(log).subscribe();
    return insertResult;
  }

  async _addMeetingToDatabase(customerMeeting) {
    this.customerMeeting = customerMeeting;
    this.getNotes();
    let data = this.generate365Data();
    let eventResult = await this.addToMicroSoft365(data).catch(error => console.log(error));

    if (!funcs.isEmptyObject(eventResult)) {
      this.customerMeeting.patchValue({
        microsoftId: eventResult['id'],
      });
    }
    let meetingObj = this.customerMeeting.value;
    meetingObj['dateTime'] = new Date(this.customerMeeting.value.dateTime);
    meetingObj['endDateTime'] = new Date(this.customerMeeting.value.endDateTime);
    meetingObj['tenantId'] = Session.get('tenantId');

    let insertResult:any = await funcs.callbackToPromise(MeteorObservable.call('insert', 'customerMeetings', meetingObj));

    if (!funcs.isEmptyString(insertResult)) {
      EventEmitterService.Events.emit({
        componentName: 'dashboard',
        name: 'success',
        title: 'New Meeting Added',
        content: this.customerMeeting.value.customerName
      });
    } else {
      EventEmitterService.Events.emit({
        componentName: 'dashboard',
        name: 'error',
        title: 'Meeting Not Added',
        content: 'Contact Support'
      });
    }

    let log = {
      _id: Random.id(),
      collectionName: 'customerMeetings',
      type: "Insert",
      log: 'customers/meetings/create, ' + this.customerId + ', ' + this.customerMeeting.value.branch,
      createdAt: new Date(),
    };
    this.systemLogsService._log$(log).subscribe();

    return insertResult;
  }

  async _completeMeeting(customerMeeting) {
    if (this.customerMeeting.value.contact && this.customerMeeting.value.contact !== '') {
      this.showCompleteButton = false;
      if (this.meetingId) {
        this.isDataReady = false;
        // if this.meeting id exists, update meeting
        MeteorObservable.call('update', 'customerMeetings', {
          _id: this.meetingId
        }, {
          $set: {
            status: 'Complete'
          }
        }).subscribe(res => {
          if (res > 0) {
            this._sendEmail(customerMeeting.value);
            let value = {
              _id: Random.id(),
              collectionName: 'customerMeetings',
              documentId: this.meetingId,
              document: 'meeting',
              type: 'update.complete',
              fieldPath: 'status_string',
              log: this.customerMeeting.value.userName + ' completed Meeting ' + this.meetingId,
              createdAt: new Date(),
              url: window.location.pathname
            }
            this.systemLogsService._log$(value).subscribe();
          } else {
            let value = {
              _id: Random.id(),
              collectionName: 'Failed to Complete Meeting',
              type: null,
              fieldPath: null,
              log: JSON.stringify(customerMeeting.value),
              createdAt: new Date(),
            }
            this.systemLogsService._log$(value).subscribe();
          }
        })
      } else {
        // if meething id doesn't exist, add a new completed meeting
        let meetingId = await this._addMeetingToDatabase(customerMeeting).catch(error => console.log(error));
        this.meetingId = meetingId;
        if (meetingId) {
          this._sendEmail(customerMeeting.value);
        }
        let value = {
          _id: Random.id(),
          collectionName: 'customerMeetings',
          documentId: this.meetingId,
          type: 'update.complete',
          fieldPath: 'status_string',
          log: this.customerMeeting.value.userName + ' completed Meeting ' + this.meetingId,
          createdAt: new Date(),
          url: window.location.pathname
        }
        this.systemLogsService._log$(value).subscribe();
      }
      if (this.followUp.followUpNeeded) {
        await this._addFollowUpMeeting(customerMeeting).catch(error => console.log(error));
      }
      this.router.navigate(['customers/meetings/']);
    } else {
      EventEmitterService.Events.emit({
        componentName: 'dashboard',
        name: 'error',
        title: 'Meeting Not Complete',
        content: 'Contact Required'
      });
    }
  }

  addCustomer(result) {
    if (!this.completeStatus) {
      if (result) {
        this.customerMeeting.patchValue({
          customerName: result.name,
        });

        MeteorObservable.call('findOne', 'customers', {
          customer: result.customer
        }).subscribe(customer => {
          this.customerMeeting.patchValue({
            customerId: customer["_id"]
          });

          this.customerAddress = customer["address1"] + ", " +
            customer["city"] + ", " +
            customer["state"] + ", " +
            customer["zipCode"];

          this.customerId = customer["_id"];
          this.documentId = customer["_id"];

          if (customer['branches'].length === 0) {
            this.customerHasNoBranches = true;

            if (customer['address1'] !== "" && customer['city'] !== "" && customer['state'] !== "" && customer['zipCode'] !== "") {
              this.customerMeeting.patchValue({
                branch: (customer['address1'] + ", " + customer['city'] + ", " + customer['state'] + ", " + customer['zipCode']).trim()
              });

              this.getNotesPastMeetings('*');
            } else {
              this.customerMeeting.patchValue({
                branch: ""
              });
            }

            if (this.meetingId) {
              this.updateCustomerAndBranch();
            } else {
              this.clearNotesAndTabs();
            }

          } else if (customer['branches'].length === 1) {
            this.addBranch(customer['branches'][0])
            this.getNotesPastMeetings(customer['branches'][0].shipTo);
          } else {
            //clear branch
            this.showView('selectBranch')
            this.customerHasNoBranches = false;
            this.customerMeeting.patchValue({
              branch: ""
            });
          }
        })
      }
      this.showView('');
    }
  }

  // async testRealTimeEmails(meetingValue) {

  //   let noteQuery = { active: true };
  //   let notes: any = await funcs.callbackToPromise(MeteorObservable.call('find', 'meetingNotes', noteQuery));

  //   console.log(meetingValue);
  //   console.log(notes);
  // }

  async _sendEmail(meetingValue) {
    // let result:any = await funcs.callbackToPromise(MeteorObservable.call('find', 'meetingNotes', {active: true}));
    // console.log(result)
    this.getNotes();
    this.meetingNotes.instantEmail(this.customerMeeting.value);
  }

  addBranch(result) {
    if (!this.customerHasNoBranches && !this.completeStatus) {
      if (result) {
        if (!this.customerId) {
          //adds customer info if selecting branch first
          MeteorObservable.call('findOne', 'customers', {
            _id: result._id
          }).subscribe(customer => {
            this.customerMeeting.patchValue({
              customerId: customer["_id"],
              customerName: customer["name"]
            });


            this.customerId = customer["_id"];
            this.documentId = customer["_id"];
          })
        }
        this.labelTabs = _.mapObject(this.labelTabs, function (val, key) {
          if (val.indexOf(" *") > -1) {
            return val.replace(" *", "");
          } else {
            return val;
          }
        });
        this.customerMeeting.patchValue({
          branchShipTo: result.shipTo
        });

        let branch = result.address1 + ", " + result.city + ", " + result.state + ", " + result.zipCode;
        if (result.name !== "") {
          branch = result.name + ", " + branch
        }
        branch = branch.replace(/[, ]+/g, " ").trim();

        this.customerMeeting.patchValue({
          branch: branch
        });
        
        if (this.meetingId) {
          this.updateCustomerAndBranch();
        }

        if (!this.meetingId) {
          this.getNotesPastMeetings(result.shipTo);
        }
      }
    }
    this.showView('');
  }

  get isSlideChecked() {
    return this.showPreviousNotes;
  }
  set isSlideChecked(checked: boolean) {
    this.showPreviousNotes = checked;
  }
  onSlideChange(event) {
    this.isSlideChecked = event.checked;
    if (this.showPreviousNotes) {
      this.getNotesPastMeetings(this.customerMeeting.value.branchShipTo)
    } else {
      this.previousNotes = {
        customerService: [],
        ditek: [],
        hungRite: [],
        marketing: [],
        ductTies: [],
        pricing: [],
        coolAir: [],
        sales: [],
        turbo: [],
        noark: [],
        mueller: []
      }
      let previousNotesValues = {
        customerService: this.meeting['customerServiceNotes'],
        ditek: this.meeting['ditekNotes'],
        hungRite: this.meeting['hungRiteNotes'],
        marketing: this.meeting['marketingNotes'],
        ductTies: this.meeting['ductTiesNotes'],
        pricing: this.meeting['pricingNotes'],
        coolAir: this.meeting['coolAirNotes'],
        sales: this.meeting['salesNotes'],
        turbo: this.meeting['turboNotes'],
        mueller: this.meeting['muellerNotes'],
      }
      for (let key in previousNotesValues) {
        if (previousNotesValues[key] === undefined || previousNotesValues[key] === "") {
          this.labelTabs[key] = (this.labelTabs[key].indexOf(" *") > -1) ? this.labelTabs[key].slice(0, -2) : this.labelTabs[key];
        }
      }
    }
  }

  clearNotesAndTabs(){
    for (let key in this.previousNotes) {
      this.previousNotes[key] = null;
      this.labelTabs[key] = (this.labelTabs[key].indexOf(" *") > -1) ? this.labelTabs[key].slice(0, -2) : this.labelTabs[key];
    }
  }

  getNotesPastMeetings(shipTo) {
    let query = [{
      $match: {
        customerId: this.customerId,
        branchShipTo: shipTo
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $limit: 5
    }
    ];
    if (this.meetingId) {
      let obj = {
        $match: {
          customerId: this.customerId,
          branchShipTo: shipTo,
          _id: {$ne: this.meetingId}
        }
      }
      query.splice(0, 1, obj);
    }
    MeteorObservable.call('aggregate', 'customerMeetings', query).subscribe(branchMeetings => {

      this.previousNotes = {
        customerService: [],
        ditek: [],
        hungRite: [],
        marketing: [],
        ductTies: [],
        pricing: [],
        coolAir: [],
        sales: [],
        turbo: [],
        noark: [],
        mueller: [],
      }

      for (let i = 0; i < Object.keys(branchMeetings['result']).length; i++) {
        let previousNotesValues = {
          customerService: branchMeetings['result'][i].customerServiceNotes,
          ditek: branchMeetings['result'][i].ditekNotes,
          hungRite: branchMeetings['result'][i].hungRiteNotes,
          marketing: branchMeetings['result'][i].marketingNotes,
          ductTies: branchMeetings['result'][i].ductTiesNotes,
          pricing: branchMeetings['result'][i].pricingNotes,
          coolAir: branchMeetings['result'][i].coolAirNotes,
          sales: branchMeetings['result'][i].salesNotes,
          turbo: branchMeetings['result'][i].turboNotes,
          noark: branchMeetings['result'][i].noarkNotes,
          mueller: branchMeetings['result'][i].noarmuellerNoteskNotes,
        }
        let userInfo = branchMeetings['result'][i].user['profile'].firstName + " " + branchMeetings['result'][i].user['profile'].lastName;
        let meetingDate = moment(new Date(branchMeetings['result'][i].dateTime)).format('D MMM, YYYY');

        for (let key in previousNotesValues) {
          if (previousNotesValues[key] !== undefined && previousNotesValues[key] !== "") {
            this.labelTabs[key] += (this.labelTabs[key].indexOf(" *") > -1) ? "" : " *";
            this.previousNotes[key].push({
              note: previousNotesValues[key],
              userInfo: userInfo,
              meetingDate: meetingDate
            })
          }
        }
      }
    })
  }

  updateCustomerAndBranch() {
    let query = {
      _id: this.meetingId
    };
    let update = {
      $set: {
        customerId: this.customerId,
        branch: this.customerMeeting.value.branch,
        customerName: this.customerMeeting.value.customerName,
        branchShipTo: this.customerMeeting.value.branchShipTo
      }
    };

    MeteorObservable.call('update', 'customerMeetings', query, update).subscribe(res => {
      if (res) {
        this._service.success("Success", 'Meeting Updated');
      }
    })
    this.edit365();
  }
  
  onBlurMethod(field, value) {
    
    if (this.meetingId) {
      let query = {
        _id: this.meetingId
      }
      let update = {}
      if (field === 'dateTime' || field === 'endDateTime') {
        update = {
          $set: {
            [field]: new Date(value),
          }
        };
        if (this.microsoftId) {
          this.edit365()
        }
      } else {
        update = {
          $set: {
            [field]: value
          }
        };
        let label = field.substring(0, field.length - 5);
        if (field.includes('Notes') && value) {
          this.labelTabs[label] += (this.labelTabs[label].indexOf(" *") > -1) ? "" : " *";
        }
      }
      if (value !== 'Complete' && value !== undefined) {
        MeteorObservable.call('update', 'customerMeetings', query, update).subscribe(res => {})
      }
    }

    if (field === 'status' && value === "Complete") {
      this.showCompleteButton = true;
      let buttons = [
        {
          "title": "Delete Meeting",
          "eventName": "delete"
        },
        {
          "title": "Complete  Meeting",
          "eventName": "complete"
        },
      ]
      this.headerButton(buttons);
    } else if (field === 'status' && value !== "Complete") {
      this.showCompleteButton = false;
    }
  }

  completeMeeting() {
    this.showCompleteButton = false;
    const meetingValue = this.customerMeeting.value;
    this.notesObj = {
      salesNotes: meetingValue.salesNotes,
      pricingNotes: meetingValue.pricingNotes,
      customerServiceNotes: meetingValue.customerServiceNotes,
      coolAirNotes: meetingValue.coolAirNotes,
      marketingNotes: meetingValue.marketingNotes,
      turboNotes: meetingValue.turboNotes,
      ditekNotes: meetingValue.ditekNotes,
      ductTiesNotes: meetingValue.ductTiesNotes,
      hungRiteNotes: meetingValue.hungRiteNotes,
      noarkNotes: meetingValue.noarkNotes,
      muellerNotes: meetingValue.muellerNotes,
    }
    if (this.meetingId) {
      MeteorObservable.call('update', 'customerMeetings', {
        _id: this.meetingId
      }, {
        $set: {
          status: 'Complete'
        }
      }).subscribe(res => {
        if (res > 0) {
          this.sendEmail(meetingValue);
        } else {
          let value = {
            _id: Random.id(),
            collectionName: 'Failed to Complete Meeting',
            type: null,
            fieldPath: null,
            log: JSON.stringify(meetingValue),
            createdAt: new Date(),
          }
          this.systemLogsService._log$(value).subscribe();
        }

      })
    } else if (this.meetingId === undefined) {
      this.addMeeting();
    }
  }

  sendEmail(meetingValue) {
    //***************EMAIL NOTES*********
    if (!this.completeStatus) {
      let noteEmails = {};
      let noteEmailSubjects = {};
      let noteEmailSendInfo = {};
      let query = {
        name: {
          "$in": ['meetingNotesPricing',
            'meetingNotesSales',
            'meetingNotesService',
            // 'meetingNotesReceivable',
            'meetingNotesCoolAir',
            'meetingNotesMarketing',
            'meetingNotesDitek',
            'meetingNotesTurbo200',
            'meetingNotesHungRite',
            'meetingNotesDuctTies',
            'meetingNotesNoark',
            'meetingNotesMueller',
          ]
        }
      }
      MeteorObservable.call('find', 'systemAlerts', query).subscribe((alerts: any[]) => {
        for (let i = 0; i < alerts.length; i++) {
          let emailObj = {
            identifier: alerts[i]['email'].identifier,
            emails: alerts[i]['email'].to,
            subject: alerts[i]['email'].subject,
            from: alerts[i]['email'].from,
          }
          if (!Meteor.settings.public.isProduction) {
            emailObj.emails = alerts[i]['email'].temp
          }

          emailObj.from = (alerts[i]['email'].from !== null &&
            alerts[i]['email'].from !== undefined &&
            alerts[i]['email'].from !== "") ? alerts[i]['email'].from : this.email;

          if (emailObj.identifier !== undefined &&
            this.notesObj[emailObj.identifier] !== undefined &&
            this.notesObj[emailObj.identifier] !== "") {

            let emailData = {
              to: "",
              from: "",
              bcc: "",
              subject: meetingValue.customerName,
              html: ""
            };

            let html = `A meeting has been completed!<br>`;
            html += `<h3>Meeting Info:</h3>`;
            html += `<strong>Customer: </strong> ` + meetingValue.customerName + `<br>`;
            html += `<strong>Branch: </strong> ` + meetingValue.branch + `<br>`;
            html += `<strong>Sales Person: </strong> ` + Meteor.user().profile.firstName + Meteor.user().profile.lastName + `<br>`;
            html += `<strong>Meeting Date: </strong> ` + meetingValue.dateTime + `<br>`;

            // emailData.html = html;
            emailData.to = emailObj.from;
            emailData.from = emailObj.from;
            emailData.bcc = emailObj.emails;
            emailData.subject = emailObj.subject + meetingValue.customerName;
            // emailData.html += `<strong>Notes: </strong> ` + this.notesObj[emailObj.identifier]
            let variables = {
              logo: 'https://app.yibas.com/img/Global-White.png',
              Customer: meetingValue.customerName,
              Address: this.customerAddress,
              Branch: meetingValue.branch,
              SalesPerson: Meteor.user().profile.firstName + ' ' + Meteor.user().profile.lastName,
              Date: meetingValue.dateTime,
              MeetingNotes: this.notesObj[emailObj.identifier]
            };

            MeteorObservable.call('sendEmail', emailData, 'html-email.html', variables).subscribe(emailResponse => {
              if (emailResponse){
                let value = {
                  _id: Random.id(),
                  collectionName: 'Failed Meeting Email',
                  type: null,
                  fieldPath: null,
                  log: JSON.stringify(emailResponse),
                  createdAt: new Date(),
                }
                this.systemLogsService._log$(value).subscribe();
              }
            })
          }
        }
      })
    } else {

    }
    if (this.meetingId !== undefined) {
      this.router.navigate(['customers/meetings/']);
    }
  }

  closed() {
    let datetime = moment(new Date(this.customerMeeting.value.dateTime)).add(1, 'hours').format(this.dateTimeConfig.format);
    this.customerMeeting.patchValue({
      endDateTime: datetime
    });
    this.onBlurMethod('endDateTime', datetime);
  }

  edit365() {
    let eventData = {
      subject: this.customerMeeting.value.customerName + " " + this.customerMeeting.value.branch,
      start: {
        "dateTime": moment(new Date(this.customerMeeting.value.dateTime)).format().toString(),
        "timeZone": "UTC"
      },
      end: {
        "dateTime": moment(new Date(this.customerMeeting.value.endDateTime)).format().toString(),
        "timeZone": "UTC"
      },
    };

    let data = {
      email: this.email,
      microsoftId: this.microsoftId,
      eventData: eventData,
    };

    this.methodFor365(data, 'PATCH', '/editMeeting');
  }

  delete() {
    MeteorObservable.call('remove', 'customerMeetings', {
      _id: this.meetingId
    }, true).subscribe(res => {
      this._service.success(
        'Success',
        'Removed Successfully'
      );
    });

    let data = {
      email: this.email,
      microsoftId: this.microsoftId
    };

    this.methodFor365(data, 'DELETE', '/deleteMeeting');

    this.router.navigate(['customers/meetings/']);
  }

  methodFor365(data, httpMethod, functionName) {
    if (Meteor.user().profile.intergrate365) {
      return new Promise(resolve => {
        HTTP.call('GET', '/auth', {
          content: 'string'
        }, (err, tokenResult) => {
          if (!err) {
            let token = tokenResult.content;
            data['token'] = token;
            HTTP.call(httpMethod, functionName, {
                data
              },
              (err, eventResult) => {
                if (!err && functionName === '/addMeeting') {
                  let event = JSON.parse(eventResult.content);
                  resolve(event);
                } else {
                  resolve('')
                }
              });
          }
        });
      })
    }
  }

  select(event) {
    let row = event.value;
    switch(row.collectionName) {
      case "Meeting":
        this.router.navigate(['customers/meetings/' + row['documentId']]);
        break;
      case "Order":
        this.router.navigate(['customers/orders/' + row['documentId']]);
        break;
      case "Invoice":
        this.router.navigate(['customers/invoices/' + row['documentId']]);
        break;
      case "Quote":
        this.router.navigate(['customers/quotes/' + row['documentId']]);
        break;
    }
  }

  headerButton(buttons){
    EventEmitterService.Events.emit({ name: "loadPageheaderButtons", value: buttons });
  }

  goBack() {
    // window.history.back();
    this.router.navigate(['customers/meetings']);
  }

  showView(view) {
    this.view = view;
    this._router.navigate([], { queryParams: { view }, queryParamsHandling: 'merge' })
  }

  openDialog(): void {
    let dialogRef = this.dialog.open(DeleteDialog, {
      width: '250px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.delete();
      }
    });
  }

  closeFollowUpStartTime() {
    this.followUp.endDateTime = moment(new Date(this.followUp.dateTime)).add(1, 'hour').format(this.dateTimeConfig.format)
  }

  insertMeeting() {

  }

  editDate() {
    // console.log("edit'");
  }

  editCustomer() {

  }

  editBranch() {

  }

  goToStepper(stepperIndex: number) {
    // this.eventEmitter.emit({name: "goToStepper", value: stepperIndex})
    this.router.navigate([], {queryParams: {stepperIndex}, queryParamsHandling: 'merge'});
  }

  ngOnDestroy() {
    this.eventSubscriber.unsubscribe();
  }
}

@Component({
  selector: 'deleteDialog',
  templateUrl: '../deleteDialog.html',
})
export class DeleteDialog {

  constructor(
    public dialogRef: MatDialogRef<DeleteDialog>) { }

  click(result): void {
    this.dialogRef.close(result);
  }

}
