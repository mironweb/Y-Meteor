import {Component, OnInit} from '@angular/core';

import { Meteor } from 'meteor/meteor';

@Component({
  selector: 'main-dashboard',
  templateUrl: 'main-dashboard.html'
})
export class MainDashboardComponent implements OnInit{
  content: string;
  addTodo() {
    // Meteor.call('addTodo', this.content);
    this.content = null;
  }

  ngOnInit() {
    // console.log('todo add ');
    // console.log("main dashboard");
  }
}
