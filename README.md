# Web Bluetooth API Mock

[![Build Status](https://travis-ci.org/urish/web-bluetooth-mock.png?branch=master)](https://travis-ci.org/urish/web-bluetooth-mock)

Mock for the Web Bluetooth API, useful for testing code that uses Web Bluetooth.

Copyright (C) 2017, Uri Shaked. Licensed under the terms of MIT License.

## Installation

The Web Bluetooth API mock is available on npm, and can be installed by running:

    npm install --save-dev web-bluetooth-mock

## Usage example

The following code will test whether a method called `connectToDevice()`
scans for a device containing a `0xffe0` service and connects to it. 
It assumes [jest](https://facebook.github.io/jest/) testing framework, though the code
can be very easily adjusted for a different testing framework.

```javascript
import { WebBluetoothMock, DeviceMock } from './web-bluetooth.mock';

describe('connectToDevice', () => {
  it('should connect to bluetooth device', async () => {
    // Setup a Mock device and register the Web Bluetooth Mock
    const device = new DeviceMock('Dummy-Device', [0xffe0]);
    global.navigator = global.navigator || {};
    global.navigator.bluetooth = new WebBluetoothMock([device]);

    // This is a Jest specific mock, change to just `spyOn(...)` for Jasmine
    jest.spyOn(device.gatt, 'connect');

    // Calling the method we want to be tested
    await connectToDevice();

    // Checking if the function has been invoked. This also means
    // that requestDevice() has been called with a filter that matches
    // the device we defined above.
    expect(device.gatt.connect).toHaveBeenCalled();
  });
});
```

For a more complete example, check out [muse-js library tests](https://github.com/urish/muse-js/blob/master/src/muse.spec.ts).
