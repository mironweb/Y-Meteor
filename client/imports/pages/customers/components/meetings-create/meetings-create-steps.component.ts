import { Component, Input, OnDestroy, ViewChild} from '@angular/core';
import { Email } from 'meteor/email';
import { Router, ActivatedRoute } from '@angular/router';
import {SystemOptionsService} from "../../../../services/SystemOptions.service";
import { OnInit } from '@angular/core/src/metadata/lifecycle_hooks';
import {PrintService} from "../../../../services/Print.service";
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { CustomerMeeting } from '../../../../../../both/models/customerMeeting.model';
import * as cloneDeep from 'clone-deep';
import moment = require("moment");
import {IDayCalendarConfig} from "ng2-date-picker";
import {MeteorObservable} from "meteor-rxjs";
import { Random } from 'meteor/random';

import { EventEmitterService } from "../../../../services";

import {fromEvent} from "rxjs";
import {NotificationsService} from "angular2-notifications";

import * as STATES from '../../../../../../both/config/states';
import {Observable} from "rxjs/Observable";
import {map, startWith, switchMap, take} from "rxjs/operators";
import {CustomersService} from "../../customers.service";
import {of} from "rxjs/index";
import {dateTimeFormat} from '../../../../../../both/config/systemConfig';
import {MatDialog} from "@angular/material";
import {DialogSelect} from "../../../../modules/shared-module/system-lookup/system-lookup.component";
import {Subscriber} from "rxjs/Subscriber";
import {UserService} from "../../../../services/UserService";
import {SystemLogsService} from "../../../../services/SystemLogs.service";


