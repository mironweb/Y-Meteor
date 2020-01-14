export interface SystemTenantModal {
  _id?: string;
  name: string;
  logo?: string;
  scheme?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: number;
  numberOfUsers?: number;
  subDomain?: string;
  parentTenantId?: string;
  modules: string[];
  createdUserId?: string;
  createdAt?: Date;
  isRemoved?: boolean;
  isDefault?: boolean;
}

const properties = [
  "_id",
  "name",
  "logo",
  "scheme",
  "address1",
  "address2",
  "city",
  "state",
  "zipCode",
  "numberOfUsers",
  "subDomain",
  "parentTenantId",
  "modules",
  "createdUserId",
  "createdAt",
  "isRemoved",
  "isDefault"
];

export class SystemTenant {
  _id: string;
  name: string;
  logo: string;
  scheme: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: number;
  numberOfUsers: number;
  subDomain: string;
  parentTenantId: string;
  modules: string[];
  createdUserId: string;
  createdAt: Date;
  isRemoved: boolean;
  isDefault: boolean;

  constructor(systemTenant: SystemTenantModal) {
    if (systemTenant) {
      properties.forEach(property => {
        if (systemTenant[property]) {
          this[property] = systemTenant[property]
        }
      });
    }
  }
}
