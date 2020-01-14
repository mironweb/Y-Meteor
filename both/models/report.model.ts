export interface Report {
    _id?: string;
    createdUserId: string;
    createdAt: Date;
    removed: boolean;
    tenantId: string;
}
