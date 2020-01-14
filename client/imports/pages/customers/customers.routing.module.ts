import { NgModule }       from '@angular/core';
import { RouterModule }   from '@angular/router';
import {CustomersMeetingsPage} from "./components/meetings/customers-meetings.page";
import {CustomersContractsPage} from "./components/contracts/customers-contracts.page";
import {CustomersContractsCopyPage} from "./components/contracts/customers-contracts-copy.page";
import {CustomersQuotesPage} from "./components/quotes/customers-quotes.page";
import {CustomersCreateQuotePage} from "./components/create-quote/customers-create-quote.page";
import {CustomersQuoteReviewPage} from "./components/quote-review/customers-quoteReview.page";
import {CustomersMeetingsCreateComponent} from "./components/meetings-create/customers-meetings-create.component";
import {MeetingsCreateStepsComponent} from "./components/meetings-create/meetings-create-steps.component";
import {CustomersInquiryPage} from "./components/inquiry/customers-inquiry.page";
import {CustomersOrdersPage} from "./components/orders/customers-orders.page";
import {CustomersOrderReviewPage} from "./components/order-review/customers-orderReview.page";
import {CustomersInvoicesPage} from "./components/invoices/customers-invoices.page";
import {CustomersInvoiceReviewPage} from "./components/invoice-review/customers-invoiceReview.page";
import { CustomersMeetingsMapPage} from "./components/meetings-map/customers-meetings-map.page";

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: 'contracts', component: CustomersContractsPage },
      { path: 'contracts/copy', component: CustomersContractsCopyPage },
      { path: 'quotes', component: CustomersQuotesPage },
      { path: 'quotes/create', component: CustomersCreateQuotePage },
      { path: 'quotes/:documentId', component: CustomersQuoteReviewPage },
      {
        path: 'meetings', component: CustomersMeetingsPage,
      },
      { path: 'meetings/create', redirectTo: 'meetings/create/steps'},
      { path: 'meetings/create/steps', component: MeetingsCreateStepsComponent },
      { path: 'meetings/map', component: CustomersMeetingsMapPage },
      { path: 'meetings/:meetingId', component: MeetingsCreateStepsComponent },
      { path: 'inquiry', component: CustomersInquiryPage },
      { path: 'orders', component: CustomersOrdersPage },
      { path: 'orders/:id', component: CustomersOrderReviewPage },
      { path: 'invoices', component: CustomersInvoicesPage },
      { path: 'invoices/:id', component: CustomersInvoiceReviewPage },
      { path: "**", redirectTo: "meetings"}
    ])
  ],
  exports: [ RouterModule ] // re-export the module declarations
})
export class CustomersRoutingModule { };