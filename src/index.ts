// Web Bluetooth Mock
//
// Copyright (C) 2017, Uri Shaked
// Published under the terms of the MIT license

import { EventTarget } from "event-target-shim";

function leftPad(s: string, count: number, pad: string) {
    while (s.length < count) {
        s = pad + s;
    }
    return s;
}

function normalizeUuid(service: BluetoothServiceUUID): string {
    if (typeof service === "number" && service > 0) {
        return `${leftPad(service.toString(16), 8, "0")}-0000-1000-8000-00805f9b34fb`;
    } else {
        // TODO: handle standard UUID names, throw exception on invalid values
        return service.toString();
    }
}

export class CharacteristicMock extends EventTarget implements BluetoothRemoteGATTCharacteristic {
    public value: DataView;
    public properties = {
        authenticatedSignedWrites: false,
        broadcast: false,
        indicate: false,
        notify: false,
        read: false,
        reliableWrite: false,
        writableAuxiliaries: false,
        write: false,
        writeWithoutResponse: false,
    };

    public oncharacteristicvaluechanged: (e: Event) => void;

    constructor(public service: PrimaryServiceMock, public uuid: string) {
        super();
        this.value = new DataView(new Uint8Array(0).buffer);
    }

    public startNotifications(): Promise<BluetoothRemoteGATTCharacteristic> {
        return Promise.resolve(this);
    }

    public stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic> {
        return Promise.resolve(this);
    }

    public readValue() {
        return Promise.resolve(this.value);
    }

    public writeValue() {
        return Promise.resolve();
    }

    public getDescriptor() {
        return Promise.reject(new Error("Not implemented"));
    }

    public getDescriptors() {
        return Promise.reject(new Error("Not implemented"));
    }
}

export class PrimaryServiceMock extends EventTarget implements BluetoothRemoteGATTService {
    public oncharacteristicvaluechanged: (e: Event) => void;
    public onserviceadded: (e: Event) => void;
    public onservicechanged: (e: Event) => void;
    public onserviceremoved: (e: Event) => void;

    private characteristicMocks: { [characteristic: string]: CharacteristicMock } = {};

    constructor(public device: DeviceMock, public uuid: string, public isPrimary = true) {
        super();
    }

    public getCharacteristic(characteristic: BluetoothCharacteristicUUID) {
        return Promise.resolve(this.getCharacteristicMock(characteristic));
    }

    public getCharacteristics() {
        return Promise.resolve(Object.keys(this.characteristicMocks)
            .map((k) => this.characteristicMocks[k]));
    }

    public getIncludedService() {
        return Promise.reject(new Error("Not implemented"));
    }

    public getIncludedServices() {
        return Promise.resolve([]);
    }

    public getCharacteristicMock(characteristic: BluetoothCharacteristicUUID) {
        if (!this.characteristicMocks[characteristic]) {
            this.characteristicMocks[characteristic] = new CharacteristicMock(this, normalizeUuid(characteristic));
        }
        return this.characteristicMocks[characteristic];
    }
}

export class GattMock extends EventTarget implements BluetoothRemoteGATTServer {
    public connected = false;

    constructor(public device: DeviceMock) {
        super();
        this.device = device;
    }

    public connect() {
        this.connected = true;
        return Promise.resolve(this);
    }

    public disconnect() {
        this.connected = false;
    }

    public getPrimaryService(service: BluetoothServiceUUID) {
        return Promise.resolve(this.device.getServiceMock(service));
    }

    public getPrimaryServices(service?: BluetoothServiceUUID) {
        if (service) {
            this.device.getServiceMock(service);
        }

        return Promise.resolve(this.device.getServiceMocks());
    }
}

export class DeviceMock extends EventTarget implements BluetoothDevice {
    public watchingAdvertisements = false;
    public gatt: GattMock;
    public id = "";

    public ongattserverdisconnected: (E: Event) => void;
    public oncharacteristicvaluechanged: (E: Event) => void;
    public onserviceadded: (E: Event) => void;
    public onservicechanged: (E: Event) => void;
    public onserviceremoved: (E: Event) => void;

    private serviceMocks: { [service: string]: PrimaryServiceMock } = {};

    constructor(public name: string, private services: BluetoothServiceUUID[]) {
        super();
        this.gatt = new GattMock(this);
    }

    public hasService(service: BluetoothServiceUUID) {
        return this.services && this.services.indexOf(service) >= 0;
    }

    public getServiceMock(service: BluetoothServiceUUID): BluetoothRemoteGATTService {
        if (!this.serviceMocks[service]) {
            this.serviceMocks[service] = new PrimaryServiceMock(this, normalizeUuid(service));
        }
        return this.serviceMocks[service];
    }

    public getServiceMocks(): BluetoothRemoteGATTService[] {
        return Object.keys(this.serviceMocks).map((k) => this.serviceMocks[k]);
    }

    public watchAdvertisements() {
        this.watchingAdvertisements = true;
        return Promise.resolve();
    }

    public unwatchAdvertisements() {
        this.watchingAdvertisements = false;
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
