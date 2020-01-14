// // chai uses as asset library
// import * as chai from "chai";
// import * as spies from "chai-spies";
// import StubCollections from "meteor/hwillson:stub-collections";
// import {GuofuTestingPage} from './guofu-testing.page';
// const expect = chai.expect;
//
// import * as Sinon from 'sinon';
//
//
//
// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { By } from '@angular/platform-browser';
// import { DebugElement } from '@angular/core';
// import { ComponentFixtureAutoDetect } from '@angular/core/testing';
//
// import {WelcomeComponent} from "./WelcomeComponent";
// import { UserService } from './model/user.service';
//
// const userServiceStub = {
//   isLoggedIn: true,
//   user: { name: 'Test User'}
// };
//
// describe('welcome component test', () => {
//
//   let comp:    WelcomeComponent;
//   let fixture: ComponentFixture<WelcomeComponent>;
//   let de:      DebugElement;
//   let el:      HTMLElement;
//   let userServiceStub;
//   let userService;
//   let spy: Sinon.Spy;
//   const testQuote = 'Test Quote';
//
//   beforeEach(() => {
//     // stub UserService for test purposes
//     userServiceStub = {
//       isLoggedIn: true,
//       user: { name: 'Test User'}
//     };
//
//     TestBed.configureTestingModule({
//       declarations: [ WelcomeComponent ],
//       providers:    [ {provide: UserService, useValue: userServiceStub } ]
//     });
//
//     let spyResult = spy(UserService, 'getQuote')
//       .and.returnValue(Promise.resolve(testQuote));
//
//
//
//
//     fixture = TestBed.createComponent(WelcomeComponent);
//     comp    = fixture.componentInstance;
//
//     // UserService from the root injector
//     userService = TestBed.get(UserService);
//
//     //  get the "welcome" element by CSS selector (e.g., by class name)
//     de = fixture.debugElement.query(By.css('.welcome'));
//     el = de.nativeElement;
//   });
//
//
//   it('should welcome the user', () => {
//
//
//     fixture.detectChanges();
//     const content = el.textContent;
//     expect(content).to.contain('Welcome', '"Welcome ..."');
//     expect(content).to.contain('Test User', 'expected name');
//   });
//
//   it('should welcome "Bubba"', () => {
//     userService.user.name = 'Bubba';
//     fixture.detectChanges();
//     expect(el.textContent).to.contain('Bubba');
//   });
//
//   it('should request login if not logged in', () => {
//     userService.isLoggedIn = false; // welcome message hasn't been shown yet
//     fixture.detectChanges();
//     const content = el.textContent;
//     expect(content).not.to.contain('Welcome', 'not welcomed');
//     expect(content).to.match(/log in/i, '"log in"');
//   });
//
//
// });
