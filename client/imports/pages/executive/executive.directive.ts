import { Directive, ViewContainerRef} from "@angular/core";

@Directive({
  selector: '[executive-host]'
})

export class ExecutiveDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}