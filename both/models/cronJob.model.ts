
export interface CronJob {
  _id?: string;
  email: Email;
  cronTime: string;
  name: string;
  start: boolean;
  status: string;
}

interface Email {
  from: string;
  to: string;
  subject: string;
}