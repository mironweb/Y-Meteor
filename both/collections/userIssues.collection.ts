import { MongoObservable } from 'meteor-rxjs';
import { UserIssue } from '../models/userIssue.model';

export const UserIssues = new MongoObservable.Collection<UserIssue>('userIssues');
