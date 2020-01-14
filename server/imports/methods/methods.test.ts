// import * as chai from "chai";
// import * as spies from "chai-spies";
// import StubCollections from "meteor/hwillson:stub-collections";
// import "./methods";
// import { SystemTenants } from "../../../both/collections/systemTenants.collection";
// import { DemoCollection } from "../../../both/collections/demo.collection";
//
// chai.use(spies);
//
// describe("Server Main", () => {
//
//   beforeEach(() => {
//     // Creating database mock
//     // StubCollections.stub(DemoCollection);
//     Meteor.call('insertDocument');
//
//     // Create instance of main class
//   });
//
//   afterEach(() => {
//     // Restore database
//     StubCollections.restore();
//   });
//
//   // it("Should call initFakeData on startup", () => {
//   //   mainInstance.initFakeData = chai.spy();
//   //   mainInstance.start();
//   //
//   //   chai.expect(mainInstance.initFakeData).to.have.been.called();
//   // });
//   //
//   // it("Should call insert 3 times when init fake data", () => {
//   //   DemoCollection.insert = chai.spy();
//   //   mainInstance.initFakeData();
//   //
//   //   chai.expect(DemoCollection.insert).to.have.been.called.exactly(3);
//   // });
// });
