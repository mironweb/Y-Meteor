import {MongoObservable} from "meteor-rxjs";
import { CustomerMeetingModel } from '../models/customerMeeting.model';

export const CustomerMeetings = new MongoObservable.Collection<CustomerMeetingModel>('customerMeetings');