import { ShippingDashboardPage } from './shipping-dashboard.page';
import { ShippingReviewPage } from './shipping-review.page';
import { ShippingCreatePage } from './shipping-create.page';
import {
  ShippingUpdatePage,
  ShippingFormDialogComponent,
} from './shipping-update.page';

export const SHIPPING_DECLARATIONS = [
  ShippingDashboardPage,
  ShippingReviewPage,
  ShippingCreatePage,
  ShippingUpdatePage,
  ShippingFormDialogComponent,
];

export const SHIPPING_ENTRY_COMPONENTS = [
  ShippingFormDialogComponent,
];

export default {
  ShippingDashboardPage,
  ShippingReviewPage,
  ShippingCreatePage,
  ShippingUpdatePage,
  ShippingFormDialogComponent,
};
