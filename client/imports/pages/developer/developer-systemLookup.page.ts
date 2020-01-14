import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {NotificationsService} from 'angular2-notifications';
import {MeteorObservable} from "meteor-rxjs";

@Component({
  selector: 'developer-systemLookup',
  templateUrl: 'developer-systemLookup.page.html',
  styleUrls: [ 'developer.scss' ]
})

export class DeveloperSystemLookupPage implements OnInit{
  @Input() data: any;
  documentId: string;

  name: string;
  label: string;
  searchable: boolean;
  subscriptions: string;
  methods: string;
  dataTable: string;
  default: boolean = false;
  developer: boolean = false;

  nameInput: string;
  collectionInput: string;
  labelInput: string;
  searchableInput: boolean;
  subscriptionsInput: string;
  methodsInput: string;
  dataTableInput: string;

  dataObj: {}
  inputObj: {}

  validJsonErrorSubs: boolean = true;
  validJsonErrorMethods: boolean = true;
  validJsonErrorDataTable: boolean = true;

  editLookupForm: any;

  public options = {
    timeOut: 5000,
    lastOnBottom: true,
    clickToClose: true,
    maxLength: 0,
    maxStack: 7,
    showProgressBar: true,
    pauseOnHover: true,
    preventDuplicates: false,
    preventLastDuplicates: 'visible',
    rtl: false,
    animate: 'scale',
    position: ['right', 'bottom']
  };

  constructor(private route: ActivatedRoute, private router: Router, private _service: NotificationsService) {}
  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
     this.documentId = params['documentId'];
    });

    MeteorObservable.call('returnLookup', this.documentId).subscribe(lookupInfo => {
      if (lookupInfo !== undefined) {
        this.nameInput = lookupInfo["name"];
        this.labelInput = lookupInfo["label"];
        this.searchableInput = lookupInfo["searchable"];
        this.subscriptions = lookupInfo["subscriptions"];
        this.methods = lookupInfo["methods"];
        this.dataTable = lookupInfo["dataTable"];

        this.subscriptionsInput = JSON.stringify(this.subscriptions, undefined, 4)
        this.methodsInput = JSON.stringify(this.methods, undefined, 4)
        this.dataTableInput = JSON.stringify(this.dataTable, undefined, 4)

        this.name = this.nameInput;
        this.label = this.labelInput;
        this.searchable = this.searchableInput;
        this.subscriptions = this.subscriptionsInput;
        this.methods = this.methodsInput;
        this.dataTable = this.dataTableInput;
      }
      // MeteorObservable.call('userHasPermission', "developerPermission").subscribe(permission => {
      //   let developer = (permission === "enabled") ? true : false;
      //   this.developer = developer
      // })
    })

  }

  validJsonSubs(){
    try {
        JSON.parse(this.subscriptionsInput);
    } catch (e) {
        return this.validJsonErrorSubs = false;
    }
    return this.validJsonErrorSubs = true;
  }
  validJsonMethods(){
    try {
        JSON.parse(this.methodsInput);
    } catch (e) {
        return this.validJsonErrorMethods = false;
    }
    return this.validJsonErrorMethods = true;
  }
  validJsonDataTable(){
    try {
        JSON.parse(this.dataTableInput);
    } catch (e) {
        return this.validJsonErrorDataTable = false;
    }
    return this.validJsonErrorDataTable = true;
  }


  onBlurMethod(){
    if (this.validJsonErrorSubs && this.validJsonErrorMethods && this.validJsonErrorDataTable) {
      let nameInput = this.nameInput
      let labelInput = this.labelInput
      let searchableInput = this.searchableInput
      let subscriptionsInput = this.subscriptionsInput
      let methodsInput = this.methodsInput
      let dataTableInput = this.dataTableInput

      let subscriptions = JSON.parse(this.subscriptionsInput)
      let methods = JSON.parse(this.methodsInput)
      let dataTable = JSON.parse(this.dataTableInput)
      let inputArr = []
      let count = 0

      searchableInput = (this.searchableInput === true) ? false : true;

      this.inputObj = {
        name: this.nameInput,
        label: this.labelInput,
        searchable: searchableInput,
        subscriptions: subscriptions,
        methods: methods,
        dataTable: dataTable
      }

      for(var key in this.inputObj) {
        var value = this.inputObj[key];
        if (value !== undefined && value !== "") {
          inputArr.push(value)
        }
        count++
      }

      this.name = this.nameInput

      if (inputArr.length === count) {
        if (nameInput !== this.name || labelInput !== this.label || searchableInput !== this.searchable ||
        subscriptionsInput !== this.subscriptions || methodsInput !== this.methods || dataTableInput !== this.dataTable) {

          this._service.success(
            "System Query Updated",
            this.nameInput,
            {
              timeOut: 5000,
              showProgressBar: true,
              pauseOnHover: false,
              clickToClose: false,
              maxLength: 10
            }
          )

          MeteorObservable.call('updateDocument', 'systemLookups', this.documentId, this.inputObj).subscribe(updateLookup => {})
          MeteorObservable.call('returnLookup', this.documentId).subscribe(lookupInfo => {
            this.name = lookupInfo["name"];
            this.label = lookupInfo["label"];
            this.searchable = lookupInfo["searchable"];
            this.subscriptions = lookupInfo["subscriptions"];
            this.methods = lookupInfo["methods"];
            this.dataTable = lookupInfo["dataTable"];
          })
        }
      }
    }
  }

  deleteLookup(event) {
    // MeteorObservable.call('deleteSystemLookups', this.documentId).subscribe(deleteLookup => {})
    MeteorObservable.call('softDeleteDocument', "systemLookups", this.documentId).subscribe(groupInfo => {})

    this._service.success(
      "Lookup Removed",
      this.nameInput,
      {
        timeOut: 5000,
        showProgressBar: true,
        pauseOnHover: false,
        clickToClose: false,
        maxLength: 10
      }
    )

    this.router.navigate(['/admin/lookup/']);
  }

  onSubmit() {

  }
}
