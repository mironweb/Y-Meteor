import {Injectable} from '@angular/core';
import {CustomerMeetingModel, CustomerMeeting} from "../../../../both/models/customerMeeting.model";

@Injectable()
export class CustomersService {
  static fromCustomer = {};
  static toCustomers = [];
  static isSlideChecked = false;
  static updatedCustomers = [];
  static excludedCustomers = [];
  static selectedCustomers = [];
  static increasePercentage = 0;

  customerMeeting: CustomerMeetingModel = new CustomerMeeting();
}
