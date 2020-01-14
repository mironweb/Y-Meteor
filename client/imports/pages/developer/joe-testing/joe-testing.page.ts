import {MeteorObservable} from "meteor-rxjs";
import {NotificationsService} from 'angular2-notifications';
import { Component, OnInit, ComponentFactoryResolver, ViewChildren, QueryList, ViewContainerRef, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { getReferredLookupId, parseAll, consoleLog } from '../../../../../both/functions/common';
import {Router} from "@angular/router";
import {UserService} from "../../../services/UserService";
import * as moment from 'moment-timezone';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import ExecutivePages from '../../../pages/executive/components';
import { HTTP } from 'meteor/http'


interface FoodNode {
  name: string;
  count?: number;
  items?: FoodNode[];
}

const TREE_DATA: FoodNode[] = [
  {
    name: 'Fruit',
    items: [
      { name: 'Apple', count: 10 },
      { name: 'Banana', count: 20 },
      { name: 'Fruit loops', count: 30 },
    ]
  }, {
    name: 'Vegetables',
    items: [
      {
        name: 'Green',
        items: [
          { name: 'Broccoli', count: 10 },
          { name: 'Brussel sprouts', count: 20 },
        ]
      }, {
        name: 'Orange',
        items: [
          { name: 'Pumpkins', count: 30 },
          { name: 'Carrots', count: 40 },
        ]
      },
    ]
  },
];

interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  count: number;
  level: number;
}

@Component({
  selector: 'joe-testing',
  templateUrl: 'joe-testing.page.html'
})

export class JoeTestingPage implements OnInit{
  @ViewChildren('card') mycomponents: QueryList<any>;
  @ViewChild("alertContainer", { read: ViewContainerRef }) container;
  data:any = {
    start: moment().add(-29, 'day').startOf('day').format(),
    end: moment().add(-15, 'day').startOf('day').format()
  };
  displayedColumns: string[] = ['name', 'count'];
  agedInvoiceRanges: any = {
    current: { start: -14 },
    range15: { start: -29, end: -15 },
    range30: { start: -59, end: -30 },
    range60: { start: -89, end: -60 },
    range90: { end: -90 },
  };


  ngOnInit() {
    // console.log('EXAMPLE', ExecutivePages)
    // console.log('EXAMPLE', ExecutivePages.ExecutiveAgedInvoices)

    // this.data.start = moment().add(this.agedInvoiceRanges.range15.start, 'day').startOf('day').format();
    // this.data.end = moment().add(this.agedInvoiceRanges.range15.end, 'day').startOf('day').format();

    // ExecutivePages.ExecutiveAgedInvoices.createComponent(componentFactory);
  }



  click(){
    // console.log(this.mycomponents)
    // let componentFactory = this.componentFactoryResolver.resolveComponentFactory(ExecutivePages.ExecutiveAgedInvoices)
    // console.log(componentFactory)
    // console.log(this.mycomponents)
    // this.container.createComponent(componentFactory)
  }
  quote(){
    console.log('quote')
    MeteorObservable.call('selfSubmitQuote').subscribe((res: any) => {
      console.log(res)
      // let data = res.data;
      if(res){
        setTimeout(() => {
          this.getQuote(res.data.quoteNumber)
        }, 3000);
      }
    })
  }
  getQuote(number){
    console.log('getQuote')
    MeteorObservable.call('getQuote', number).subscribe((res: any) => {
      console.log(res)
      // console.log(res.data.rateQuote)
    })
  }



  private transformer = (node, level) => {
    let obj = {
      expandable: !!node.items && node.items.length > 0,
      level: level,
    }

    for (let index = 0; index < this.displayedColumns.length; index++) {
      const element = this.displayedColumns[index];
      Object.assign(obj, { [element]: node[element] })
    }
    // console.log('~~~', obj)

    return obj;
  }

  treeControl = new FlatTreeControl(
    node => node['level'], node => node['expandable']);

  treeFlattener = new MatTreeFlattener(
    this.transformer, node => node.level,
    node => node.expandable, node => node.items);

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {
    // console.log(this.dataSource.data)
    this.dataSource.data = TREE_DATA;
    
    // console.log(this.dataSource.data)
  }

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;


}
