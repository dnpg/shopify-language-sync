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
const js_yaml_1 = __importDefault(require("js-yaml"));
const utilities_1 = require("./utilities/utilities");
const argv = minimist_1.default(process.argv.slice(2));
const tmpDir = './tmp';
let srcDir = './src/locales';
let destDir = './dist/locales';
const showError = (message) => {
    console.error(chalk_1.default.magenta(`\n[locales-sync] ${message}`));
    // throw new Error(`\n[locales-sync] ${message}`);
    process.exit(1);
};
const getConfigDetails = () => {
    if (argv.slateEnv) {
        if (fs_1.default.existsSync(argv.slateEnv)) {
            dotenv_1.default.config({ path: `${argv.slateEnv}` });
        }
        else {
            showError(`The Slate ${argv.slateEnv} files can't be found.`);
            return null;
        }
        if (process.env.SLATE_PASSWORD) {
            const flags = {
                password: process.env.SLATE_PASSWORD,
                themeid: process.env.SLATE_THEME_ID,
                store: process.env.SLATE_STORE,
            };
            return flags;
        }
        else {
            showError(`The Slate ${argv.slateEnv} file is missing the SLATE_PASSWORD.`);
            return null;
        }
    }
    if (argv.themekitConfig) {
        if (fs_1.default.existsSync(argv.themekitConfig)) {
            const fileContents = fs_1.default.readFileSync(argv.themekitConfig, 'utf8');
            const data = js_yaml_1.default.load(fileContents);
            if (data && typeof data === 'object') {
                const firstEnv = Object.keys(data)[0];
                const configData = data;
                return {
                    password: configData[firstEnv].password,
                    themeid: configData[firstEnv].theme_id,
                    store: configData[firstEnv].store,
                };
            }
            return null;
        }
        showError('Missing themekit config file.');
        return null;
    }
    if (argv.env) {
        if (fs_1.default.existsSync(`.env.${argv.env}`)) {
            dotenv_1.default.config({ path: `.env.${argv.env}` });
        }
    }
    else {
        if (fs_1.default.existsSync('.env')) {
            dotenv_1.default.config({ path: '.env' });
        }
    }
};
exports.init = () => {
    // Load env variables
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
        const flags = getConfigDetails();
        if (flags) {
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
                showError('Missing themekit config file.');
            });
        }
        else {
            showError('Missing environment details.');
        }
    });
}
function updateLocale() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get the files as an array
            const files = yield fs_1.default.promises.readdir(`${tmpDir}/locales`);
            const defaultTranslationFile = files.find((file) => {
                return file.includes('.default');
            });
            // Loop them all with the new for...of
            for (const file of files) {
                // Get the full paths
                const tmpFilePath = path_1.default.join(`${tmpDir}/locales`, file);
                let srcFilePath = path_1.default.join(srcDir, file);
                const distFilePath = path_1.default.join(destDir, file);
                // Load the translation that lives in Shopify containing the up to date values (This is the one the client updates from Shopify's backend).
                const rawLiveVersion = yield fs_1.default.readFileSync(tmpFilePath);
                const liveVersion = JSON.parse(rawLiveVersion.toString());
                let translationExists = false;
                if (fs_1.default.existsSync(srcFilePath)) {
                    translationExists = true;
                }
                else {
                    if (defaultTranslationFile) {
                        srcFilePath = path_1.default.join(srcDir, defaultTranslationFile);
                        if (fs_1.default.existsSync(srcFilePath)) {
                            translationExists = true;
                        }
                    }
                }
                if (translationExists) {
                    // Load the current translation structure, we want to push this structure without overwriting any values that have been updated by the client in Shopify
                    const rawNewStructure = yield fs_1.default.readFileSync(srcFilePath);
                    const newStructure = JSON.parse(rawNewStructure.toString());
                    //By default we always get the shopify system owned translations
                    newStructure['shopify'] = liveVersion['shopify'];
                    // We get a new json with the structure from the translations in the src directory mapped with the current values in Shopify
                    const finalResult = utilities_1.getJsonStructureWithData(newStructure, liveVersion);
                    yield utilities_1.writeFileSyncRecursive(distFilePath, JSON.stringify(finalResult));
                    console.log(chalk_1.default.green(`${file} Translation structure updated ${distFilePath}.`));
                }
                else {
                    showError(`Can't find file ${srcFilePath}`);
                }
            } // End for...of
            console.log(chalk_1.default.magenta(`\n${figures_1.default.heart} All Translations structures updated. \n`));
        }
        catch (e) {
            // Catch anything bad that happens
            console.error("We've thrown! Whoops!", e);
        }
    });
}
