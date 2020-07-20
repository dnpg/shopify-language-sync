import { JsonData, RecursiveUpdate } from '../types/types';
// json1: one is the file with the structure we need
// json2 is the file with the up to date content for the file
// At the end the structure from json1 is kept, any objects deleted from json1 are not returned. Any objects existing in json2 are replaced in the final response
export const getJsonStructureWithData: RecursiveUpdate = (structureJson, dataJson) => {
    const newJson: JsonData = {};
    if (typeof structureJson === 'object') {
        Object.keys(structureJson).forEach((key) => {
            if (structureJson[key].constructor === Object) {
                newJson[key] = getJsonStructureWithData(
                    structureJson[key] as JsonData,
                    dataJson[key] ? (dataJson[key] as JsonData) : (structureJson[key] as JsonData),
                );
            } else {
                newJson[key] = dataJson[key] ? dataJson[key] : structureJson[key];
            }
        });
        return newJson;
    } else {
        return dataJson;
    }
};
