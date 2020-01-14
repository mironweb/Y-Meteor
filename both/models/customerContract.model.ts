export interface CustomerContractModel {
    _id?: string;
    categories: categories[];
    products: products[];
    createdUserId: string;
    createdAt: Date;
    removed: boolean;
    tenantId: string;
}

interface products {
    productID: string;
    contractPrices: contractPrices[]
}

interface categories {
}

interface contractPrices {
    _id: string;
    price: number;
    effectiveDate: Date;
    minOrderQty: number;
    deleted: boolean;
    createdAt: Date;
    tenantId: string;
}

export class CustomerContract {

}
