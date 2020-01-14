export interface SystemPermission {
  _id?: string;
  createdAt: Date;
  createdUserId: string;
  name: string;
  description: string;
  type: string;
  label: string;
  url: string;
  action: string;
  parentPermissionId: string;
  sequence: boolean;
}
