export interface Device {
  id: string;
  name: string;
}

export interface User {
  userId: string;
  organisationId: string;
  availableDevices: Device[];
}

export interface DeviceConference {
  users: User[];
  activeDevices: UserDevice[];
}

export interface UserDevice extends Device {
  userId: string;
}
