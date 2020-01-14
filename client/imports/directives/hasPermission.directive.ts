import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  ElementRef,
  OnInit,
  Attribute
} from '@angular/core';
import { UserService } from '../../imports/services/UserService';

@Directive({
  selector: '[hasPermission]'
})
export class HasPermissionDirective implements OnInit {
  private currentUser;
  private permissions = [];
  private logicalOp = 'AND';
  private isHidden = true;

  constructor(
    private element: ElementRef,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private userService: UserService
  ) {

  }

  ngOnInit() {
    this.currentUser = this.userService.currentUser;
    this.updateView();
  }

  @Input()
  set hasPermission(val) {
    this.permissions = val;
    this.updateView();
  }

  @Input()
  set hasPermissionOp(permop) {
    this.logicalOp = permop;
    this.updateView();
  }

  private async updateView() {
    let check = await this.checkPermission();
    if (check) {
      if(this.isHidden) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isHidden = false;
      }
    } else {
      this.isHidden = true;
      this.viewContainer.clear();
    }
  }

  private async checkPermission() {
    // let hasPermission1 = false;
    // let hasPermission2 = false;
    let hasPermission = false;
    if (this.currentUser) {
      // hasPermission1 = await this.userService.user._checkPermission(this.permissions[0]);
      // hasPermission2 = await this.userService.user._checkPermission(this.permissions[1]);

      for (const checkPermission of this.permissions) {
        const permissionFound = await this.userService.user._checkPermission(checkPermission);
        // console.log(checkPermission, permissionFound)
        if (permissionFound) {
          hasPermission = true;

          if (this.logicalOp === 'OR') {
            break;
          }
        } else {
          hasPermission = false;
          if (this.logicalOp === 'AND') {
            break;
          }
        }
      }

      // for (const checkPermission of this.permissions) {
      //   const permissionFound = this.currentUser.permissions.find(x => x.toUpperCase() === checkPermission.toUpperCase());

      // if (hasPermission1) {
      //     hasPermission = true;

      //     if (this.logicalOp === 'OR') {
      //       break;
      //     }
      //   } else {
      //     hasPermission = false;
      //     if (this.logicalOp === 'AND') {
      //       break;
      //     }
      //   }
      // }
    return hasPermission;
  }
}
