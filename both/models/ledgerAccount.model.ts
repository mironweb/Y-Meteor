export interface LedgerAccount {
  _id?: string;
  totals: totalArray[];
  category: string;
  createdAt: Date;
  createdUserId: string;
  currentAsset: boolean;
  currentLiability: boolean;
  description: string;
  displayOnBankingBalanceCard: boolean;
  eligibleInventory: boolean;
  equity: boolean;
  includeInBorrowingBase: boolean;
  intangibleAsset: boolean;
  number: string;
  retainedEarningPriorYear: boolean;
  sageKey: string;
  status: string;
  totalAccountsReceivable: boolean;
  type: string;
  tenantId: string;
}

interface totalArray {
  year: number;
  beginningBalance: number;
  debitAmounts: [number, number, number, number, number, number, number, number, number, number, number, number];
  creditAmounts: [number, number, number, number, number, number, number, number, number, number, number, number];
  budgetDebitAmounts: [number, number, number, number, number, number, number, number, number, number, number, number];
  budgetCreditAmounts: [number, number, number, number, number, number, number, number, number, number, number, number];
}
