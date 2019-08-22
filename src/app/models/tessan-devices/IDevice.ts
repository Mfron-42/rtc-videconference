export interface IDevice {
  deviceId: string;
  name: string;
  start(...args: any[]): any;
  stop(...args: any[]): any;
}
