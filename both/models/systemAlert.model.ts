export interface SystemAlert {
  _id: string;
  name: string;
  tenantId: string;
  deleted: boolean;
  active: boolean;
  email: Email,
  schedule: string;
  method: {};
  createdUserId: string;
  createdAt: Date;
  parentTenantId: string;
}

interface Email {
  from: string,
  to: string,
  cc: string,
  bcc: string,
  attachments: {},
  subject: string,
  body: string
}