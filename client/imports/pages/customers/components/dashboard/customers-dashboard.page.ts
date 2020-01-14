import { Component, OnInit, Input } from '@angular/core';

import { Router } from '@angular/router';

@Component({
  selector: 'customers-dashboard',
  template: `
    <div>
      Customers Dashboard
    </div>
  `,
})

export class CustomersDashboardPage implements OnInit{

  @Input() data: any;

  constructor(private router: Router) {}

  ngOnInit() {
  }

}