@Component({
  selector: 'meetings-create-steps',
  template: `
    <mat-horizontal-stepper [linear]="isLinear" #stepper (animationDone)="animationDone()">
      
      <ng-template matStepperIcon="edit">
        <mat-icon style="padding: 4px; border-radius: 50px;" [ngStyle]="{'background-color': firstFormGroup.controls['customerLabel']?'green': 'undefined'}">check</mat-icon>
      </ng-template>

      <ng-template matStepperIcon="done">
        <mat-icon>done_all</mat-icon>
      </ng-template>

      <ng-template matStepperIcon="number" let-index="index">
        <div [ngSwitch]="index" style="padding-top: 3px; padding-left: 7px;">
          <div *ngSwitchCase="'0'">
            <div *ngIf="stepper.selectedIndex == 0; else normal">
              <mat-icon *ngIf="firstFormGroup.invalid && showErrors[0]; else normal" style="position: relative; left: -3px;">warning</mat-icon>
            </div>
          </div>
          <div *ngSwitchCase="'1'">
            <div *ngIf="stepper.selectedIndex == 1; else normal">
              <mat-icon *ngIf="secondFormGroup.invalid && showErrors[1] ; else normal" style="position: relative; left: -3px;">warning</mat-icon>
            </div>
          </div>
          <div *ngSwitchCase="'2'">
            <div *ngIf="stepper.selectedIndex == 2; else normal">
              <mat-icon *ngIf="thirdFormGroup.invalid && showErrors[2] ; else normal" style="position: relative; left: -3px;">warning</mat-icon>
            </div>
          </div>
          <div *ngSwitchDefault>
            {{index + 1}}
          </div>
        </div>
        <ng-template #normal>{{index + 1}}</ng-template>
      </ng-template>

      <mat-step [stepControl]="firstFormGroup" [completed]="!isLinear || firstFormGroup.valid">
        <ng-template matStepLabel #testLoading>
          <div fxLayout="row">
            <div fxFlexAlign="center" class='step-header-color'>
              Select Customer
              <div class="mat-caption">
                {{firstFormGroup.value.customerLabel}}
              </div>
            </div>
          </div>
        </ng-template>

        <form [formGroup]="firstFormGroup">
          <div *ngIf='delayFinsihed'>
            <system-lookup class='stepperLookup' [isModal]="true" lookupName="customers" [data]="customersLookupData" (onSelected)="onSelectCustomer($event)"></system-lookup>
          </div>
        </form>
      </mat-step>
      <mat-step [stepControl]="secondFormGroup" [completed]="!isLinear || secondFormGroup.valid">
        <ng-template matStepLabel>
          <div fxLayout="row">
            <div fxFlexAlign="center" class='step-header-color'>
              Select {{branchContractorLabel}}
              <div class="mat-caption">
                {{secondFormGroup.value.branchLabel}}
              </div>
            </div>
          </div>
        </ng-template>
        
        <form [formGroup]="secondFormGroup" autocomplete="off">
          <div>
            <mat-tab-group class="single-tab-emphasis" [(selectedIndex)]="selectedBranchTabIndex">
              <mat-tab label="{{branchContractorLabel == 'Branch' ? 'Branches': 'Contactor'}}">
                <div style="padding: 10px;">
                  <system-lookup class='stepperLookup' [isModal]="true" (onComplete)="onBranchComplete($event)" #customerMeetingsBranches lookupName="customerMeetingsBranches" (emitDataChange)="emitBranchEvent($event)" [documentId]="customerId" (onSelected)="onSelectBranch($event)"></system-lookup>
                </div>
              </mat-tab>
              <mat-tab label="Add New {{branchContractorLabel}}">
                <div>
                  <form [formGroup]="newBranchFormGroup" fxLayout="column" autocomplete="off">
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Name" formControlName="name" required>
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Address1" formControlName="address1" required>
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Address2" formControlName="address2">
                    </mat-form-field>
                    <mat-form-field style="width: 200px;">
                      <input matInput placeholder="City" formControlName="city" required>
                    </mat-form-field>
                    <mat-form-field style="width: 200px;">
                      <input matInput placeholder="State" [matAutocomplete]="auto" name="cc" formControlName="state" required>
                      <mat-autocomplete #auto="matAutocomplete">
                        <mat-option *ngFor="let state of filteredStates | async" [value]="state.abbreviation">
                          <span>{{state.name}}</span>
                        </mat-option>
                      </mat-autocomplete>
                    </mat-form-field>
                    <mat-form-field style="width: 100px;">
                      <input matInput placeholder="Zip Code" formControlName="zipCode" required>
                    </mat-form-field>
                  </form>
                  <div>
                    <button mat-button mat-raised-button (click)="saveNewBranch()" color="primary">Save</button>
                  </div>
                </div>

              </mat-tab>
              <mat-tab label="Edit {{branchContractorLabel}}" *ngIf="hasEditBranchTab">
                <div style="padding: 10px;">
                  <form [formGroup]="editBranchFormGroup" fxLayout="column" autocomplete="off">
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Name" formControlName="name" required>
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Address1" formControlName="address1" required>
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Address2" formControlName="address2">
                    </mat-form-field>
                    <mat-form-field style="width: 200px;">
                      <input matInput placeholder="City" formControlName="city" required>
                    </mat-form-field>
                    <mat-form-field style="width: 200px;">
                      <input matInput placeholder="State" [matAutocomplete]="auto" name="cc" formControlName="state">
                      <mat-autocomplete #auto="matAutocomplete">
                        <mat-option *ngFor="let state of filteredStates | async" [value]="state.abbreviation">
                          <span>{{state.name}}</span>
                        </mat-option>
                      </mat-autocomplete>
                    </mat-form-field>
                    <mat-form-field style="width: 100px;">
                      <input matInput placeholder="Zip Code" formControlName="zipCode" required>
                    </mat-form-field>
                    <mat-form-field style="width: 300px;" *ngIf='!branchEdit.isPending'>
                      <textarea matInput formControlName="notes" placeholder="Notes"></textarea>
                    </mat-form-field>
                  </form>
                  <div>
                    <button *ngIf='!branchEdit.isPending' mat-button mat-raised-button (click)="proposeBranchEdit()" color="primary">Propose Update</button>
                    <button *ngIf='branchEdit.isPending' mat-button mat-raised-button (click)="updatePendingBranch()" color="primary">Update</button>
                  </div>

                </div>
              </mat-tab>
            </mat-tab-group>
          </div>
        </form>
      </mat-step>
      <mat-step [stepControl]="thirdFormGroup" [completed]="(!isLinear || thirdFormGroup.valid) && (stepTouched.thirdForm || thirdFormGroup.value.contact != '')">
        <ng-template matStepLabel>
          <div fxLayout="row">
            <div fxFlexAlign="center" class='step-header-color'>
              Select Contact
              <div class="mat-caption">
                {{thirdFormGroup.value.contact}}
              </div>
            </div>
          </div>
        </ng-template>
        <form [formGroup]="thirdFormGroup">
          <div>
            <mat-tab-group class="single-tab-emphasis" [(selectedIndex)]="selectedContactTabIndex">
              <mat-tab *ngIf="branchContractorLabel == 'Branch'" label="Customer Contacts">
                <div class="p-10" *ngIf="secondFormGroup.value._id">
                  <system-lookup class='stepperLookup' 
                      [isModal]="true" 
                      #customerContacts 
                      lookupName="customerContacts" 
                      (emitDataChange)="emitContactEvent($event)" 
                      (onComplete)="onContactComplete($event)" 
                      [documentId]="customerId" 
                      (onSelected)="onSelectContact($event)"></system-lookup>
                </div>
              </mat-tab>
              <mat-tab label="{{branchContractorLabel}} Contacts">
                <div class="p-10" *ngIf="secondFormGroup.value._id">
                  <system-lookup class='stepperLookup' 
                      #customerBranchContacts 
                      [isModal]="true" 
                      [documentId]="customerId" 
                      (emitDataChange)="emitContactEvent($event)" 
                      [data]="{branchId: secondFormGroup.value._id}" 
                      lookupName="customerBranchContacts" 
                      (onComplete)="onBranchContactComplete($event)" 
                      (onSelected)="onSelectContact($event)"></system-lookup>
                </div>
              </mat-tab>
              <mat-tab label="Add New Contact">
                <div>
                  <form [formGroup]="newContactFormGroup" fxLayout="column wrap" fxLayoutGap="10px">
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Name" formControlName="name" required>
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Title" formControlName="title">
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Address1" formControlName="address1">
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Address2" formControlName="address2">
                    </mat-form-field>
                    <mat-form-field style="width: 200px;">
                      <input matInput placeholder="City" formControlName="city">
                    </mat-form-field>
                    <mat-form-field style="width: 200px;">
                      <input matInput placeholder="State" aria-label="State" [matAutocomplete]="auto1" formControlName="state">
                      <mat-autocomplete #auto1="matAutocomplete">
                        <mat-option *ngFor="let state of filteredContactStates | async" [value]="state.abbreviation">
                          <span>{{state.name}}</span>
                        </mat-option>
                      </mat-autocomplete>
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Zip Code" formControlName="zipCode">
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Email" type="email" formControlName="email" required>
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Phone" formControlName="phone" required>
                    </mat-form-field>
                  </form>
                  <div>
                    <button mat-button mat-raised-button color="primary" (click)="saveNewContact()">Save</button>
                  </div>

                </div>
              </mat-tab>
              <mat-tab label="Edit Contact" *ngIf="hasEditContactTab">
                <div>
                  <form [formGroup]="editContactFormGroup" fxLayout="column wrap" fxLayoutGap="10px">
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Name" formControlName="name" required>
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Title" formControlName="title">
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Address1" formControlName="address1">
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Address2" formControlName="address2">
                    </mat-form-field>
                    <mat-form-field style="width: 200px;">
                      <input matInput placeholder="City" formControlName="city">
                    </mat-form-field>
                    <mat-form-field style="width: 200px;">
                      <input matInput placeholder="State" aria-label="State" [matAutocomplete]="auto1" formControlName="state">
                      <mat-autocomplete #auto1="matAutocomplete">
                        <mat-option *ngFor="let state of filteredContactStates | async" [value]="state.abbreviation">
                          <span>{{state.name}}</span>
                        </mat-option>
                      </mat-autocomplete>
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Zip Code" formControlName="zipCode">
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Email" type="email" formControlName="email" required>
                    </mat-form-field>
                    <mat-form-field style="width: 300px;">
                      <input matInput placeholder="Phone" formControlName="phone" required>
                    </mat-form-field>
                    <mat-form-field style="width: 300px;" *ngIf='!contactEdit.isPending'>
                      <textarea matInput formControlName="notes" placeholder="Notes"></textarea>
                    </mat-form-field>
                  </form>
                  <div>
                    <button *ngIf='!contactEdit.isPending' mat-button mat-raised-button (click)="proposeContactEdit()" color="primary">Propose Update</button>
                    <button *ngIf='contactEdit.isPending' mat-button mat-raised-button color="primary" (click)="updatePendingContact()">Update</button>
                  </div>

                </div>
              </mat-tab>
            </mat-tab-group>

          </div>
        </form>
      </mat-step>
      <mat-step [stepControl]="forthFormGroup" [completed]="!isLinear || forthFormGroup.valid">
          <ng-template matStepLabel>
            <div fxLayout="row">
              <div fxFlexAlign="center" class='step-header-color'>
                Select Date
              </div>
              <!--<div fxFlexAlign="center" fxFlexOffset="10px">-->
              <!--<i class="material-icons" style="color: #50d250">-->
              <!--check_circle_outline-->
              <!--</i>-->
              <!--</div>-->
            </div>
          </ng-template>

        <form [formGroup]="forthFormGroup" style="min-height: 500px;">
          <div fxLayout="row">
            <mat-form-field fxFlex fxFlex.gt-sm="25%">
              <input matInput
                     #dateFromDp="dpDayPicker"
                     name="dateTime"
                     formControlName="dateTime"
                     (close)="closeDateTime()"
                     [dpDayPicker]="dateTimeConfig"
                     theme="dp-material"
                     mode="daytime"
                     attachTo=".mat-form-field-infix"
                     placeholder="Start Date/Time"
                     required>
            </mat-form-field>
            <mat-form-field fxFlex fxFlexOffset="10px" fxFlex.gt-sm="25%">
              <input matInput
                     #dateToDp="dpDayPicker"
                     name="endDateTime"
                     (close)="closeEndDateTime()"
                     formControlName="endDateTime"
                     [dpDayPicker]="dateTimeConfig"
                     theme="dp-material"
                     mode="daytime"
                     attachTo=".mat-form-field-infix"
                     placeholder="End Date/Time"
                     required>
            </mat-form-field>
          </div>
          <div>
            <div *ngIf="isEditing">
              <button mat-button (click)="finishEdit()">Finish Edit</button>
            </div>
            <div *ngIf="!isEditing" fxLayout="row" fxLayoutGap="5px">
              <button mat-button mat-raised-button matStepperPrevious color="background">Back</button>
              <button mat-button mat-raised-button color="primary" (click)="finishDate()">Next</button>  
            </div>
          </div>
        </form>
      </mat-step>
      <mat-step>
        <ng-template matStepLabel class='step-header-color'>Done</ng-template>
        <customers-meetings-form #meetingForm [newMeeting]="summary" (eventEmitter)="eventEmit($event)"></customers-meetings-form>
        <br>
        <div fxLayout="row" fxLayoutGap="5px" *ngIf="!_customerService.customerMeeting._id">
          <button mat-button mat-raised-button matStepperPrevious color="foreground">Back</button>
          <button mat-button mat-raised-button (click)="reset()" color="warn">Reset</button>
        </div>
      </mat-step>
    </mat-horizontal-stepper>
  `,
  providers: [CustomersService]
})

