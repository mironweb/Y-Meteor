// // chai uses as asset library
// import * as chai from "chai";
// import * as spies from "chai-spies";
// import StubCollections from "meteor/hwillson:stub-collections";
// import {GuofuTestingPage} from './guofu-testing.page';
// const expect = chai.expect;
// chai.use(spies);
//
// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { By } from '@angular/platform-browser';
// import { DebugElement } from '@angular/core';
// import { ComponentFixtureAutoDetect } from '@angular/core/testing';
//
// import {BannerComponent} from "./bannerComponent";
//
// export const ROUTES_PROVIDERS = [
//   {
//     provide: 'canActivateForLoggedIn',
//     useValue: () => !! Meteor.userId(),
//   },
//   ];
// // describe('Testing message state in message.component', () => {
// //   let app: GuofuTestingPage;
// //
// //   beforeEach(() => {
// //     app = new GuofuTestingPage('hello');
// //   });
// //
// //   it('should set new message', () => {
// //     app.setMessage('Testing');
// //     expect('Testing').to.equal('Testing');
// //   });
// //
// //   it('should clear message', () => {
// //     app.clearMessage();
// //     expect('Testing').to.equals('Testing');
// //   });
// // });
//
// describe('BannerComponent (inline template)', () => {
//
//   let comp:    BannerComponent;
//   let fixture: ComponentFixture<BannerComponent>;
//   let de:      DebugElement;
//   let el:      HTMLElement;
//
//   beforeEach(() => {
//     TestBed.configureTestingModule({
//       declarations: [ BannerComponent ], // declare the test component,
//       providers: [
//         {provide: ComponentFixtureAutoDetect, useValue: true},
//         ...ROUTES_PROVIDERS
//       ]
//     });
//
//     fixture = TestBed.createComponent(BannerComponent);
//
//     comp = fixture.componentInstance; // BannerComponent test instance
//
//     // query for the title <h1> by CSS element selector
//     de = fixture.debugElement.query(By.css('h1'));
//     el = de.nativeElement;
//   });
//
//   it('should display original title', () => {
//     // fixture.detectChanges();
//     expect(el.textContent).to.contain(comp.title);
//   });
//
//   it('should still see original title after comp.title change', () => {
//     const oldTitle = comp.title;
//     comp.title = 'Test Title';
//     // Displayed title is old because Angular didn't hear the change :(
//     expect(el.textContent).to.contain(oldTitle);
//   });
//
//   it('should display updated title after detectChanges', () => {
//     comp.title = 'Test Title';
//     fixture.detectChanges(); // detect changes explicitly
//     expect(el.textContent).to.contain(comp.title);
//   });
//
// });
