// Web Bluetooth Mock
//
// Copyright (C) 2017, Uri Shaked
// Published under the terms of the MIT license

import { EventTarget } from "event-target-shim";

export class CharacteristicMock extends EventTarget {
    public value: DataView;

    constructor(public service: PrimaryServiceMock) {
        super();
    }

    public startNotifications() {
        return Promise.resolve();
    }

    public readValue() {
        return Promise.resolve(new DataView(new Uint8Array(0)));
    }

    public writeValue() {
        return Promise.resolve();
    }
}

export class PrimaryServiceMock {
    private characteristicMocks: { [characteristic: string]: CharacteristicMock } = {};

    constructor(public device: DeviceMock) {
    }

    public getCharacteristic(characteristic: BluetoothCharacteristicUUID) {
        return Promise.resolve(this.getCharacteristicMock(characteristic));
    }

    public getCharacteristicMock(characteristic: BluetoothCharacteristicUUID) {
        if (!this.characteristicMocks[characteristic]) {
            this.characteristicMocks[characteristic] = new CharacteristicMock(this);
        }
        return this.characteristicMocks[characteristic];
    }
}

export class GattMock {
    constructor(public device: DeviceMock) {
        this.device = device;
    }

    public connect() {
        return Promise.resolve(this);
    }

    public getPrimaryService(service: BluetoothServiceUUID) {
        return Promise.resolve(this.device.getServiceMock(service));
    }
}

export class DeviceMock extends EventTarget {
    public gatt: GattMock;
    private serviceMocks: { [service: string]: PrimaryServiceMock } = {};

    constructor(public name: string, private services: BluetoothServiceUUID[]) {
        super();
        this.gatt = new GattMock(this);
    }

    public hasService(service: BluetoothServiceUUID) {
        return this.services && this.services.indexOf(service) >= 0;
    }

    public getServiceMock(service: BluetoothServiceUUID) {
        if (!this.serviceMocks[service]) {
            this.serviceMocks[service] = new PrimaryServiceMock(this);
        }
        return this.serviceMocks[service];
    }
}

export class WebBluetoothMock {
    constructor(public devices: DeviceMock[]) {

    }

    public requestDevice(options: RequestDeviceOptions) {
        for (const device of this.devices) {
            for (const filter of options.filters) {
                if (filter.name && filter.name === device.name) {
                    return Promise.resolve(device);
                }

                if (filter.namePrefix && device.name && device.name.indexOf(filter.namePrefix) === 0) {
                    return Promise.resolve(device);
                }

                if (filter.services) {
                    let found = true;
                    for (const service of filter.services) {
                        found = found && device.hasService(service);
                    }
                    if (found) {
                        return Promise.resolve(device);
                    }
                }
            }
        }
        return Promise.reject(new Error("User cancelled device chooser"));
    }
}
