export interface CustomerInvoice {
  _id?: string;
  number : string;
  type : string;
  status : string;
  date : Date;
  promiseDate : null;
  scheduleDate : null;
  shipDate : Date;
  customerID : string;
  customerPurchaseOrder : string;
  billToName : string;
  billToAddress1 : string;
  billToAddress2 : string;
  billToAddress3 : string;
  billToCity : string;
  billToState : string;
  billToZipCode : string;
  shipToName : string;
  shipToAddress1 : string;
  shipToAddress2 : string;
  shipToAddress3 : string;
  shipToCity : string;
  shipToState : string;
  shipToZipCode : string;
  notes : string;
  freight : number;
  discount : number;
  salespeople: salespeople[];
  lineItems: lineItems[];
  createdUserId: string;
  createdAt: Date;
  removed: boolean;
  tenantId: string;
}

interface salespeople {
  userID: string;
  commissionPercent: number;
}

interface lineItems {
  _id : string;
  sequence : number;
  type : string;
  status : string;
  description : string;
  promiseDate : null;
  dropShipment : boolean;
  productID : string;
  categoryID : string;
  price : number;
  cost : number;
  qtyShipped : number;
  total : number;
  notes : string;
  createdUserId: string;
  createdAt: Date;
}
