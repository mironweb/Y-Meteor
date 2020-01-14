import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'admin-dashboard',
  template: `
    <div>
      Admin Page
    </div>
  `,
  styleUrls: [ 'admin-dashboard.page.scss' ]
})

export class AdminDashboardComponent implements OnInit{

  @Input() data: any;

  constructor(private router: Router) {}

  ngOnInit() {
  }

}
