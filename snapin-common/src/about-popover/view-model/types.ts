import { TranslateService } from '@ngx-translate/core';
import { TraceService } from '@gms-flex/services-common';
import { CnsHelperService, ObjectsServiceBase, SiIconMapperService, SystemBrowserServiceBase, SystemsServiceBase } from '@gms-flex/services';
import { ObjectManagerCoreServiceBase } from '../../object-manager-core';

// All service dependencies throughout the view-model classes
export class ServiceCatalog {
  public isDistributedSystem = false;

  public constructor(
    public readonly traceService: TraceService,
    public readonly cnsHelperService: CnsHelperService,
    public readonly cnsCoreService: ObjectManagerCoreServiceBase,
    public readonly objectsService: ObjectsServiceBase,
    public readonly systemBrowserService: SystemBrowserServiceBase,
    public readonly iconMapperService: SiIconMapperService,
    public readonly systemsService: SystemsServiceBase) {

    if (!(traceService && cnsHelperService && cnsCoreService && objectsService && systemBrowserService && iconMapperService)) {
      throw new Error('Undefined service in catalog');
    }
  }

}
