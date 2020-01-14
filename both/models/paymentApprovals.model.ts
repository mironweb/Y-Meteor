export interface PaymentApprovalModel {
  "_id": string;
  "type": string;
  "documents": charges[],
  "tenantId": string;
  "createdUserId": string;
  "createdAt": Date;
  "parentTenantId": string;
}

interface charges {
  "_id": string,
  "description": string,
  "amount": Number,
  "status": string
}