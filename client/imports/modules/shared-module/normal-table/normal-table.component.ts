import { Component, Input, Output, EventEmitter, OnInit, OnChanges} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
@Component({
  selector: `normal-table`,
  template: `
    <div style="overflow: auto">
      <table id='tables'>
        <tr>
          <th *ngFor="let column of columns" [hidden]="column.hidden">{{column.label}}</th>
        </tr>
        <tr *ngFor="let row of rows" style='cursor: pointer;' (click)='onReturn(row)'>
          <td *ngFor="let rowValue of row; let i = index" [hidden]="columns[i].hidden" [ngSwitch]="columns[i].cellTemplate">
            <div *ngSwitchDefault>
              {{rowValue}}
            </div>
            <div *ngSwitchCase="'number'">
              {{rowValue | number}}
            </div>
            <div *ngSwitchCase="'percent'">
              {{rowValue | percent: '1.2-2'}}
            </div>
            <div *ngSwitchCase="'currency'">
              {{rowValue | currency: 'USD': 'symbol'}}
            </div>
        </tr>
      </table>
    </div>
  `,
  styleUrls: [ 'normal-table.component.scss' ]
})

export class NormalTableComponent implements OnInit, OnChanges {

  @Input() rows:any;
  @Input() columns:any;
  @Output() onSelected = new EventEmitter<any>();

  constructor(private _router: Router, private _route: ActivatedRoute) {}

  ngOnInit() {

  }

  ngOnChanges(changes) {

  }

  onReturn(row) {
    this.onSelected.emit(row);
  }
}