export class MeetingsCreateStepsComponent implements OnInit, OnDestroy {

  @ViewChild('stepper') stepper;
  @ViewChild('customerMeetingsBranches') customerMeetingsBranches;
  @ViewChild('customerBranchContacts') customerBranchContacts;
  @ViewChild('customerContacts') customerContacts;
  @ViewChild('meetingForm') meetingForm;
  @ViewChild('testLoading') testLoading;
  @Input() meeting: any;

  eventSubscriber: Subscriber<any>;
  constructor(private router: Router,
              private route: ActivatedRoute,
              public dialog: MatDialog,
              private systemOptionsService: SystemOptionsService,
              private printService: PrintService,
              private _formBuilder: FormBuilder,
              private _service: NotificationsService,
              public _customerService: CustomersService,
              private _userService: UserService,
              private _logService: SystemLogsService,
              // private dateAdapter: DateAdapter<Date>
  ) {
    this.filteredStates = this.newBranchFormGroup.controls['state'].valueChanges
      .pipe(
        startWith(''),
        map(state => state ? this._filterStates(state) : this.states.slice())
      );

    this.filteredContactStates = this.newContactFormGroup.controls['state'].valueChanges
      .pipe(
        startWith(''),
        map(state => state ? this._filterStates(state) : this.states.slice())
      );

  }

  isNewMeeting: boolean = false;
  hasEditBranchTab: boolean = false;
  hasEditContactTab: boolean = false;
  branchEdit: any = {};
  contactEdit: any = {};
  selectedBranchTabIndex = 0;
  selectedContactTabIndex = 0;

  dateTimeConfig = <IDayCalendarConfig>{
    locale: moment.locale(),
    disableKeypress: true,
    drops: 'down',
    firstDayOfWeek: "su",
    format: "DD MMM YYYY hh:mm A",
    dayBtnFormat: "D",
    minutesInterval: 15,
  };
  states = STATES.states;
  filteredStates: Observable<STATES.State[]>;
  filteredContactStates: Observable<STATES.State[]>;
  customersLookupData:any = {};

