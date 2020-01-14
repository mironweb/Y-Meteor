export interface UserPermission {
    _id?: string;
    name: string;
    description: string;
    url: string;
    module: any[];
    parentTenantId: string;
    tenantId: string;
    removed: boolean;
    createdUserId: string;
    createdAt: Date;
}
