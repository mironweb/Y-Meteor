import { MongoObservable } from "meteor-rxjs";
import { PaymentApprovalModel } from '../models/paymentApprovals.model';

export const PaymentApprovals = new MongoObservable.Collection<PaymentApprovalModel>('paymentApprovals');