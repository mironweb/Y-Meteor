export class NewCustomerQuote {
  status: string;
  createdUserId: string;
  createdAt: Date;
  tenantId: string;
  isSynced: boolean;

  constructor() {
    this.status = 'pending';
    // this.createdUserId = Meteor.userId();
    // this.createdAt = new Date();
    this.tenantId = Session.get('tenantId');
    this.isSynced = false;
  }
}

export interface CustomerQuote {
  _id?: string;
  customerId : string;
  categoryId : string;
  notes : null;
  products : products;
  isSynced : boolean;
  status : string;
  adminNotes : null;
  createdUserId: string;
  createdAt: Date;
  removed: boolean;
  tenantId: string;
  updatedUserId: string;
  updatedDateTime: Date;
}

interface products {
  price: string;
  productId: string;
  previousPrice: number;
  originalPrice: number;
  invoices: null;
}