import { CustomersMeetingsPage } from './components/meetings/customers-meetings.page';
import { CustomersDashboardPage } from './components/dashboard/customers-dashboard.page';
import { CustomersInquiryPage } from './components/inquiry/customers-inquiry.page';
import { CustomersMeetingsCreateComponent } from './components/meetings-create/customers-meetings-create.component';
import { DeleteDialog } from './components/meetings-create/customers-meetings-create.component';
import { GroupByPipe } from './group-by.pipe';
import { CustomersQuotesPage } from './components/quotes/customers-quotes.page';
import { CustomersContractsPage } from './components/contracts/customers-contracts.page';
import { CustomersContractsCopyPage } from './components/contracts/customers-contracts-copy.page';
import { CustomersContractsUpdatePage } from './components/contracts/customers-contracts-update.page';
import { CustomersQuoteReviewPage } from './components/quote-review/customers-quoteReview.page';
import { CustomersCreateQuotePage, DialogSelect } from './components/create-quote/customers-create-quote.page';
import { CustomersOrdersPage } from './components/orders/customers-orders.page';
import { CustomersOrderReviewPage } from './components/order-review/customers-orderReview.page';
import { CustomersInvoicesPage } from './components/invoices/customers-invoices.page';
import { CustomersInvoiceReviewPage } from './components/invoice-review/customers-invoiceReview.page';
import { SelectCustomerComponent } from './components/select-customer/select-customer.component';
import { CustomersMeetingsMapPage } from "./components/meetings-map/customers-meetings-map.page";
import { meetingNotesComponent } from "./components/meeting-notes/meeting-notes.component";
import {MeetingsCreateStepsComponent} from "./components/meetings-create/meetings-create-steps.component";
// import {CustomerMeetingComponent} from "./components/meeting/meeting.component";


export const CUSTOMERS_DECLARATIONS = [
  CustomersMeetingsPage,
  CustomersDashboardPage,
  CustomersInquiryPage,
  SelectCustomerComponent,
  CustomersMeetingsCreateComponent,
  GroupByPipe,
  CustomersQuotesPage,
  CustomersCreateQuotePage,
  CustomersQuoteReviewPage,
  CustomersContractsPage,
  // CustomersContractPage,
  CustomersOrdersPage,
  CustomersOrderReviewPage,
  CustomersInvoicesPage,
  CustomersInvoiceReviewPage,
  CustomersContractsCopyPage,
  CustomersContractsUpdatePage,
  DeleteDialog,
  DialogSelect,
  CustomersMeetingsMapPage,
  meetingNotesComponent,
  MeetingsCreateStepsComponent,
];

export default {
  CustomersMeetingsPage,
  CustomersDashboardPage,
  CustomersInquiryPage,
  SelectCustomerComponent,
  CustomersMeetingsCreateComponent,
  GroupByPipe,
  CustomersQuotesPage,
  CustomersCreateQuotePage,
  CustomersQuoteReviewPage,
  CustomersContractsPage,
  // CustomersContractPage,
  CustomersOrdersPage,
  CustomersOrderReviewPage,
  CustomersInvoicesPage,
  CustomersInvoiceReviewPage,
  CustomersContractsCopyPage,
  CustomersContractsUpdatePage,
  DeleteDialog,
  DialogSelect,
  CustomersMeetingsMapPage,
  meetingNotesComponent,
  MeetingsCreateStep1Component: MeetingsCreateStepsComponent

}