  meetingId: string;
  isContactFormShown = false;
  showErrors = [false, false, false];
  isShown = false;
  isEditing = false;
  isLinear = true;
  customerId: string;
  branchId: string;
  branchContractorLabel: string = 'Branch';
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  thirdFormGroup: FormGroup;
  forthFormGroup: FormGroup;
  newBranchFormGroup: FormGroup = this._formBuilder.group({
    name: ["", Validators.required],
    address1: ["", Validators.required],
    address2: [""],
    city: ["", Validators.required],
    state: ["", Validators.required],
    zipCode: ["", Validators.required]
  });
  editBranchFormGroup: FormGroup = this._formBuilder.group({
    _id: [""],
    name: ["", Validators.required],
    address1: ["", Validators.required],
    address2: [""],
    city: ["", Validators.required],
    state: ["", Validators.required],
    zipCode: ["", Validators.required],
    notes: [""]
  });
  newContactFormGroup: FormGroup = this._formBuilder.group({
    name: ["", Validators.required],
    title: ["", Validators],
    address1: ["", Validators],
    address2: [""],
    city: [""],
    state: [""],
    zipCode: [""],
    email: ["", Validators.required],
    phone: ["", Validators.required]
  });
  editContactFormGroup: FormGroup = this._formBuilder.group({
    _id: [""],
    name: ["", Validators.required],
    title: [""],
    address1: [""],
    address2: [""],
    city: [""],
    state: [""],
    zipCode: [""],
    email: ["", Validators.required],
    phone: ["", Validators.required],
    notes: [""]
  });
  summary: any = {
    description: '',
    customerName: "",
    branch: "",
    dateTime: "",
    endDateTime: "",
    status: "Pending"
  };
  stepTouched: any = {
    thirdForm: false
  };
  delayFinsihed: boolean = false;

  private _filterStates(value: string): STATES.State[] {
    const filterValue = value.toLowerCase();

    return this.states.filter(state => state.name.toLowerCase().indexOf(filterValue) === 0);
  }

  ngAfterViewInit() {
    let elements:any = document.getElementsByClassName('mat-step-header');
    fromEvent(elements[0], 'click')
      .subscribe(e => {
        this.showErrors = [false, false, false, false, false];
        this.router.navigate([], {queryParams: {stepperIndex: this.stepper.selectedIndex}}).catch(error=>console.log(error));
      });
    fromEvent(elements[1], 'click')
      .subscribe(e => {
        this.checkStepValid(1);
      });
    fromEvent(elements[2], 'click')
      .subscribe(e => {
        this.checkStepValid(2)
      });
    fromEvent(elements[3], 'click')
      .subscribe(e => {
        this.checkStepValid(3)
      });
    fromEvent(elements[4], 'click')
      .subscribe(e => {
        this.checkStepValid(4)
      });

    this.route.params
      .pipe(
        switchMap((params) => {
          if ('meetingId' in params) {
            let query = {
              _id: params.meetingId
            };
            this.meetingId = params.meetingId;
            return MeteorObservable.call('findOne', 'customerMeetings', query)
          } else {
            return of(null);
          }
        }),
        switchMap((res:any) => {
          if (res) {
            this.isLinear = false;
            setTimeout(() => {
              this.isEditing = true;
            });
            Object.keys(res).forEach(key => {
              this._customerService.customerMeeting[key] = res[key];
            });
            this.router.navigate([], {queryParams: {stepperIndex: 4}, queryParamsHandling: 'merge'});

            return MeteorObservable.call('findOne', 'customers', {_id: this._customerService.customerMeeting.customerId})
          } else {
            this.router.navigate([], {queryParams: {stepperIndex: 0}});
            return of(null);
          }
        }),
        map(customer => {
          if (customer) {
            let branches = customer.branches;
            if (customer.pendingBranches){
              branches = [...customer.branches, ...customer.pendingBranches]
            }
            if ('branchId' in this._customerService.customerMeeting || 'branchShipTo' in this._customerService.customerMeeting) {
              let findBranch = branches.find(_branch => _branch._id == this._customerService.customerMeeting.branchId);
              if (!findBranch) {
                if (branches && branches.length > 0) {
                  findBranch = branches[0];
                } else {
                  findBranch = {
                    _id: "noBranch"
                  }
                }
              }

              if (this._customerService.customerMeeting.customerName) {
                this._customerService.customerMeeting.customerName = customer.name;
                this.firstFormGroup.controls['customerLabel'].setValue(customer.name);
                this.customerId = this._customerService.customerMeeting.customerId;
              }

              if (this._customerService.customerMeeting.branch) {
                this._customerService.customerMeeting.branch = findBranch.name + ', ' + findBranch.address1 + ', ' + findBranch.city + ', ' + findBranch.state + ', ' + findBranch.zipCode;
                this.secondFormGroup.controls['branchLabel'].setValue(findBranch.name + ', ' + findBranch.address1 + ', ' + findBranch.city + ', ' + findBranch.state + ', ' + findBranch.zipCode);
                this.secondFormGroup.controls['_id'].setValue(findBranch._id);
              }

              if ('contact' in this._customerService.customerMeeting) {
                this.thirdFormGroup.controls['contact'].setValue(this._customerService.customerMeeting.contact);
              }
              let dateTime = moment(new Date(this._customerService.customerMeeting.dateTime)).format(this.dateTimeConfig.format);
              let endDateTime = moment(new Date(this._customerService.customerMeeting.endDateTime)).format(this.dateTimeConfig.format);

              this.forthFormGroup.controls['dateTime'].setValue(dateTime);
              this.forthFormGroup.controls['endDateTime'].setValue(endDateTime);
              this.summary = {
                dateTime,
                endDateTime,
                branch: this._customerService.customerMeeting.branch,
                customerName: this._customerService.customerMeeting.customerName
              };

              setTimeout(() => {
                // this.stepper.selectedIndex = 4;
              }, 200);
            }
          } else {

          }
          return customer;
        })

      )
      .subscribe()
  }

  checkStepValid(clickedIndex) {

    this.showErrors = [false, false, false, false, false];
    if (this.firstFormGroup.invalid) {
      this.showErrors[this.stepper.selectedIndex] = true;
      this._service.error(
        "Error",
        "The customer is required"
      )
    } else if (this.secondFormGroup.invalid) {

      if (clickedIndex > this.stepper.selectedIndex) {
        this.showErrors[this.stepper.selectedIndex] = true;
        this._service.error(
          "Error",
          "The branch is required"
        )
      } else {
        this.router.navigate([], {queryParams: {stepperIndex: clickedIndex}, queryParamsHandling: 'merge'}).catch(error=>console.log(error));
      }
    } else if (this.thirdFormGroup.invalid) {

      if (clickedIndex > this.stepper.selectedIndex) {
        this.showErrors[this.stepper.selectedIndex] = true;
        this._service.error(
          "Error",
          "The contact is required"
        )
      } else {
        this.router.navigate([], {queryParams: {stepperIndex: clickedIndex}, queryParamsHandling: 'merge'}).catch(error=>console.log(error));
      }
    } else {
      this.router.navigate([], {queryParams: {stepperIndex: clickedIndex}, queryParamsHandling: 'merge'}).catch(error=>console.log(error));
    }
  }

