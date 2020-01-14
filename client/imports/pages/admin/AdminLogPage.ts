import {Component, OnInit} from '@angular/core';

@Component({
  selector: `AdminLogPage`,
  template: `    
    <div class="pageHeader">
      <h2>Log</h2>
    </div>
    <section class="box">
      <div>
        <filterBox-component [lookupName]="'systemLogs'"></filterBox-component>
      </div>
      <div>
        <section id="customerQuoteForm" class="container">
          <system-lookup [lookupName]="'systemLog'"></system-lookup>
        </section>
      </div>
  
    </section>
  `
})

export class AdminLogPage implements OnInit {
  consturctor() {
  }

  ngOnInit() {

  }
}