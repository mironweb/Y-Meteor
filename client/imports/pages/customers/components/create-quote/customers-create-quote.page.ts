import {Component, ViewChild} from '@angular/core';
import {MatSnackBar} from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { NewCustomerQuote } from '../../../../../../both/models/customerQuote.model';
import { MeteorObservable } from "meteor-rxjs";
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { map, switchMap, tap} from "rxjs/operators";
import {UserService} from "../../../../services/UserService";
import { variable } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'customers-quote',
  templateUrl: 'customers-create-quote.page.html',
  styleUrls: ['../customers.scss'],
})

export class CustomersCreateQuotePage {

  @ViewChild('selectCategory') selectCategory;

  constructor(
    public snackBar: MatSnackBar,
    private _fb: FormBuilder, 
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private _service: NotificationsService,
    private _userService: UserService
  ) {}



  customersLookupData:any = {};
  quoteForm: FormGroup;
  filterConditions: any;
  customerQuote: any;
  test: any;
  quoteAlertInfo: any = {};
  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true,
    gt: new Date(),
    customerId: ''
  };
  selectedCustomer: string;
  selectedCategory: string;

  customerName: string;
  categoryName: string;

  products: any[] = [];
  email: any[] = [];
  disableSubmit: boolean = true;
  state:any = {
    isSingleDocumentShown: false,
    isMainContentShown: true,
    isCustomersListShown: false,
    isCategoriesListShown: false,
    doc: {},
    newQuotePriceTag: '',
    quotePriceTag: 'price'
  }

  ngOnInit() {
    this._userService.user._getManagedUsers$()
      .pipe(
        map((users:any) => users.map(_user => _user._id)),
      tap((res) => {
        this.customersLookupData = {
          manageUserIds: res
        };
      }),
        switchMap(() => this.route.queryParams),
        tap((params) => {
          console.log(this.data);
          if (params.customerId) {
            this.data.customerId = null;
            this.getCustomer({ value: { _id: params.customerId } })
          }
          if (params.categoryId) {
            this.data.categoryId = null;
            this.getCategory({ value: { _id: params.categoryId } })
        }
        }),
      )
      .subscribe();

    const newQuote = new NewCustomerQuote();

    this.customerQuote = this._fb.group({
      customerId: ['', <any>Validators],
      customerDisplay: ['', <any>Validators],
      categoryId: ['', <any>Validators],
      products: [[], <any>Validators],
      categoryDisplay: ['', <any>Validators],
      notes: ['', <any>Validators],
      status: [newQuote.status, <any>Validators],
      createdUserId: [newQuote.createdUserId, <any>Validators],
      createdAt: [newQuote.createdAt, <any>Validators],
      tenantId: [Session.get('tenantId'), <any>Validators],
    });

    MeteorObservable.call('findOne', 'systemAlerts', { name: 'submittingQuote'}).subscribe(quoteAlert => {
      this.quoteAlertInfo = quoteAlert;
    })

    MeteorObservable.call('returnUser', Meteor.userId()).subscribe(user => {
      this.email = user["emails"][0].address;
    })
  }

  onSelect(event) {
    if (event.name === 'levelSelect' || event.name === 'overrideSelect' || event.name === 'clearRow') {
      event = event.value;
      console.log(event);
      this.products = this.products.filter(function (product) {
        return product.productId !== event.row._id;
      });
      if (event.row['newHighlightFieldName']) {
        this.products.push(
          {
            name: event.row.product,
            price: Number((event.row[event.row['newHighlightFieldName']]).toFixed(2)),
            previousPrice: Number((event.row.price).toFixed(2)),
            productId: event.row._id,
            description: event.row.description
          }
        )
      } else {

      }
      console.log(this.products);
      this.disableSubmit = (this.products.length <= 0);
  }
  }

  submitQuote(){
    const quoteValue = this.customerQuote.value;
    let productArr = this.products.map(function (product) {
        return { 
          price: new Decimal(product.price),
          previousPrice: new Decimal(product.previousPrice),
          productId: product.productId,
        }
      });
    let emailData = {};
    let variables = {
      logo: 'https://app.yibas.com/img/Global-White.png',
      Customer: quoteValue.customerDisplay,
      ProductLine: quoteValue.categoryDisplay,
      SalesPerson: Meteor.user().profile.firstName + ' ' + Meteor.user().profile.lastName,
      QuoteNotes: quoteValue.notes,
      Products: this.products
    };
    this.customerQuote.patchValue({
      products: productArr
    });

    delete this.customerQuote.value.customerDisplay;
    delete this.customerQuote.value.categoryDisplay;

    let quoteObj = this.customerQuote.value;

    MeteorObservable.call('insert', 'customerQuotes', quoteObj).subscribe((res:any) => {
      variables['quoteId'] = res;
      this._service.success(
        "New Quote Added",
        "",
        {
          timeOut: 5000,
          showProgressBar: true,
          pauseOnHover: false,
          clickToClose: false,
          maxLength: 10
        }
      )
      emailData['to'] = this.email;
      emailData['from'] = this.quoteAlertInfo.email.from;
      emailData['bcc'] = this.quoteAlertInfo.email.bcc;
      emailData['subject'] = this.quoteAlertInfo.email.subject;
      if (!Meteor.settings.public.isProduction) {
        emailData['bcc'] = this.quoteAlertInfo.email.temp
      }
      MeteorObservable.call('sendEmail', emailData, 'html-submitQuote.html', variables).subscribe(quote => {})
      this.resetQuoteForm();
      this.router.navigate(['customers/quotes']).catch(error => console.log(error));
    });
  }

  resetQuoteForm(){
    this.products = [];
    let quoteObj = this.customerQuote.value;
    this.disableSubmit = (this.products.length <= 0);

    this.categoryName = null;
    this.data.categoryId = null;
    this.customerQuote.patchValue({
      products: [],
      categoryDisplay: '',
      categoryId: '',
      notes: '',
    });

  }

  showCustomersList() {
    let newState = {
      isCustomersListShown: true,
      isMainContentShown: false
    };

    Object.assign(this.state, newState);
  }

  showCategoriesList () {
    if (this.products.length > 0) {
      this.openDialog();
    } else {
      let newState = {
        isCategoriesListShown: true,
        isMainContentShown: false
      };
  
      Object.assign(this.state, newState);
    }
  }

  showMainContent() {
    let newState = {
      isSingleDocumentShown: false,
      isCustomersListShown: false,
      isCategoriesListShown: false,
      isMainContentShown: true,
      newQuotePriceTag: ''
    };

    Object.assign(this.state, newState);
  }

  clickCategory(event){
    this.router.navigate([], {
      queryParams: {
        ...{
          categoryId: event.value._id
        }
      }, queryParamsHandling: 'merge'
    })
  }
  clickCustomer(event){
    this.router.navigate([], {
      queryParams: {
        ...{
          customerId: event.value._id
        }
      }, queryParamsHandling: 'merge'
    })
  }
  getCategory(event) {
    let category = event.value;
    this.showMainContent();
    if (category) {
      MeteorObservable.call('findOne', 'categories', {
        _id: category._id
      }).subscribe((category: any) => {
        this.categoryName = category.name;
        this.customerQuote.patchValue({
          categoryDisplay: category.name + " - " + category.description,
        });
  
        this.selectedCategory = category._id;
        this.data = {
          customerId: this.selectedCustomer,
          categoryId: this.selectedCategory
        };
        this.customerQuote.patchValue({
          categoryId: category._id
        });
      })
    }
  }

  getCustomer(event) {
    this.showMainContent();
    let customer = event.value;
    if (customer) {
      MeteorObservable.call('findOne', 'customers', {
        _id: customer._id
      }).subscribe((customer:any) => {
        this.customerName = customer.name;
        this.customerQuote.patchValue({
          customerDisplay: customer.number + " - " + customer.name,
        });
        this.selectedCustomer = customer["_id"];
        this.data = {
          customerId: this.selectedCustomer,
          categoryId: this.selectedCategory
        };
        this.customerQuote.patchValue({
          customerId: customer["_id"]
        });
      })
    }
  }

  onMobileClick(doc) {
    let newState = {
      isMainContentShown: false,
      isSingleDocumentShown: true,
      doc
    };

    Object.assign(this.state, newState);

    this.quoteForm = this._fb.group({
      product: [doc.product, <any>Validators.required],
      description: [doc.description],
      price: [doc.price, <any>Validators.min(0)],
      override: [doc.override, <any>Validators.min(0)],
      level1: [Number((doc.level1).toFixed(2))],
      level2: [Number((doc.level2).toFixed(2))],
      level3: [Number((doc.level3).toFixed(2))],
    });
    if (this.products.length > 0) {
      let docIndex = this.products.findIndex(product => {
        return product.productId == doc._id;
      });
      if (docIndex > -1) {
        this.state.newQuotePriceTag = this.products[docIndex].priceTag;
      }
    }
  }

  setQuotePrice(priceTag) {
    this.state.newQuotePriceTag = priceTag;
  }

  saveQuotePrice() {

    let event:any = [];
    let obj:any = {};

    Object.assign(obj, this.state.doc);
    obj.highlightFieldName = this.state.newQuotePriceTag;
    obj.selectedLevelPrice = Number(this.state.doc[this.state.newQuotePriceTag].toFixed(2));

    event.push(obj);

    for (let i = 0; i < event.length; i++) {
      this.products = this.products.filter(function (product) {
        return product.productId !== event[i]._id;
      });
      if (event[i].selectedLevelPrice !== null && event[i].selectedLevelPrice !== undefined) {
        this.products.push(
          {
            name: event[i].product,
            price: event[i].selectedLevelPrice,
            previousPrice: event[i].price,
            productId: event[i]._id,
            description: event[i].description,
            priceTag: this.state.newQuotePriceTag
          }
        )
      }
    }
    this.disableSubmit = (this.products.length <= 0);

  }
  openDialog(): void {
    let dialogRef = this.dialog.open(DialogSelect, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        switch (result) {
          case 'submit':
            this.submitQuote();
            break;
          case 'newProductLine':
            this.resetQuoteForm();
            this.showCategoriesList();
            break;
          case 'goBack':
            this.showMainContent();
            break;
          default:
            
        }
      }
    });
  }
}

@Component({
  selector: 'dialog-Select',
  template: `<h1 mat-dialog-title>Warning</h1>
    <div mat-dialog-content>It looks like you started a quote. What would you like to do?</div>
      <div mat-dialog-actions>
      <button mat-button (click)="dialogRef.close('submit')">Submit Current Quote</button>
      <button mat-button (click)="dialogRef.close('newProductLine')">Start New Quote</button>
        <button mat-button (click)="dialogRef.close('goBack')">Go Back</button></div>`,
})
export class DialogSelect {
  constructor(public dialogRef: MatDialogRef<DialogSelect>) { }

  click(result): void {
    this.dialogRef.close(result);
  }

}