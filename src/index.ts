import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import figures from 'figures';
import themeKit from '@shopify/themekit';
import minimist from 'minimist';
import dotenv from 'dotenv';
import yaml from 'js-yaml';
import { JsonData, Init } from './types/types';
import { getJsonStructureWithData, writeFileSyncRecursive } from './utilities/utilities';
const argv = minimist(process.argv.slice(2));
const tmpDir = './tmp';
let srcDir = './src/locales';
let destDir = './dist/locales';

interface Flags {
    password?: string;
    themeid?: string;
    store?: string;
    env?: string;
}
interface ThemekitEnvConfig {
    password?: string;
    theme_id?: string;
    store?: string;
}
interface ThemeKitConfig {
    [key: string]: ThemekitEnvConfig;
}
const showError: (message: string) => void = (message) => {
    console.error(chalk.magenta(`\n[locales-sync] ${message}`));
    // throw new Error(`\n[locales-sync] ${message}`);
    process.exit(1);
};

const getConfigDetails = () => {
    if (argv.slateEnv) {
        if (fs.existsSync(argv.slateEnv)) {
            dotenv.config({ path: `${argv.slateEnv}` });
        } else {
            showError(`The Slate ${argv.slateEnv} files can't be found.`);
            return null;
        }
        if (process.env.SLATE_PASSWORD) {
            const flags: Flags = {
                password: process.env.SLATE_PASSWORD,
                themeid: process.env.SLATE_THEME_ID,
                store: process.env.SLATE_STORE,
            };
            return flags;
        } else {
            showError(`The Slate ${argv.slateEnv} file is missing the SLATE_PASSWORD.`);
            return null;
        }
    }
    if (argv.themekitConfig) {
        if (fs.existsSync(argv.themekitConfig)) {
            const fileContents = fs.readFileSync(argv.themekitConfig, 'utf8');
            const data = yaml.load(fileContents);

            if (data && typeof data === 'object') {
                const firstEnv: string = Object.keys(data)[0];
                const configData: ThemeKitConfig = data as ThemeKitConfig;
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
        if (fs.existsSync(`.env.${argv.env}`)) {
            dotenv.config({ path: `.env.${argv.env}` });
        }
    } else {
        if (fs.existsSync('.env')) {
            dotenv.config({ path: '.env' });
        }
    }
};
export const init: Init = () => {
    // Load env variables

    if (argv.srcDir) {
        srcDir = argv.srcDir;
    }
    if (argv.destDir) {
        destDir = argv.destDir;
    }

    // Create tmp dir if not exitent
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
    }
    // To prevent a warning that the config.yml file doesn't exist
    fs.writeFileSync(`${tmpDir}/config.yml`, '');
    pullTranslations();
};

async function pullTranslations(): Promise<void> {
    const flags = getConfigDetails();

    if (flags) {
        await themeKit
            .command(
                'download',
                {
                    files: ['locales/*.*'],
                    ...flags,
                },
                {
                    cwd: path.join(process.cwd(), tmpDir),
                },
            )
            .then(() => {
                console.log(chalk.yellow('\n[locales-sync] Translations downloaded.'));
                updateLocale();
            })
            // eslint-disable-next-line
            .catch((e: any) => {
                console.error(e);
                showError('Missing themekit config file.');
            });
    } else {
        showError('Missing environment details.');
    }
}

async function updateLocale(): Promise<void> {
    try {
        // Get the files as an array
        const files = await fs.promises.readdir(`${tmpDir}/locales`);
        const defaultTranslationFile = files.find((file) => {
            return file.includes('.default');
        });
        // Loop them all with the new for...of
        for (const file of files) {
            // Get the full paths
            const tmpFilePath = path.join(`${tmpDir}/locales`, file);
            let srcFilePath = path.join(srcDir, file);
            const distFilePath = path.join(destDir, file);

            // Load the translation that lives in Shopify containing the up to date values (This is the one the client updates from Shopify's backend).
            const rawLiveVersion: Buffer = await fs.readFileSync(tmpFilePath);
            const liveVersion: JsonData = JSON.parse(rawLiveVersion.toString());

            let translationExists = false;
            if (fs.existsSync(srcFilePath)) {
                translationExists = true;
            } else {
                if (defaultTranslationFile) {
                    srcFilePath = path.join(srcDir, defaultTranslationFile);
                    if (fs.existsSync(srcFilePath)) {
                        translationExists = true;
                    }
                }
            }
            if (translationExists) {
                // Load the current translation structure, we want to push this structure without overwriting any values that have been updated by the client in Shopify
                const rawNewStructure: Buffer = await fs.readFileSync(srcFilePath);
                const newStructure: JsonData = JSON.parse(rawNewStructure.toString());
                //By default we always get the shopify system owned translations
                newStructure['shopify'] = liveVersion['shopify'];

                // We get a new json with the structure from the translations in the src directory mapped with the current values in Shopify
                const finalResult: JsonData = getJsonStructureWithData(newStructure, liveVersion);
                await writeFileSyncRecursive(distFilePath, JSON.stringify(finalResult));
                console.log(chalk.green(`${file} Translation structure updated ${distFilePath}.`));
            } else {
                showError(`Can't find file ${srcFilePath}`);
            }
        } // End for...of

        console.log(chalk.magenta(`\n${figures.heart} All Translations structures updated. \n`));
    } catch (e) {
        // Catch anything bad that happens
        console.error("We've thrown! Whoops!", e);
    }
}
