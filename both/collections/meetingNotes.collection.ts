import { MongoObservable } from "meteor-rxjs";
import { MeetingNotes } from '../models/meetingNotes.model';

export const MeetingNote = new MongoObservable.Collection<MeetingNotes>('meetingNotes');