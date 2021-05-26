"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFileSyncRecursive = exports.getJsonStructureWithData = void 0;
const fs_1 = __importDefault(require("fs"));
// json1: one is the file with the structure we need
// json2 is the file with the up to date content for the file
// At the end the structure from json1 is kept, any objects deleted from json1 are not returned. Any objects existing in json2 are replaced in the final response
exports.getJsonStructureWithData = (structureJson, dataJson) => {
    const newJson = {};
    if (typeof structureJson === 'object') {
        Object.keys(structureJson).forEach((key) => {
            if (structureJson[key] && structureJson[key].constructor === Object) {
                newJson[key] = exports.getJsonStructureWithData(structureJson[key], dataJson[key] ? dataJson[key] : structureJson[key]);
            }
            else {
                newJson[key] = dataJson[key] ? dataJson[key] : structureJson[key];
            }
        });
        return newJson;
    }
    else {
        return dataJson;
    }
};
exports.writeFileSyncRecursive = (filename, content = '', charset = 'utf8') => __awaiter(void 0, void 0, void 0, function* () {
    // -- normalize path separator to '/' instead of path.sep,
    // -- as / works in node for Windows as well, and mixed \\ and / can appear in the path
    let filepath = filename.replace(/\\/g, '/');
    // -- preparation to allow absolute paths as well
    let root = '';
    if (filepath[0] === '/') {
        root = '/';
        filepath = filepath.slice(1);
    }
    else if (filepath[1] === ':') {
        root = filepath.slice(0, 3); // c:\
        filepath = filepath.slice(3);
    }
    // -- create folders all the way down
    const folders = filepath.split('/').slice(0, -1); // remove last item, file
    folders.reduce((acc, folder) => {
        const folderPath = acc + folder + '/';
        if (!fs_1.default.existsSync(folderPath)) {
            fs_1.default.mkdirSync(folderPath);
        }
        return folderPath;
    }, root);
    // -- write file
    if (filepath.includes('.')) {
        yield fs_1.default.writeFileSync(root + filepath, content, charset);
    }
});
