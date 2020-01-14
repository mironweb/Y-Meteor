// import { async, fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
// import {BrowserModule, By} from '@angular/platform-browser';
// import { DebugElement }              from '@angular/core';
// import {
//   BrowserDynamicTestingModule,
//   platformBrowserDynamicTesting
// } from "@angular/platform-browser-dynamic/testing";
// import { destroyPlatform } from '@angular/core';
//
// var chai = require('chai');
// var spies = require('chai-spies');
// chai.use(spies);
// import * as PubSub from 'pubsub-js';
// const expect = chai.expect;
// const assert = chai.assert;
// import { NotificationsService } from 'angular2-notifications';
//
// import * as sinon from 'sinon';
// import { FilterBoxComponent } from './filterBox.component';
// import { configureTests } from './tests.configure';
//
// // import {SharedModule} from "../index";
// // import { SimpleNotificationsModule, PushNotificationsModule } from 'angular2-notifications';
// // import {RouterModule} from "@angular/router";
//
// import * as types from './actionTypes';
// import {FilterService} from "./filter.service";
// import {MaterialImportModule} from "../../../app/material-import.module";
// import {SharedModule} from "../index";
// import {CommonModule} from "@angular/common";
//
// describe('Filter Component Test', () => {
//
//   let comp: FilterBoxComponent;
//   let fixture: ComponentFixture<FilterBoxComponent>;
//
//   let stub: sinon.stub;
//   let de: DebugElement;
//   let el: HTMLElement;
//
//   const testQuote = 'Test Quote';
//   let app = null;
//
//   beforeEach(() => {
//
//     TestBed.configureTestingModule({
//       imports: [
//         BrowserModule,
//         MaterialImportModule
//       ],
//       declarations: [
//         FilterBoxComponent
//       ]
//     });
//
//     fixture = TestBed.createComponent(FilterBoxComponent);
//
//     comp = fixture.componentInstance; // BannerComponent test instance
//
//
//
//     // const configure = (testBed: TestBed) => {
//     // };
//
//     // configureTests(configure).then(testBed => {
//     //   fixture = testBed.createComponent(FilterBoxComponent);
//     //
//     //   comp = fixture.componentInstance;
//     //   fixture.detectChanges();
//     // });
//
//   });
//
//   // it('HIDE_FILTER_DETAIL_COMPONENT should hide detail component', () => {
//   //
//   //   // comp.reducers({
//   //   //   type: types.ADD_NEW_FILTER
//   //   // });
//   //   // comp.reducers({type: types.HIDE_FILTER_DETAIL_COMPONENT});
//   //   //
//   //   expect(true).to.equal(true);
//   //   // expect(comp.state.isDetailHidden).to.equal(true);
//   // })
//
//   //
//   // it('SHOW_FILTER_DETAIL_COMPONENT: should show detail component', () => {
//   //   expect(comp.state.isDetailHidden).not.equal(true);
//   //   comp.reducers({type: types.SHOW_FILTER_DETAIL_COMPONENT});
//   //   expect(comp.state.isDetailHidden).to.equal(false);
//   // })
//   //
//   // it('ADD_NEW_FILTER: should show detail component', () => {
//   //   // expect(comp.state.addedFilters).not.equal(true);
//   //   console.log(comp.state);
//   //
//   //   comp.reducers({
//   //     type: types.ADD_NEW_FILTER,
//   //     value: {
//   //       filter: {
//   //         name: 'testname',
//   //         lookupName: 'testLookup',
//   //         conditions: [
//   //           {
//   //             column: 'testColumn',
//   //             type: 'string',
//   //             method: '$eq',
//   //             value: 'test value'
//   //           }
//   //         ]
//   //       }
//   //     }
//   //   });
//   //
//   //   expect(comp.state.isDetailHidden).to.equal(true);
//   // });
//
//
//   // it('should not show quote before OnInit', () => {
//   //   expect(el.textContent).to.equal('', 'nothing displayed');
//   //   expect(stub.called).to.equal(false, 'getQuote not yet called');
//   // });
//   //
//   // it('should still not show quote after component initialized', () => {
//   //   fixture.detectChanges();
//   //   // getQuote service is async => still has not returned with quote
//   //   expect(el.textContent).to.equal('...', 'no quote yet');
//   //   expect(stub.called).to.equal(false, 'getQuote called');
//   // });
//   //
//   // it('should show quote after getQuote promise (async)', async(() => {
//   //   fixture.detectChanges();
//   //   console.log('test1', el.textContent);
//   //
//   //   // fixture.whenStable().then(() => { // wait for async getQuote
//   //   //   fixture.detectChanges();        // update view with quote
//   //   //   expect(el.textContent).to.be(testQuote);
//   //   // });
//   // }));
// });
//
