import {Component, Input, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {MeteorObservable} from 'meteor-rxjs';

@Component({
  selector: 'group-permission-form',
  templateUrl: 'group-permission-form.component.html',
  styleUrls: ['group-permission-form.component.scss'],
})
export class GroupPermissionFormComponent {
  @Input() groupId: string;
  @Input() permissionId: string;
  permission: any = {};

  visibleProperties = [
    { value: 'name', viewValue: 'Name' },
    { value: 'description', viewValue: 'Description' },
    { value: 'type', viewValue: 'Type' },
  ];

  status = [
    { value: 'enabled', viewValue: 'Enabled' },
    { value: 'disabled', viewValue: 'Disabled' },
    { value: '', viewValue: 'Not Configured' },
  ];

  constructor(public dialog: MatDialog) {}

  ngOnChanges() {
    this.loadPermission();
  }

  loadPermission() {
    this.permission = {};

    if (this.groupId && this.permissionId) {
      MeteorObservable.call('findOne', 'systemPermissions', {
        _id: this.permissionId,
      }).subscribe((data: any) => {
        this.permission = data || {};

        MeteorObservable.call('findOne', 'userGroups', {
          _id: this.groupId,
        }).subscribe((data: any) => {
          const userGroup = data || {};
          const groupPermissions = userGroup.groupPermissions || [];
          const groupPermission = groupPermissions.filter((item) => {
            return item._id === this.permissionId;
          });
          if (groupPermission.length) {
            this.permission.status = groupPermission[0].value;
          } else {
            this.permission.status = '';
          }
        });
      });
    }
  }

  savePermission() {
    const query = {
      _id: this.groupId,
      'groupPermissions._id': this.permissionId,
    };
    MeteorObservable.call('findOne', 'userGroups', query)
    .subscribe((result: any) => {
      if (!result) {
        this.insertGroupPermission();
      } else {
        this.updateGroupPermission();
      }
    });
  }

  insertGroupPermission() {
    const query = {
      _id: this.groupId,
    };
    const update = {
      $addToSet: {
        groupPermissions: {
          _id: this.permissionId,
          value: this.permission.status,
        },
      },
    };
    MeteorObservable.call('update', 'userGroups', query, update)
    .subscribe((result: any) => {
      this.openDialog({
        title: 'Saving Group Permission',
        content: 'Permission successfully saved.',
      }, () => {
        // success
      });
    });
  }

  updateGroupPermission() {
    const query = {
      _id: this.groupId,
      'groupPermissions._id': this.permissionId,
    };
    const update = {
      $set: { 'groupPermissions.$.value': this.permission.status },
    };
    MeteorObservable.call('update', 'userGroups', query, update)
    .subscribe((result: any) => {
      this.openDialog({
        title: 'Saving Group Permission',
        content: 'Permission successfully saved.',
      }, () => {
        // success
      });
    });
  }

  openDialog(data, callback): void {
    const options = { width: '300px', data };
    const dialogRef = this.dialog.open(GroupPermissionFormDialogComponent, options);
    if (callback) {
      dialogRef.afterClosed().subscribe(callback);
    }
  }
}

@Component({
  selector: 'group-permission-form-dialog',
  template: `
    <h1 mat-dialog-title>{{data.title}}</h1>
    <div mat-dialog-content><p>{{data.content}}</p></div>
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
export class GroupPermissionFormDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<GroupPermissionFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
