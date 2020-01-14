import {Component, OnInit} from '@angular/core';

import { Meteor } from 'meteor/meteor';

@Component({
  selector: 'todo-add',
  templateUrl: 'todo-add.html'
})
export class TodoAddComponent implements OnInit{
  content: string;
  addTodo() {
    Meteor.call('addTodo', this.content);
    this.content = null;
  }

  ngOnInit() {
    // console.log('todo add ');
    // console.log("pages/todo");
  }
}
