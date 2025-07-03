import { Injectable } from '@angular/core';
import { SystemInfo, SystemsServiceBase } from '@gms-flex/services';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BrowserObjectService {
  constructor(private readonly systemsService: SystemsServiceBase) {}

  /**
   * Resolve system ID from designation string
   *
   * Wrapper for parseSystemIdFromSystemName
   * @param systemName
   * @returns system number or error if not exists
   */
  public async getSystemIdFromSystemName(
    systemName: string
  ): Promise<number> {
    // SystemInfo[] representing all wsi systems: req'd by parseSystemIdFromSystemName
    const systemInfos: SystemInfo[] = await lastValueFrom(
      this.systemsService.getSystems()
    );

    return parseSystemIdFromSystemName(systemInfos, systemName);
  }
}

export const parseSystemIdFromSystemName = (
  systemInfos: SystemInfo[],
  nameString: string
): number => {
  const match: SystemInfo = systemInfos.find(
    sysInfo => sysInfo.Name === nameString
  );
  return match ? match.Id : -1;
};