  ngOnInit() {

    this._userService.user._getManagedUsers$()
      .pipe(
        map((users:any) => users.map(_user => _user._id))
      )
      .subscribe(res => {
        this.customersLookupData = {
          manageUserIds: res
        };
      })

    let buttons;
    let newMeeting = new CustomerMeeting();

    this.route.queryParams.subscribe(queryParams => {
      if ('stepperIndex' in queryParams) {
        this.stepper.selectedIndex = Number(queryParams.stepperIndex);
        this.setFormTouched();
        let stepIndex = queryParams.stepperIndex;
        if (stepIndex == 0) {
            buttons = [
              {
                "title": "Next",
                "eventName": "next"
              },
            ]
        } else if (stepIndex == 4) {
            buttons = [
              {
                "title": "Add",
                "eventName": "addMeeting"
              },
            ]
        } else {
          buttons = [
            {
              "title": "Next",
              "eventName": "next"
            },
            {
              "title": "Back",
              "eventName": "back"
            },
          ]
        }
        EventEmitterService.Events.emit({ buttons: buttons, });
      }
    });

    this.firstFormGroup = this._formBuilder.group({
      customerLabel: ['', Validators.required]
    });

    this.secondFormGroup = this._formBuilder.group({
      _id: ["", Validators.required],
      name: [""],
      branchLabel: ['', Validators.required]
    });
    this.thirdFormGroup = this._formBuilder.group({
      name: ["", ...(this.isEditing ? [Validators.required] : [])],
      address: [""],
      contact: ['']
    })
    this.forthFormGroup = this._formBuilder.group({
      dateTime: ['', Validators.required],
      endDateTime: ['', Validators.required]
    });

    this.route.queryParams
    // .pipe(
    //   switchMap((queryParams) => {
    //     if (queryParams && 'customerId' in queryParams) {
    //       if (this.firstFormGroup.invalid) {
    //         return MeteorObservable.call('findOne', 'customers', {_id: queryParams.customerId});
    //       } else {
    //         return of({});
    //       }
    //     } else {
    //       return of({});
    //     }
    //   })
    // )
      .subscribe((queryParams:any) => {
        if ('stepperIndex' in queryParams) {
          setTimeout(() => {
            this.stepper.selectedIndex = Number(queryParams.stepperIndex);
          }, 100);
          if (!this.route.params['value']['meetingId']) {
            if (queryParams.stepperIndex == 0) {
              buttons = [
                {
                  "title": "Next",
                  "eventName": "next"
                },
              ]
            } else if (queryParams.stepperIndex == 4) {
              buttons = [
                {
                  "title": "Add Meeting",
                  "eventName": "addMeeting"
                },
              ]
            } else {
              if (queryParams.stepperIndex == 3){
                this.forthFormGroup.controls['dateTime'].setValue(moment(newMeeting.dateTime).format(dateTimeFormat));
                this.forthFormGroup.controls['endDateTime'].setValue(moment(newMeeting.endDateTime).format(dateTimeFormat));
                this.closeDateTime();
              }
              buttons = [
                {
                  "title": "Next",
                  "eventName": "next"
                },
                {
                  "title": "Back",
                  "eventName": "back"
                },
              ]
            }
          } else {
            if (queryParams.stepperIndex == 4) {
              buttons = [
                {
                  "title": "Delete Meeting",
                  "eventName": "delete"
                },
              ]
            }
          }
          EventEmitterService.Events.emit({ name: "loadPageheaderButtons",  value: buttons});
        }
      });
    // csummary = Object.assign(cloneDeep(this.summary), {dateTime: newMeeting.dateTime, endDateTime: newMeeting.endDateTime});
    this.hookEvents();
    setTimeout(() => { this.delayFinsihed = true; }, 10)
  }

  onClick() {
  }

  setFormTouched(){
    switch (this.stepper.selectedIndex) {
      case 2:
        if (!this.isEditing) {
          this.stepTouched.thirdForm = true;
        }
        break;
      default:
        break;
    }
  }

  onSelectCustomer(e) {
    this.customerId = e.value._id;
    this._customerService.customerMeeting.customerId = this.customerId;
    this.firstFormGroup.controls['customerLabel'].setValue(e.value.name);
    let index = 1;
    if (this.isEditing) {
      index = 4;
    }

    this._customerService.customerMeeting = new CustomerMeeting();
    this._customerService.customerMeeting.customerName = e.value.name;
    this._customerService.customerMeeting.customerId = e.value._id;

    this.branchContractorLabel = this.customerId == 'ZcdoQHMJjEmGeEZQK' ? 'Contractor' : 'Branch';
    let hideColumns, contractorObj = {};
    if (this.customerId == 'ZcdoQHMJjEmGeEZQK' && index == 1) {
      contractorObj = {
        hideColumns: ['shipTo'],
        sort: "name.1"
      }
    } 
    
    if (!this.isNewMeeting) {
      // not a new meeting, update the contact
      this.meetingForm.onBlurMethod('customerName', e.value.name);
      this.meetingForm.onBlurMethod('customerId', e.value._id);
      this.meetingForm.onBlurMethod('branch', "");
      this.meetingForm.onBlurMethod('contact', "");
      this.secondFormGroup.controls['branchLabel'].setValue('');
      this.secondFormGroup.controls['_id'].setValue('');
      this.thirdFormGroup.controls['contact'].setValue('');
      this.summary = Object.assign(cloneDeep(this.summary), {customerName: e.value.name, customerId: e.value._id, branch: "", contact: ""});
    } else {
      this.summary = Object.assign(cloneDeep(this.summary), {customerName: e.value.name, customerId: e.value._id});
    }

    // this.router.navigate([], { queryParams: { stepperIndex: index }, queryParamsHandling: 'merge'});
    this.router.navigate([], { queryParams: Object.assign({ stepperIndex: index}, contractorObj), queryParamsHandling: 'merge'});
  }

