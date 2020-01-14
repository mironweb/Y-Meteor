import {Component, Input, OnInit, Output, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import { Router } from '@angular/router';
import Methods from "../../../../../both/config/filterMethods";
import moment = require("moment");
import {UserFilter} from "../../../../../both/models/userFilter.model";
import {UserFilterService} from "./filter.service";
import * as cloneDeep from 'clone-deep';

@Component({
  selector: 'filter-condition',
  template: `
    <div>
      <div fxLayout="row" class="pt-10">
        <div fxFlex="150px" fxFlexOffset="20px">
          <mat-form-field style="width: 150px">
            <mat-select placeholder="Select Column" [(ngModel)]="condition.column" name="column" (click)="onClick()" (selectionChange)="onColumnChange()">
              <mat-option *ngFor="let column of filteredColumns" [value]="column.prop">
                {{ column.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div fxFlex="150px" fxFlexOffset="20px">
          <mat-form-field style="width: 150px">
            <mat-select placeholder="Select Method" [(ngModel)]="condition.method" name="methods" (selectionChange)="onMethodChange()">
              <mat-option *ngFor="let method of condition.methods" [value]="method.prop">
                {{ method.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
  
        <div fxFlex="none" *ngIf="condition.method === '$or'" fxFlexOffset="20px">
          <div *ngIf="condition.type === 'string' || condition.type === 'number'">
            <mat-form-field>
              <input #focusInput matInput placeholder="Type Criteria" #criteria (keyup.enter)="addValueToCondition(criteria.value)">
            </mat-form-field>
            <button mat-raised-button (click)="addValueToCondition(criteria.value)">Add</button>
          </div>
          <div *ngIf="condition.type === 'number'">
            <mat-form-field>
              <input #focusInput matInput placeholder="Type Criteria" #criteria (keyup.enter)="addValueToCondition(criteria.value)">
            </mat-form-field>
            <button mat-raised-button (click)="addValueToCondition(criteria.value)">Add</button>
          </div>
          <div *ngIf="condition.type === 'date'">
            <mat-form-field>
              <input #focusInput matInput [matDatepicker]="orPicker" [(ngModel)]="orDateValue" (dateChange)="addValueToCondition($event.value)" placeholder="Pick a date">
              <mat-datepicker-toggle matSuffix [for]="orPicker"></mat-datepicker-toggle>
              <mat-datepicker #orPicker></mat-datepicker>
            </mat-form-field>
          </div>
        </div>
        <div fxFlex="none" fxFlexOffset="20px" *ngIf="condition.method === '$regex' || condition.method == '$not'">
          <div *ngIf="condition.type === 'string' || condition.type === 'number'">
            <mat-form-field>
              <input #focusInput matInput [(ngModel)]="condition.value" placeholder="Type Criteria" (keydown)="onKeyDown($event)">
            </mat-form-field>
          </div>
          <div *ngIf="condition.type === 'date'">
            <mat-form-field>
              <input #focusInput matInput placeholder="Type Criteria" (keydown)="onKeyDown($event)">
            </mat-form-field>
          </div>
        </div>
        <div fxFlex="none" fxFlexOffset="20px" *ngIf="condition.method === '$eq' || condition.method === '$ne'">
          <div *ngIf="condition.type === 'string' || condition.type === 'number'">
            <mat-form-field>
              <input #focusInput matInput [(ngModel)]="condition.value">
            </mat-form-field>
          </div>
          <div *ngIf="condition.type === 'date'">
            <mat-form-field>
              <input #focusInput matInput [matDatepicker]="startPicker" [(ngModel)]="condition.value"  placeholder="Pick a date">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            </mat-form-field>
            <mat-datepicker #startPicker></mat-datepicker>
          </div>
        </div>
  
        <div fxFlex="none" fxFlexOffset="20px" *ngIf="condition.method === '<>'">
          <div *ngIf="condition.type === 'date'">
            <mat-form-field>
              <!--<input #focusInput matInput [matDatepicker]="startPicker" [(ngModel)]="condition.formattedValue[0]"  placeholder="Start from" (change)="onStartDateChange($event)">-->
              <!--<mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>-->

              <input matInput #focusInput [matDatepicker]="startPicker" placeholder="Start From"
                     (dateChange)="addEvent('onStartDateChange', $event)" [value]="condition.value[0]">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>

            </mat-form-field>
            <mat-datepicker #startPicker></mat-datepicker>
            <mat-form-field>
              <input #focusInput matInput [matDatepicker]="endPicker"  [value]="condition.value[1]" placeholder="End to"
                     (dateChange)="addEvent('onEndDateChange', $event)">
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
          </div>
        </div>
        <div fxFlex="none" *ngIf="condition.method === '$gte'">
          <div *ngIf="condition.type === 'date'">
            <mat-form-field>
              <input #focusInput matInput [matDatepicker]="startPicker" [(ngModel)]="condition.value"  placeholder="Start from">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>
          </div>
          <div *ngIf="condition.type === 'number'">
            <mat-form-field>
              <input #focusInput type="number" matInput [(ngModel)]="condition.value">
            </mat-form-field>
          </div>
        </div>
        <div fxFlex="none" *ngIf="condition.method === '$lt'">
          <div *ngIf="condition.type === 'date'">
            <mat-form-field>
              <input #focusInput matInput [matDatepicker]="endPicker" [(ngModel)]="condition.value"  placeholder="Before" (dateChange)="onEarlierChange(condition.value, conditionIndex)">
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            </mat-form-field>
            <mat-datepicker #endPicker></mat-datepicker>
          </div>
          <div *ngIf="condition.type === 'number'">
            <mat-form-field>
              <input #focusInput type="number" matInput [(ngModel)]="condition.value">
            </mat-form-field>
          </div>
        </div>
        <div>
          <div fxFlex="none" fxLayoutAlign="center center" class="cursor-pointer" (click)="onRemove()">
            <mat-icon>clear</mat-icon>
          </div>
        </div>
      </div>

      <div fxLayout="row" *ngIf="condition.method === '$or' && condition.value.length > 0">
        <div *ngIf="condition.type == 'date'">
          <mat-chip-list>
            <mat-chip *ngFor="let tag of condition.value; index as i"
                      fxLayout="row wrap">
              <div fxFlex="" class="filter-name cursor-pointer">
                <span>{{tag | date: 'M/dd/yyyy'}}</span>
              </div>
              <div class="float-right filter-icon cursor-pointer" fxFlex="">
                <div fxFlex="none" class="filter-remove" (click)="removeTag(i)">
                  <mat-icon>clear</mat-icon>
                </div>
              </div>
            </mat-chip>
          </mat-chip-list>
        </div>
      </div>
      
      <div fxLayout="row" *ngIf="condition.type === 'string' && condition.method === '$or' && condition.value.length > 0">
        <mat-chip-list>
          <mat-chip *ngFor="let tag of condition.value; index as i"
                    fxLayout="row wrap">
            <div fxFlex="" class="filter-name cursor-pointer">
              <span>{{tag}}</span>
            </div>
            <div class="float-right filter-icon cursor-pointer" fxFlex="">
              <div fxFlex="none" class="filter-remove" (click)="removeTag(i)">
                <mat-icon>clear</mat-icon>
              </div>
            </div>
          </mat-chip>
        </mat-chip-list>
      </div>
      <div *ngIf="config.enableSave">
        <button mat-raised-button (click)="applyCondition()">Apply</button>
      </div>
    </div>

  `,
  styleUrls: [ 'filter.scss' ]
})

export class FilterConditionComponent implements OnInit {
  @Input('conditionIndex') conditionIndex;
  @Input('columns') columns;
  @Input('filterId') filterId;
  @Input('filter') filter : UserFilter;
  @Input('config') config = {
    enableSave: false,
    needClone: false
  };
  @Output() removeCondition = new EventEmitter<any>();
  @Output() emitColumnChange = new EventEmitter<any>();
  @Output() syncCondition = new EventEmitter<any>();
  @ViewChild('focusInput') focusInput: ElementRef;

  filteredColumns: {}[] = [];
  orDateValue: Date;
  condition: any;
  constructor(private router: Router, private userFilterService: UserFilterService) {

  }

  ngOnInit() {
    if (this.filter) {
    } else {
      this.filter = cloneDeep(this.userFilterService.currentFilter);
    }

    if (this.filter.conditions[this.conditionIndex]) {
      // it is a old condition
      this.condition = this.filter.conditions[this.conditionIndex];

      if (this.condition.type == 'date') {
        if (this.condition.method == '<>' || this.condition.method == '$or') {
          let conditionValue = [];
          this.condition.value.forEach(_date => {
            conditionValue.push(new Date(_date));
          })
          this.condition.value = conditionValue;
        } else {
          this.condition.value = new Date(this.condition.value);
        }
      }

    } else {
      // create a new condition
      this.condition = {
        column: '',
        type: '',
        value: ''
      };
      this.filter.conditions.push(this.condition);
    }

    this.start();
  }

  start() {
    // this.condition = Object.assign({}, this.condition);
    this.loadFilteredColumns();
  }

  loadFilteredColumns() {
    this.filteredColumns = [];
    let urlColumns = new Set();

    this.filter.conditions
      .forEach(condition => {
        urlColumns.add(condition.column);
      });

    this.columns.forEach((_column) => {
      if (!urlColumns.has(_column.prop)) {
        this.filteredColumns.push(_column);
      }
      if (_column.prop == this.condition.column) {
        this.filteredColumns.push(_column);
        this.condition.column = _column.prop;
      }
    });
  }

  onColumnChange() {
    this.columns.findIndex(column => {
      if (this.condition.column == column.prop) {
        this.condition.type = column.type;
        return true;
      }
    });
    this.condition.methods = Methods[this.condition.type];

    // switch(this.condition.method) {
    //   case '$or':
    //     this.condition.value = [];
    //     break;
    //   case '<>':
    //     this.condition.value = [];
    //
    //     break;
    //   case 'month':
    //     this.condition.value = [];
    //
    //     break;
    //   case '$eq':
    //     this.condition.value = '';
    //
    //     break;
    //   default:
    //     this.condition.value = '';
    //     break;
    // }

    // this.syncCondition.emit(this.condition);
  }

  onMethodChange() {
    setTimeout(() => {
      if (this.focusInput) {
        this.focusInput.nativeElement.focus();
      }
    }, 0);

    // this.focusInput.nativeElement.focus();
    console.log('swithc');
    switch(this.condition.method) {
      case '$gte': case '$lt': case '$regex':
        this.condition.value = '';
        break;
      case '$or': case '<>':
        this.condition.value = [];
        break;
      case '$eq': case '$ne':
        if (this.condition.type == 'date') {
          this.condition.value = null;
        } else {
          this.condition.value = '';
        }
        break;
      case 'thisMonth':
        // const date = new Date();
        // const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        // let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        // lastDay = moment(lastDay).hour(23).minutes(59).seconds(59).toDate();
        // condition.value = [
        //   firstDay,
        //   lastDay
        // ];
        this.condition.value = 'thisMonth';
        break;
      case 'today':
        // const date = new Date();
        // const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        // let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        // lastDay = moment(lastDay).hour(23).minutes(59).seconds(59).toDate();
        // condition.value = [
        //   firstDay,
        //   lastDay
        // ];
        this.condition.value = 'today';
        break;
      default:
        this.condition.value = [];
        break;
    }

    // this.syncCondition.emit(this.condition);
  }

  addValueToCondition(tag) {
    let newTag = tag.toString();
    let newSet = new Set(this.condition.value);
    newSet.add(newTag);
    this.condition.value = Array.from(newSet);
  }

  removeTag(tagIndex) {
    if (this.condition.method === '$or') {
      this.condition.value.splice(tagIndex, 1);
    }
  }

  onEarlierChange(earlierDate) {
    earlierDate = moment(earlierDate).hour(23).minutes(59).seconds(59).toDate();
    this.condition.value[0] = earlierDate;
  }


  applyCondition() {

    if (this.condition.type == 'date') {
      if (this.condition.method == '$or') {
        let newSet = new Set(this.condition.value);
        this.condition.value.forEach(_value => {
          newSet.add(_value.toString());
        });
        this.condition.value = Array.from(newSet);
      } else {
        // this.condition.value = this.condition.formattedValue;
      }
    }

    let conditionIndex = this.filter.conditions.findIndex(_condition => _condition.column == this.condition.column);

    if (conditionIndex > -1) {
      this.filter.conditions[conditionIndex] = Object.assign({}, this.condition);

    } else {
      this.filter.conditions.push(this.condition);
    }

    let queryParams = this.filter._getQueryParams();

    this.userFilterService.navigate(queryParams);

    // if (this.filter._id) {
    //   this.filter._saveConditions$()
    //     .subscribe(res => {
    //       if (res) {
    //         let queryParams = this.filter._getQueryParams();
    //         this.router.navigate([], {queryParams});
    //       }
    //     })
    // } else {
    //   // this filter is not saved, apply to it.
    // }
  }

  onClick() {
    let otherConditionsColumnNames = new Set();
    this.filter.conditions.forEach((_condition) => {
      if (_condition.column && _condition.column != '' && this.condition.column != _condition.column) {
        otherConditionsColumnNames.add(_condition.column);
      }
    });

    this.filteredColumns = this.columns.filter(_column => {
      if (!otherConditionsColumnNames.has(_column.prop)) {
        return true;
      }
    })
  }

  onStartDateChange(e) {
    this.condition.value[0] = e.value;
  }

  onEndDateChange(e) {
    this.condition.value[1] = moment(e.value).hour(23).minutes(59).seconds(59).toDate();
  }

  addEvent(name, e) {
    switch(name) {
      case 'onStartDateChange':
        this.onStartDateChange(e);
        break;
      case 'onEndDateChange':
        this.onEndDateChange(e);
        break;
      default:
        break;
    }
  }

  onRemove() {
    this.removeCondition.emit(true);
  }

  onKeyDown(event) {
    if (event.key == 'Enter') {
      this.applyCondition();
    }
  }
}