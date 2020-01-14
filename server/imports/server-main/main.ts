import '../cronjobs/cronjob';
import '../cronjobs/cron';
import { Users } from '../../../both/collections/users.collection';
import { User } from '../../../both/models/user.model';


export class Main {
  start(): void {
    this.initFakeData();
  }

  initFakeData(): void {
    if (Users.find({}).cursor.count() === 0) {
      const data = [{
        username: "wzcnhgf@gmail.com",
        parentTenantId: '25'
      }, {
        username: "wzcnhgf1@gmail.com",
        parentTenantId: '26'
      }, {
        username: "wzcnhgf2@gmail.com",
        parentTenantId: '27'
      }];
      data.forEach((obj: any) => {
        Users.insert(obj);
      });
    }
  }
}