  onSelectBranch(e) {

    // do something with second form
    this.branchId = e.value._id;
    this.secondFormGroup.controls['name'].setValue(e.value.name);
    this.secondFormGroup.controls['_id'].setValue(e.value._id);
    let branchLabel = `${e.value.name}, ${e.value.address1}, ${e.value.city}, ${e.value.state}, ${e.value.zipCode}`;
    this.secondFormGroup.controls['branchLabel'].setValue(branchLabel);

    // do something with third form
    this.thirdFormGroup.reset();

    this._customerService.customerMeeting.branch = branchLabel;
    this._customerService.customerMeeting.contact = "";
    this.summary = Object.assign(cloneDeep(this.summary), {branchShipTo: e.value.shipTo, branch: branchLabel, contact: "", branchId: e.value._id});

    if (!this.isNewMeeting) {
      // not a new meeting, update the contact
      this.meetingForm.onBlurMethod('branch', branchLabel);
      this.meetingForm.onBlurMethod('branchId', this.branchId);
    } else {

    }
    let index = 2;
    if (this.isEditing) {
      index = 4;
    }
    this.router.navigate([], {queryParams: {stepperIndex: index}, queryParamsHandling: 'merge'});
  }

  onSelectContact(e) {
    this.thirdFormGroup.controls['name'].setValue(e.value.name);
    this.thirdFormGroup.controls['address'].setValue(`${e.value.address1}, ${e.value.city}, ${e.value.state}, ${e.value.zipCode}`);
    let contact = e.value.name + ", " + e.value.email + ", " + e.value.phone;
    this.thirdFormGroup.controls['contact'].setValue(contact);

    this.summary = Object.assign(cloneDeep(this.summary), { contact, contactId: e.value._id });

    if (!this.isNewMeeting) {
      // not a new meeting, update the contact
      this.meetingForm.onBlurMethod('contact', contact);
      this.meetingForm.onBlurMethod('contactId', e.value._id);
    } else {

    }
    let index = 3;
    if (this.isEditing) {
      index = 4;
    }
    this.router.navigate([], {queryParams: {stepperIndex: index}, queryParamsHandling: 'merge'});
  }

  eventEmit(e) {
    if (e.name == 'goToStepper') {
      this.stepper.selectedIndex = e.value;
      this.isEditing = true;
    }
  }

  finishEdit() {
    this.stepper.selectedIndex = 4;
    this.updateStepperParam('next')
    // this.isEditing = false;
  }

  next() {
    this.stepper.next();
    this.updateStepperParam('next')
  }

  back() {
    this.stepper.previous();
    this.updateStepperParam('back')
  }

  updateStepperParam(nextOrBack) {
    this.router.navigate([], { queryParams: { stepperIndex: this.stepper.selectedIndex }, queryParamsHandling: 'merge' });
  }

  reset() {
    this.stepper.reset();
    this._customerService.customerMeeting = new CustomerMeeting();
    this.isEditing = false;
    let newMeeting = new CustomerMeeting();

    this.forthFormGroup = this._formBuilder.group({
      dateTime: [newMeeting.dateTime, Validators.required],
      endDateTime: [newMeeting.endDateTime, Validators.required]
    });
    this._customerService.customerMeeting.dateTime = newMeeting.dateTime;
    this._customerService.customerMeeting.endDateTime = newMeeting.endDateTime;

    this.router.navigate([], {queryParamsHandling: 'merge', queryParams: {stepperIndex: 0}});
  }

  closeDateTime() {
    let dateTime = moment(new Date(this.forthFormGroup.value.dateTime)).format(this.dateTimeConfig.format);
    let endDateTime = moment(new Date(this.forthFormGroup.value.dateTime)).add(1, 'hours').format(this.dateTimeConfig.format);
    this.forthFormGroup.controls['endDateTime'].setValue(endDateTime);
    this.summary = Object.assign(cloneDeep(this.summary), {dateTime: dateTime, endDateTime: endDateTime})
    if (!this.isNewMeeting) {
      this.meetingForm.onBlurMethod('dateTime', new Date(this.forthFormGroup.value.dateTime));
      this.meetingForm.onBlurMethod('endDateTime', new Date(endDateTime));
    } 
  }

  closeEndDateTime() {
    let endDateTime = moment(new Date(this.forthFormGroup.value.endDateTime)).format(this.dateTimeConfig.format);
    this.summary = Object.assign(cloneDeep(this.summary), {endDateTime: endDateTime});
    if (!this.isNewMeeting) {
      this.meetingForm.onBlurMethod('endDateTime', new Date(this.forthFormGroup.value.endDateTime));
    } 
  }

  animationDone() {
    // this.route.queryParams.pipe(
    //   take(1)
    // ).subscribe(res => {
    //   setTimeout(() => {
    //     if ('stepperIndex' in res) {
    //       this.stepper.selectedIndex = Number(res.stepperIndex);
    //       console.log('asdfasdf', res, this.stepper.selectedIndex);
    //     }
    //   }, 100);
    //
    // })
    // this.router.navigate([], {queryParams: {stepperIndex: this.stepper.selectedIndex}, queryParamsHandling: 'merge'}).catch(error=>console.log(error));
  }

