export interface IDevice {
  deviceId: string;
  name: string;
  addRTCInfos(userId: string, infos: any): void;
  start(...args: any[]): any;
  stop(...args: any[]): any;
}
