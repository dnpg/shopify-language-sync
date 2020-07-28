"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utilities_1 = require("../utilities/utilities");
const structureJson = {
    general: {
        hello: 'Hello',
        thanks: 'Thanks',
    },
    test: 'Test',
    nonExistent: 'Now Exisits',
};
const dataJson = {
    general: {
        hello: 'Hola',
        how_are_you: 'This is deleted',
        thanks: 'Thanke',
    },
    test: 'Another test',
};
const resultJson = {
    general: {
        hello: 'Hola',
        thanks: 'Thanke',
    },
    test: 'Another test',
    nonExistent: 'Now Exisits',
};
test('Recursive Json Update', () => {
    expect(utilities_1.getJsonStructureWithData(structureJson, dataJson)).toStrictEqual(resultJson);
});
