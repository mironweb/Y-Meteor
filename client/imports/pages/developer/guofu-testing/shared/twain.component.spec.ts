// import 'tslib';
// import 'zone.js/dist/zone';
// import 'zone.js/dist/long-stack-trace-zone';
// import 'zone.js/dist/async-test';
// import 'zone.js/dist/fake-async-test';
// import 'zone.js/dist/sync-test';
// import 'zone.js/dist/proxy';
// import 'zone.js/dist/mocha-patch';
// import 'core-js/es7/reflect';
//
//
// import { async, fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
// import { By }                        from '@angular/platform-browser';
// import { DebugElement }              from '@angular/core';
//
// import { TwainService }   from './twain.service';
// import { TwainComponent } from './twain.component';
// var chai = require('chai');
// var spies = require('chai-spies');
// chai.use(spies);
// import * as PubSub from 'pubsub-js';
// const expect = chai.expect;
// const assert = chai.assert;
//
// import * as sinon from 'sinon';
//
// // import "angular2-meteor-polyfills";
// // import "zone.js/dist/async-test";
// // import "zone.js/dist/fake-async-test";
// // import "zone.js/dist/sync-test";
// // import "zone.js/dist/proxy";
// // import 'core-js';
// // import 'zone.js/dist/zone';
// // import 'zone.js/dist/long-stack-trace-zone';
// // import 'rxjs';
//
// describe('TwainComponent', () => {
//
//   let comp: TwainComponent;
//   let fixture: ComponentFixture<TwainComponent>;
//
//   let stub: sinon.stub;
//   let de: DebugElement;
//   let el: HTMLElement;
//   let twainService: TwainService; // the actually injected service
//
//   const testQuote = 'Test Quote';
//   let app = null;
//
//   beforeEach(() => {
//     TestBed.configureTestingModule({
//       declarations: [ TwainComponent ],
//       providers:    [ TwainService ],
//     });
//
//     fixture = TestBed.createComponent(TwainComponent);
//     comp    = fixture.componentInstance;
//
//     // TwainService actually injected into the component
//     twainService = fixture.debugElement.injector.get(TwainService);
//
//     // Setup spy on the `getQuote` method
//     stub = sinon.stub(twainService, 'getQuote');
//
//     stub.returns(Promise.resolve(testQuote));
//
//       // .and.returnValue(Promise.resolve(testQuote));
//
//     // Get the Twain quote element by CSS selector (e.g., by class name)
//     de = fixture.debugElement.query(By.css('.twain'));
//     el = de.nativeElement;
//   });
//
//
//   it('should not show quote before OnInit', () => {
//     expect(el.textContent).to.equal('', 'nothing displayed');
//     expect(stub.called).to.equal(false, 'getQuote not yet called');
//
//   });
//
//   it('should still not show quote after component initialized', () => {
//     fixture.detectChanges();
//     // getQuote service is async => still has not returned with quote
//     expect(el.textContent).to.equal('...', 'no quote yet');
//     expect(stub.called).to.equal(false, 'getQuote called');
//   });
//
//   it('should show quote after getQuote promise (async)', async(() => {
//     fixture.detectChanges();
//
//     // fixture.whenStable().then(() => { // wait for async getQuote
//     //   fixture.detectChanges();        // update view with quote
//     //   console.log('test2', el.textContent);
//     //   expect(el.textContent).to.be(testQuote);
//     // });
//   }));
//
//
//   // it("test should call all subscribers, even if there are exceptions", () => {
//   //   expect(true).to.equal(true);
//   // });
//
//   // it("test should stub method differently on consecutive calls", function () {
//   //   // var callback = sinon.spy();
//   //
//   //   // callback.onCall(0).returns(1);
//   //   // callback.onCall(1).returns(2);
//   //   // callback.returns(3);
//   //   //
//   //   // callback(); // Returns 1
//   //   // callback(); // Returns 2
//   //   // callback(); // All following calls return 3
//   // });
//
//   // it('should still not show quote after component initialized', () => {
//   //   fixture.detectChanges();
//   //   // getQuote service is async => still has not returned with quote
//   //   expect(el.textContent).to.equal('...', 'no quote yet');
//   //   expect(spy.calls.any()).to.equal(true, 'getQuote called');
//   // });
//   //
//   // it('should show quote after getQuote promise (async)', async(() => {
//   //   fixture.detectChanges();
//   //
//   //   fixture.whenStable().then(() => { // wait for async getQuote
//   //     fixture.detectChanges();        // update view with quote
//   //     expect(el.textContent).to.equal(testQuote);
//   //   });
//   // }));
//   //
//   // it('should show quote after getQuote promise (fakeAsync)', fakeAsync(() => {
//   //   fixture.detectChanges();
//   //   tick();                  // wait for async getQuote
//   //   fixture.detectChanges(); // update view with quote
//   //   expect(el.textContent).to.equal(testQuote);
//   // }));
//   //
//   // it('should show quote after getQuote promise (done)', (done: any) => {
//   //   fixture.detectChanges();
//   //
//   //   // get the spy promise and wait for it to resolve
//   //   spy.calls.mostRecent().returnValue.then(() => {
//   //     fixture.detectChanges(); // update view with quote
//   //     expect(el.textContent).to.equal(testQuote);
//   //     done();
//   //   });
//   // });
// });
//
//
// /*
// Copyright 2017 Google Inc. All Rights Reserved.
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file at http://angular.io/license
// */