import { getJsonStructureWithData } from '../utilities/utilities';
import { JsonData } from '../types/types';

const structureJson: JsonData = {
    general: {
        hello: 'Hello',
        thanks: 'Thanks',
    },
    test: 'Test',
    nonExistent: 'Now Exisits',
};

const dataJson: JsonData = {
    general: {
        hello: 'Hola',
        how_are_you: 'This is deleted',
        thanks: 'Thanke',
    },
    test: 'Another test',
};

const resultJson: JsonData = {
    general: {
        hello: 'Hola',
        thanks: 'Thanke',
    },
    test: 'Another test',
    nonExistent: 'Now Exisits',
};

test('Recursive Json Update', () => {
    expect(getJsonStructureWithData(structureJson, dataJson)).toStrictEqual(resultJson);
});
