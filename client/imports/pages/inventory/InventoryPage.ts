import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: `InventoryPage`,
  template: `    
    <router-outlet></router-outlet>
  `
})

export class InventoryPage implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    // const modulePath = this.router.url.split('/')[1];
    //
    // // this.router.config[2].children[2]._loadedConfig.routes.unshift({path: 'inventory/info', component: InventoryInfoPage});
    // // this.router.config[2].children[2]._loadedConfig.routes.pop();
  }
}