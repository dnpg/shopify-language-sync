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
exports.init = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const figures_1 = __importDefault(require("figures"));
const themekit_1 = __importDefault(require("@shopify/themekit"));
const minimist_1 = __importDefault(require("minimist"));
const dotenv_1 = __importDefault(require("dotenv"));
const utilities_1 = require("./utilities/utilities");
const argv = minimist_1.default(process.argv.slice(2));
const tmpDir = './tmp';
let srcDir = './src/locales';
let destDir = './dist/locales';
exports.init = () => {
    // Load env variables
    if (argv.env) {
        dotenv_1.default.config({ path: `.env.${argv.env}` });
    }
    else {
        dotenv_1.default.config({ path: '.env' });
    }
    if (argv.srcDir) {
        srcDir = argv.srcDir;
    }
    if (argv.destDir) {
        destDir = argv.destDir;
    }
    // Create tmp dir if not exitent
    if (!fs_1.default.existsSync(tmpDir)) {
        fs_1.default.mkdirSync(tmpDir);
    }
    // To prevent a warning that the config.yml file doesn't exist
    fs_1.default.writeFileSync(`${tmpDir}/config.yml`, '');
    pullTranslations();
};
function pullTranslations() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.SLATE_PASSWORD) {
            const flags = {
                password: process.env.SLATE_PASSWORD,
                themeid: process.env.SLATE_THEME_ID,
                store: process.env.SLATE_STORE,
            };
            yield themekit_1.default
                .command('download', Object.assign({ files: ['locales/*.*'] }, flags), {
                cwd: path_1.default.join(process.cwd(), tmpDir),
            })
                .then(() => {
                console.log(chalk_1.default.yellow('\n[locales-sync] Translations downloaded.'));
                updateLocale();
            })
                // eslint-disable-next-line
                .catch((e) => {
                console.error(e);
            });
        }
        else {
            console.error(chalk_1.default.magenta('\n[locales-sync] Missing environment details\n'));
        }
    });
}
function updateLocale() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get the files as an array
            const files = yield fs_1.default.promises.readdir(`${tmpDir}/locales`);
            // Loop them all with the new for...of
            for (const file of files) {
                // Get the full paths
                const tmpFilePath = path_1.default.join(`${tmpDir}/locales`, file);
                const srcFilePath = path_1.default.join(srcDir, file);
                const distFilePath = path_1.default.join(destDir, file);
                // Load the translation that lives in Shopify containing the up to date values (This is the one the client updates from Shopify's backend).
                const rawLiveVersion = yield fs_1.default.readFileSync(tmpFilePath);
                const liveVersion = JSON.parse(rawLiveVersion.toString());
                // Load the current translation structure, we want to push this structure without overwriting any values that have been updated by the client in Shopify
                const rawNewStructure = yield fs_1.default.readFileSync(srcFilePath);
                const newStructure = JSON.parse(rawNewStructure.toString());
                // We get a new json with the structure from the translations in the src directory mapped with the current values in Shopify
                const finalResult = utilities_1.getJsonStructureWithData(newStructure, liveVersion);
                yield utilities_1.writeFileSyncRecursive(distFilePath, JSON.stringify(finalResult));
                console.log(chalk_1.default.yellow(`\n${file} Translation structure updated ${distFilePath}.`));
            } // End for...of
            console.log(chalk_1.default.magenta(`\n${figures_1.default.heart} All Translations structures updated. \n`));
        }
        catch (e) {
            // Catch anything bad that happens
            console.error("We've thrown! Whoops!", e);
        }
    });
}
