export interface VendorOrder {
    _id?: string;
    number: string;
    type: string;
    status: string;
    date: Date;
    requiredDate: Date;
    vendorID: string;
    purchaseFromName: string;
    purchaseFromAddress1: string;
    purchaseFromAddress2: string;
    purchaseFromAddress3: string;
    purchaseFromCity: string;
    purchaseFromState: string;
    purchaseFromZipCode: string;
    shipToName: string;
    shipToAddress1: string;
    shipToAddress2: string;
    shipToAddress3: string;
    shipToCity: string;
    shipToState: string;
    shipToZipCode: string;
    notes: string;
    lineItems: lineItems[]
    createdUserId: string;
    createdAt: Date;
    removed: boolean;
    tenantId: string;
}

interface lineItems {
    _id?: string;
    sequence: number;
    type: string;
    status: string;
    description: string;
    requiredDate: Date;
    productID: string;
    categoryID: string;
    cost: number;
    qtyOrdered: number;
    qtyBackordered: number;
    qtyReceived: number;
    total: number;
    notes: string;
    createdUserId: string;
    createdAt: Date;
}
