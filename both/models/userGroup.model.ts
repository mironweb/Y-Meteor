// has default, belongs to tenantId
export interface UserGroupModel {
  _id?: string;
  name: string;
  groupPermissions: any[];
  tenants: any[];
  removed: string;
  parentTenantId: string;
  createdUserId: string;
  createdAt: Date;
  tenantId: string;
  blockedCustomers: string[];
  allowedCustomers: string[];
}

export class UserGroup {
  _id?: string;
  name: string;
  groupPermissions: any[];
  tenants: any[];
  removed: string;
  parentTenantId: string;
  createdUserId: string;
  createdAt: Date;
  tenantId: string;
  model: UserGroupModel;
  blockedCustomers: string[];
  allowedCustomers: string[];

  constructor(userGroup: UserGroupModel) {
    if (userGroup) {
      this.model = userGroup;
      properties.forEach(property => {
        if (userGroup[property]) {
          this[property] = userGroup[property];
        }
      });
    }
  }

  _getModel() {
    return this.model;
  }

}

const properties = [
  "_id",
  "name",
  "groupPermissions",
  "tenants",
  "removed",
  "parentTenantId",
  "createdUserId",
  "createdAt",
  "tenantId",
  "allowedCustomers",
  "blockedCustomers"
];