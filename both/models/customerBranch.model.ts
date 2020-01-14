export interface CustomerBranch {
    _id?: string;
    customerID: string;
    CustomerName: string;
    shipTo: string;
    name: string;
    address1: string;
    address2: string;
    address3: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    phoneExtension: string;
    fax: string;
    email: string;
    salespeople: salespeople[];
    createdUserId: string;
    createdAt: Date;
    removed: boolean;
    tenantId: string;
}

interface salespeople {
}