  saveNewBranch() {
    if (this.newBranchFormGroup.valid) {
      let newBranch = this.newBranchFormGroup.value;
      newBranch._id = Random.id();
      newBranch.createdUserId = Meteor.userId();
      newBranch.createdAt = new Date();
      let update:any = {
        $addToSet: {
          pendingBranches: newBranch
        }
      };

      MeteorObservable.call('findOne', 'customers', {_id: this.customerId})
        .pipe(
          switchMap((customer:any) => {
            if (customer.pendingBranches == null || !('pendingBranches' in customer)) {
              update = {
                $set: {
                  pendingBranches: [newBranch]
                }
              }
            }
            return MeteorObservable.call('update', 'customers', {_id: this.customerId}, update)
          }),
          switchMap((res) =>{
            if (res) {
              return MeteorObservable.call('update', 'customerPendingData', {_id: this.customerId}, update);
            } else {
              return of(null);
            }
          }),
          switchMap((res) => {
            if (res) {
              let action = {
                collectionName: "customers",
                type: "UPDATE.INSERT",
                documentId: this.customerId,
                fieldPath: `pendingBranches_array`,
                createdAt: new Date(),
                url: window.location.pathname,
                log: `insert new branch ${newBranch._id} to customer ${this.customerId}`
              };

              return this._logService._log$(action);
            } else
              return of(null);
          })
        )
        .subscribe(res => {
          console.log("new branch");
          if (typeof res == 'string') {
            this.customerMeetingsBranches.reloadData('');
            this.newBranchFormGroup.reset();
            this.isShown = false;
            this.onSelectBranch({name: "", value: newBranch});
          }
        })
    } else {
    }
  }

  finishDate() {
    let dateTime = moment(new Date(this.forthFormGroup.value.dateTime)).format(this.dateTimeConfig.format);
    let endDateTime = moment(new Date(this.forthFormGroup.value.endDateTime)).format(this.dateTimeConfig.format);
    this.forthFormGroup.controls['endDateTime'].setValue(endDateTime);
    this.summary = Object.assign(cloneDeep(this.summary), {dateTime, endDateTime});
    this.router.navigate([], {queryParams: {stepperIndex: 4}, queryParamsHandling: 'merge'});

  }

  saveNewContact() {
    if (this.newContactFormGroup.valid) {
      let newContact = this.newContactFormGroup.value;
      newContact._id = Random.id();
      newContact.branchId = this.secondFormGroup.value._id;
      newContact.createdUserId = Meteor.userId();
      newContact.createdAt = new Date();
      let update:any = {
        $addToSet: {
          pendingContacts: newContact
        }
      };

      MeteorObservable.call('findOne', 'customers', {_id: this.customerId})
        .pipe(
          switchMap((customer:any) => {
            if (customer.pendingContacts == null || !('pendingContacts' in customer)) {
              update = {
                $set: {
                  pendingContacts: [newContact]
                }
              }
            }
            return MeteorObservable.call('update', 'customers', {_id: this.customerId}, update)
          }),
          switchMap((res) =>{
            if (res) {
              return MeteorObservable.call('update', 'customerPendingData', {_id: this.customerId}, update);
            } else {
              return of(null);
            }
          }),
          switchMap((res) => {
            if (res) {
              let action = {
                collectionName: "customers",
                type: "UPDATE.INSERT",
                documentId: this.customerId,
                fieldPath: `pendingContacts_array`,
                createdAt: new Date(),
                url: window.location.pathname,
                log: `insert new contact ${newContact._id} to customer ${this.customerId}`
              };
              return this._logService._log$(action);
            } else
              return of(null);
          })
        )
        .subscribe(res => {
          if (typeof res == 'string') {
            if (this.customerContacts){
              this.customerContacts.reloadData('');
            }
            this.customerBranchContacts.reloadData("");
            this.newContactFormGroup.reset();
            this.isContactFormShown = false;
            this.onSelectContact({name: "", value: newContact});
          }
        })
    }
  }

  hookEvents() {
    this.eventSubscriber = EventEmitterService.Events.subscribe(res => {
      if (res.name) {
        switch (res.name) {
          case 'next':
            if (this.stepper.selectedIndex === 3) {
              this.finishDate()
            }
            this.next();
            break;
            case 'back':
            this.back();
            break;
          default:
        }
      }
    })
  }

  emitBranchEvent(event) {
    let row = event.value.row;
    let column = event.value.column;

    switch(event.name) {
      case "actions.edit":
        this.hasEditBranchTab = true;
        this.branchEdit.isPending = 'isPendingBranch' in row ? true : false;
        this.branchEdit.controlValue = row;
        this.selectedBranchTabIndex = 2;
        this.editBranchFormGroup.patchValue(row);
        break;
      case "actions.remove":
        this.dialog
          .open(DialogSelect, {
            width: "250px"})
          .afterClosed().subscribe(result => {
          if (result) {
            if (result) {
              let query = {
                _id: this.customerId
              }
              let update = {
                $pull: {
                  "pendingBranches": {_id: row._id}
                }
              };

              MeteorObservable.call('update', 'customers', query, update)
                .pipe(
                  switchMap((res) => {
                    if (res) {
                      return MeteorObservable.call('update', 'customerPendingData', query, update);
                    } else {
                      return of(null);
                    }
                  })
                )
                .subscribe(res => {
                  if (res) {
                    this.customerMeetingsBranches.reloadData("reload");
                  }
                })
            }
          }
        });
        break;
    }
  }

  emitContactEvent(event) {
    let row = event.value.row;
    let column = event.value.column;
    switch(event.name) {
      case "actions.edit":
        this.hasEditContactTab = true;
        this.contactEdit.isPending = 'isPendingContact' in row ? true : false;
        this.contactEdit.controlValue = row;
        this.selectedContactTabIndex = 3;
        console.log(row);
        this.editContactFormGroup.patchValue(row);

        break;
      case "actions.remove":
        this.dialog
          .open(DialogSelect, {
            width: "250px"})
          .afterClosed().subscribe(result => {
          if (result) {
            if (result) {
              let query = {
                _id: this.customerId
              }
              let update = {
                $pull: {
                  "pendingContacts": {_id: row._id}
                }
              };

              MeteorObservable.call('update', 'customers', query, update)
                .pipe(
                  switchMap((res) => {
                    if (res) {
                      return MeteorObservable.call('update', 'customerPendingData', query, update);
                    } else {
                      return of(res);
                    }
                  })
                )
                .subscribe(res => {
                  if (res) {
                    this.customerContacts.reloadData("reload");
                    this.customerBranchContacts.reloadData("reload");
                  }
                })
            }
          }
        });
        break;
    }
  }

