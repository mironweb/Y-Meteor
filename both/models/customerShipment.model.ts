export interface CustomerShipment {
  _id?: string;
  tenantId: string;
  createdUserId: string;
  createdAt: Date;
  number: string;
  status: string;
  customerId: string;
  shipToName: string;
  shipToAddress1: string;
  shipToAddress2: string;
  shipToAddress3: string;
  shipToCity: string;
  shipToState: string;
  shipToZipCode: string;
  shipMethod: string;
  notes: string;
  trackingNumber: string;
  pallets: CustomerShipmentPallet[];
}

export interface CustomerShipmentPallet {
  _id: string;
  createdUserId: string;
  createdAt: Date;
  sequence: string;
  weight: number; // TODO use NumberDecimal later
  boxes: CustomerShipmentBox[];
}

export interface CustomerShipmentBox {
  _id: string;
  createdUserId: string;
  createdAt: Date;
  sequence: string;
  products: CustomerShipmentProduct[];
}

export interface CustomerShipmentProduct {
  _id: string;
  productId: string;
  createdUserId: string;
  createdAt: Date;
  customerOrderId: string;
  warehouseBinId: string;
  qtyShipped: number;
  weight: number; // TODO use NumberDecimal later
}
