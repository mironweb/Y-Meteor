// // chai uses as asset library
// import * as chai from "chai";
// import * as spies from "chai-spies";
// import StubCollections from "meteor/hwillson:stub-collections";
//
// import { Main } from "./main";
// import { Users } from '../../../both/collections/users.collection';
// import { User } from '../../../both/models/user.model';
//
// const expect = chai.expect;
// chai.use(spies);
//
// describe("Server Main", () => {
//   let mainInstance: Main;
//
//   beforeEach(() => {
//     // Creating database mock
//     // StubCollections.stub(Users);
//
//     // Create instance of main class
//     mainInstance = new Main();
//   });
//
//   afterEach(() => {
//     // Restore database
//     StubCollections.restore();
//   });
//
//   it("Should call initFakeData on startup", () => {
//     mainInstance.initFakeData = chai.spy();
//     mainInstance.start();
//
//     expect(mainInstance.initFakeData).to.have.been.called();
//   });
//
//   // it("Should call insert 3 times when init fake data", () => {
//   //   Users.insert = chai.spy();
//   //   mainInstance.initFakeData();
//   //
//   //   expect(Users.insert).to.have.been.called.exactly(3);
//   //   expect(Users.collection.find().count()).to.equal(3);
//   // });
// });