  onBranchComplete(event) {
    let dirtyRows = this.customerMeetingsBranches._getDirtyRows();
    dirtyRows.forEach(_row => {
      
      // if (_row.isPendingBranch) {
        _row.hasActionsCell = true;
      // } else {
      //   _row.hasActionsCell = false;
      // }
    })
  }

  updatePendingBranch() {
    let query = {
      _id: this.customerId,
      "pendingBranches._id": this.editBranchFormGroup.value._id
    };
    let update = {
      $set: {
        "pendingBranches.$": this.editBranchFormGroup.value
      }
    }
    MeteorObservable.call('update', 'customers', query, update)
      .pipe(
        switchMap((res) => {
          if (res) {
            return MeteorObservable.call('update', 'customerPendingData', query, update);
          }
        })
      )
      .subscribe(res => {
        if (res) {
          this.selectedBranchTabIndex = 0;
          this.customerMeetingsBranches.reloadData('Update Branch');
          this.hasEditBranchTab = false;
          this._service.success(
            'Success',
            "Update complete"
          )
        }
      })
  }

  proposeBranchEdit() {
    function formLayout(obj){
      return `
      ${obj.name}<br>
      ${obj.address1}<br>
      ${obj.address2 && obj.address2 != '' ? obj.address2 + `<br>` : ''}
      ${obj.city}<br>
      ${obj.state}<br>
      ${obj.zipCode}<br>
    `}
    let userName = this._userService.user.profile.firstName + " " + this._userService.user.profile.lastName;
    let html = `<body><h3>Proposed Changes:</h3>`;
    html += `Current: <br>`;
    html += formLayout(this.branchEdit.controlValue) + `<br>`;
    html += `Proposed: <br>`;
    html += formLayout(this.editBranchFormGroup.value) + `<br>`;
    html += this.editBranchFormGroup.value.notes && this.editBranchFormGroup.value.notes != '' ? `Notes: ` + this.editBranchFormGroup.value.notes + `</body>` : `</body>`;
    
    let emailData = {};
    emailData['to'] = 'support@globalthesource.com';
    emailData['from'] = 'Proposed Branch Changes <noreply@globalthesource.com>';
    emailData['subject'] = userName + ' proposes to edit Ship To Code ' + this.branchEdit.controlValue.shipTo + ' for Customer ' + this._customerService.customerMeeting.customerName;
    emailData['html'] = html;
    
    MeteorObservable.call('sendSupportEmail', emailData).subscribe(email => {})
    this.selectedBranchTabIndex = 0;
    this.customerMeetingsBranches.reloadData('Update Branch');
    this.hasEditBranchTab = false;
    this._service.success(
      'Success',
      "Update Proposed"
    )
  }

  proposeContactEdit() {
    function formLayout(obj){
      return `
      ${obj.name}<br>
      ${obj.title && obj.title != '' ? obj.title + `<br>` : ''}
      ${obj.address1 && obj.address1 != '' ? obj.address1 + `<br>` : ''}
      ${obj.address2 && obj.address2 != '' ? obj.address2 + `<br>` : ''}
      ${obj.city && obj.city != '' ? obj.city + `<br>` : ''}
      ${obj.state && obj.state != '' ? obj.state + `<br>` : ''}
      ${obj.zipCode && obj.zipCode != '' ? obj.zipCode + `<br>` : ''}
      ${obj.phone && obj.phone != '' ? obj.phone + `<br>` : ''}
      ${obj.email && obj.email != '' ? obj.email + `<br>` : ''}
    `}

    let userName = this._userService.user.profile.firstName + " " + this._userService.user.profile.lastName;
    let html = `<body><h3>Proposed Changes:</h3>`;
    html += `Current: <br>`;
    html += formLayout(this.contactEdit.controlValue) + `<br>`;
    html += `Proposed: <br>`;
    html += formLayout(this.editContactFormGroup.value) + `<br>`;
    html += this.editContactFormGroup.value.notes && this.editContactFormGroup.value.notes != '' ? `Notes: ` + this.editContactFormGroup.value.notes + `</body>` : `</body>`;
    let emailData = {};
    emailData['to'] = 'support@globalthesource.com';
    emailData['from'] = 'Proposed Contact Changes <noreply@globalthesource.com>';
    emailData['subject'] = userName + ' proposes to edit contact ' + 'for Customer ' + this._customerService.customerMeeting.customerName;
    emailData['html'] = html;
    
    MeteorObservable.call('sendSupportEmail', emailData).subscribe(email => {})
    this.selectedContactTabIndex = 0;
    this.customerContacts.reloadData('Update Contact');
    this.hasEditBranchTab = false;
    this._service.success(
      'Success',
      "Update Proposed"
    )
  }

  updatePendingContact() {
    let query = {
      _id: this.customerId,
      "pendingContacts._id": this.editContactFormGroup.value._id
    };
    let update = {
      $set: {
        "pendingContacts.$": this.editContactFormGroup.value
      }
    };
    MeteorObservable.call('update', 'customers', query, update)
      .pipe(
        switchMap(res => {
          if (res) {
            return MeteorObservable.call('update', 'customerPendingData', query, update);
          }
        })
      )
      .subscribe(res => {
        if (res) {
          this.selectedContactTabIndex = 0;
          this.customerContacts.reloadData('Update Contact');
          this.hasEditContactTab = false;
          this._service.success(
            'Success',
            "Update complete"
          )
        }
      })
  }

  onContactComplete(event) {
    let dirtyRows = this.customerContacts._getDirtyRows();
    dirtyRows.forEach(_row => {
      // if (_row.isPendingContact) {
        _row.hasActionsCell = true;
      // } else {
      //   _row.hasActionsCell = false;
      // }
    })
  }

  onBranchContactComplete(event) {
    let dirtyRows = this.customerBranchContacts._getDirtyRows();
    dirtyRows.forEach(_row => {
      // if (_row.isPendingContact == true) {
        _row.hasActionsCell = true;
      // } else {
        // _row.hasActionsCell = false;
      // }
    })
    if(dirtyRows.length == 0){
      this.selectedContactTabIndex = 2;
    }
  }

  ngOnDestroy() {
    this.eventSubscriber.unsubscribe();
  }
}