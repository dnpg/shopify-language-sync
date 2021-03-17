import fs from 'fs';
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

export const writeFileSyncRecursive: (filename: string, content: string, charset: string) => void = async (
    filename,
    content = '',
    charset = 'utf8',
) => {
    // -- normalize path separator to '/' instead of path.sep,
    // -- as / works in node for Windows as well, and mixed \\ and / can appear in the path
    let filepath = filename.replace(/\\/g, '/');

    // -- preparation to allow absolute paths as well
    let root = '';
    if (filepath[0] === '/') {
        root = '/';
        filepath = filepath.slice(1);
    } else if (filepath[1] === ':') {
        root = filepath.slice(0, 3); // c:\
        filepath = filepath.slice(3);
    }

    // -- create folders all the way down
    const folders = filepath.split('/').slice(0, -1); // remove last item, file
    folders.reduce(
        (acc, folder) => {
            const folderPath = acc + folder + '/';
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }
            return folderPath;
        },
        root, // first 'acc', important
    );

    // -- write file
    if (filepath.includes('.')) {
        await fs.writeFileSync(root + filepath, content, charset);
    }
};
