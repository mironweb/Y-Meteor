import {EventEmitterService} from "./EventEmitter.service";
import {ObservablesService} from "./Observables.service";
// import {GroupsPermissionsService} from "./GroupsPermissions.service";
import {GlobalVariablesService} from "./GlobalVariables.service";
import {CanActivateDashboard} from "./CanActivateDashboard";
import {CanActivateTeam} from "./CanActivateTeam";
import {DashboardRedirect} from "./DashboardRedirect";

export const SERVICE_PROVIDERS = [
  EventEmitterService,
  ObservablesService,
  // GroupsPermissionsService,
  GlobalVariablesService,
  CanActivateTeam,
  CanActivateDashboard,
  DashboardRedirect,
];

export {
  EventEmitterService,
  ObservablesService,
  // GroupsPermissionsService,
  GlobalVariablesService,
  CanActivateTeam,
  CanActivateDashboard,
  DashboardRedirect,
}