// import { QuoteService } from './quote.service';
// import { QuoteComponent } from './quote.component';
// import { destroyPlatform } from '@angular/core';
// import {
//   async,
//   inject,
//   TestBed,
// } from '@angular/core/testing';
// import {
//   BrowserDynamicTestingModule,
//   platformBrowserDynamicTesting
// } from '@angular/platform-browser-dynamic/testing';
//
// var chai = require('chai');
// var spies = require('chai-spies');
// chai.use(spies);
// import * as PubSub from 'pubsub-js';
// const expect = chai.expect;
// const assert = chai.assert;
//
// class MockQuoteService {
//   public quote: string = 'Test quote';
//
//   getQuote() {
//     return Promise.resolve(this.quote);
//   }
// }
//
// describe('Testing Quote Component', () => {
//
//   let fixture;
//
//   before('before allyes', () => {
//     // TestBed.initTestEnvironment(
//     //   BrowserDynamicTestingModule,
//     //   platformBrowserDynamicTesting()
//     // );
//   });
//
//   beforeEach(() => {
//
//     TestBed.configureTestingModule({
//       declarations: [
//         QuoteComponent
//       ],
//       providers: [
//         QuoteService
//       ]
//     });
//     fixture = TestBed.createComponent(QuoteComponent);
//     fixture.detectChanges();
//   });
//
//   it('Should get quote', async(inject([], () => {
//     fixture.componentInstance.getQuote();
//     fixture.whenStable()
//       .then(() => {
//         fixture.detectChanges();
//         return fixture.whenStable();
//       })
//       .then(() => {
//         const compiled = fixture.debugElement.nativeElement;
//         expect(compiled.querySelector('div').innerText).toEqual('Test quote');
//       });
//   })));
// });
