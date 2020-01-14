import { Component, OnInit, Input } from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'inventory-info',
  template: `
    <div>
      Info
      <!--<table-expandable-rows>loading</table-expandable-rows>-->
      <!--<system-lookup></system-lookup>-->
    </div>
  `,
})

export class InventoryInfoPage implements OnInit{

  @Input() data: any;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
  }
}
