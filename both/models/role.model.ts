export interface Role {
    _id?: string;
    name: string;
    createdUserId: string;
    createdAt: Date;
    removed: boolean;
    tenantId: string;
}
