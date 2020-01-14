import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as funcs from '../../../../../../both/functions/common';
import { MeteorObservable } from "meteor-rxjs";
import { Observable } from "rxjs/Observable";
import { ActivatedRoute, Router } from '@angular/router';
import { AllCollections } from "../../../../../../both/collections/index";
import { merge } from 'rxjs';

@Component({
    selector: 'lifeInsurance',
    template: `
        <div fxLayout="row" fxLayoutAlign="space-between center">
            <filterBox-component fxFlex='100' (filter)="getFilterConditions($event)" [lookupName]="'lifeInsurance'"></filterBox-component>
        </div>
        <system-lookup [lookupName]="'lifeInsurance'" [isModal]="false" [(data)]="data" [(filterConditions)]="filterConditions"></system-lookup>
  `,
    // styleUrls: ['executive-dashboard.page.scss'],
})

export class LifeInsurancePage implements OnInit {

    @Input() data: any;
    filterConditions: any;
    objLocal: any = {};
    loading: boolean = true;
    // rows: any;
    @Output() rows = new EventEmitter<any>();
    @Output() lookupView = new EventEmitter<any>();

    constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    }

    async init() {
        console.log('hit');
    }

    ngOnInit() {
        this.init();
    }

    getFilterConditions(action) {
        this.reducers(action);
    }

    reducers(action) {
        switch (action.type) {
            case 'UPDATE_FILTERCONDITIONS':
                this.filterConditions = action.value;
                return;
            case 'ADD_FILTER':
                this.filterConditions = action.value;
                return;
            default:
                return;
        }
    }

}
