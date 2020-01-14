import {Component, Input, Inject, EventEmitter, Output} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {MeteorObservable} from 'meteor-rxjs';
import {Session} from 'meteor/session';
import {Meteor} from 'meteor/meteor';

@Component({
  selector: 'permission-form',
  templateUrl: 'permission-form.component.html',
  styleUrls: ['permission-form.component.scss'],
})
export class PermissionFormComponent {
  @Input() permissionId: string;
  @Output() action = new EventEmitter<any>();
  permission: any = {};

  visibleProperties = [
    '_id',
    'name',
    'description',
    'type',
    'label',
    'url',
    'action',
    'parentPermissionId',
    'sequence',
  ];

  types = [
    { value: 'module', viewValue: 'module' },
    { value: 'sideNav', viewValue: 'sideNav' },
    { value: 'buttonGroup', viewValue: 'buttonGroup' },
    { value: 'button', viewValue: 'button' },
    { value: 'display', viewValue: 'display' },
  ];

  constructor(public dialog: MatDialog) {}

  ngOnChanges() {
    this.loadPermission();
  }

  loadPermission() {
    this.permission = {};

    if (this.permissionId) {
      MeteorObservable.call('findOne', 'systemPermissions', {
        _id: this.permissionId,
      }).subscribe((data:any) => {
        this.permission = data;
      });
    }
  }

  // backend validation for uniqueness of name and url
  validatePermission(callback) {
    const { name, url } = this.permission;

    const query = {};
    MeteorObservable.call('find', 'systemPermissions', query)
    .subscribe((permissions: any) => {
      const errors = [];
      // remove current selected permission
      const otherPermissions = permissions.filter(
        doc => doc._id !== this.permission._id
      );
      if (otherPermissions.filter(doc => doc.name === name).length) {
        errors.push('Name is already taken');
      }
      if (otherPermissions.filter(doc => doc.url === url).length) {
        errors.push('URL is already taken');
      }

      if (errors.length) {
        return callback(errors);
      } else {
        return callback(null);
      }
    });
  }

  savePermission() {
    this.validatePermission((errors) => {
      if (errors) {
        this.openDialog({
          title: 'Saving Permission',
          content: `
            Please fix the following:
            <ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>
          `,
        }, () => {});
        return;
      }

      if (!this.permission._id) {
        this.insertPermission();
      } else {
        this.updatePermission();
      }
    });
  }

  insertPermission() {
    const data: any = {
      tenantId: Session.get('tenantId'),
      parentTenantId: Session.get('parentTenantId'),
    };
    this.visibleProperties.forEach((propertyName) => {
      data[propertyName] = this.permission[propertyName];
    });

    MeteorObservable.call('insert', 'systemPermissions', data)
    .subscribe((result: any) => {
      this.openDialog({
        title: 'Saving Permission',
        content: 'Permission successfully created.',
      }, () => {
        this.permission._id = result;
        this.action.emit({
          type: 'insert',
          data: this.permission,
        });
        this.permission = {};
      });
    });
  }

  updatePermission() {
    const data: any = {
      updatedUserId: Meteor.userId(),
      updatedDate: new Date(),
    };
    this.visibleProperties.forEach((propertyName) => {
      data[propertyName] = this.permission[propertyName];
    });
    delete data._id;

    const query = { _id: this.permission._id };
    MeteorObservable.call('update', 'systemPermissions', query, { $set: data })
    .subscribe((result: any) => {
      this.openDialog({
        title: 'Saving Permission',
        content: 'Permission successfully updated.',
      }, () => {
        this.action.emit({
          type: 'update',
          data: this.permission,
        });
        this.permission = {};
      });
    });
  }

  removePermission() {
    this.openDialog({
      title: 'Removing Permission',
      content: 'Are you sure you want to remove this permission?',
      type: 'confirm',
    }, (result) => {
      if (result !== 'yes') return;

      // check if the node has children
      const findOneQuery = { parentPermissionId: this.permission._id };
      MeteorObservable.call('findOne', 'systemPermissions', findOneQuery)
      .subscribe((result: any) => {
        if (result) {
          this.openDialog({
            title: 'Removing Permission',
            content: 'Permission with children cannot be removed.',
          }, () => {});
          return;
        }

        // delete the leaf node
        const query = { _id: this.permission._id };
        const update = { $set: { removed: true } };
        MeteorObservable.call('update', 'systemPermissions', query, update)
        .subscribe((result: any) => {
          this.removeGroupPermission()
          .subscribe((result: any) => {
            this.openDialog({
              title: 'Removing Permission',
              content: 'Permission successfully removed.',
            }, () => {
              this.action.emit({
                type: 'remove',
                data: this.permission,
              });
              this.permission = {};
            });
          });
        });
      });
    });
  }

  removeGroupPermission() {
    const query = {};
    const update = {
      $pull: {
        groupPermissions: { _id: this.permission._id },
      },
    };
    const options = { multi: true };
    return MeteorObservable.call(
      'update',
      'userGroups',
      query,
      update,
      options
    );
  }

  openDialog(data, callback): void {
    const options = { width: '300px', data };
    const dialogRef = this.dialog.open(PermissionFormDialogComponent, options);
    if (callback) {
      dialogRef.afterClosed().subscribe(callback);
    }
  }
}

@Component({
  selector: 'permission-form-dialog',
  template: `
    <h1 mat-dialog-title>{{data.title}}</h1>
    <div mat-dialog-content><p [innerHTML]="data.content"></p></div>
    <div mat-dialog-actions>
      <button mat-raised-button color="primary" [mat-dialog-close]="'ok'"
        cdkFocusInitial *ngIf="data.type !== 'confirm'">
        OK
      </button>
      <button mat-raised-button color="primary" [mat-dialog-close]="'yes'"
        cdkFocusInitial *ngIf="data.type === 'confirm'">
        YES
      </button>
      <button mat-raised-button [mat-dialog-close]="'no'"
        cdkFocusInitial *ngIf="data.type === 'confirm'">
        NO
      </button>
    </div>
  `,
  styles: [`
    h1 {
      margin-bottom: 0;
    }
  `],
})
export class PermissionFormDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PermissionFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
