import { MonitorColorsUtilities, MonitorStatus, VMSMonitorWallData } from './vms.data.model';

describe('VideoManagementControlComponent', () => {

  beforeEach(() => {
  });

  describe('Test MonitorColorsUtilities class', () => {
    it('should be OK: getMonitorColor()', () => {
      expect(MonitorColorsUtilities.getMonitorColor(MonitorStatus.NotDefined) === 'grey').toBe(true);
      expect(MonitorColorsUtilities.getMonitorColor(MonitorStatus.ConnectStream) === 'green').toBe(true);
      expect(MonitorColorsUtilities.getMonitorColor(MonitorStatus.DisconnectStream) === 'black').toBe(true);
      expect(MonitorColorsUtilities.getMonitorColor(MonitorStatus.StreamNotAvailable) === 'yellow').toBe(true);
    });

    it('should be OK: getCommandColor()', () => {
      expect(MonitorColorsUtilities.getCommandColor(false, MonitorStatus.NotDefined) === 'black').toBe(true);
      expect(MonitorColorsUtilities.getCommandColor(false, MonitorStatus.ConnectStream) === 'black').toBe(true);
      expect(MonitorColorsUtilities.getCommandColor(false, MonitorStatus.DisconnectStream) === 'black').toBe(true);
      expect(MonitorColorsUtilities.getCommandColor(false, MonitorStatus.StreamNotAvailable) === 'black').toBe(true);

      expect(MonitorColorsUtilities.getCommandColor(true, MonitorStatus.NotDefined) === 'black').toBe(true);
      expect(MonitorColorsUtilities.getCommandColor(true, MonitorStatus.ConnectStream) === 'white').toBe(true);
      expect(MonitorColorsUtilities.getCommandColor(true, MonitorStatus.DisconnectStream) === 'white').toBe(true);
      expect(MonitorColorsUtilities.getCommandColor(true, MonitorStatus.StreamNotAvailable) === 'black').toBe(true);

      expect(MonitorColorsUtilities.getCommandColor(false, (10 as MonitorStatus)) === 'black').toBe(true);
      expect(MonitorColorsUtilities.getCommandColor(true, (10 as MonitorStatus)) === '').toBe(true);
    });
  });

  describe('Test VMSMonitorWallData class', () => {
    it('should be OK: constructor()', () => {
      const vmsMonitorWallData: VMSMonitorWallData = new VMSMonitorWallData();

      expect(vmsMonitorWallData.sinks === undefined).toBe(true);
      expect(vmsMonitorWallData.objectNotFound).toBe(false);
      expect(vmsMonitorWallData.videoAPINotReachable).toBe(false);
      expect(vmsMonitorWallData.videoManagerNotReachable).toBe(false);
      expect(vmsMonitorWallData.vmsNotReachable).toBe(false);
      expect(vmsMonitorWallData.vmsSynchronizing).toBe(false);
      expect(vmsMonitorWallData.maxClientsNumber).toBe(false);
      expect(vmsMonitorWallData.videoSourceErrorState === '').toBe(true);
    });
  });
});
