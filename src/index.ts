import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import figures from 'figures';
import themeKit from '@shopify/themekit';
import minimist from 'minimist';
import dotenv from 'dotenv';
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

export const init: Init = () => {
    // Load env variables
    if (argv.env) {
        dotenv.config({ path: `.env.${argv.env}` });
    } else {
        dotenv.config({ path: '.env' });
    }

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
    if (process.env.SLATE_PASSWORD) {
        const flags: Flags = {
            password: process.env.SLATE_PASSWORD,
            themeid: process.env.SLATE_THEME_ID,
            store: process.env.SLATE_STORE,
        };

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
            });
    } else {
        console.error(chalk.magenta('\n[locales-sync] Missing environment details\n'));
    }
}

async function updateLocale(): Promise<void> {
    try {
        // Get the files as an array
        const files = await fs.promises.readdir(`${tmpDir}/locales`);

        // Loop them all with the new for...of
        for (const file of files) {
            // Get the full paths
            const tmpFilePath = path.join(`${tmpDir}/locales`, file);
            const srcFilePath = path.join(srcDir, file);
            const distFilePath = path.join(destDir, file);

            // Load the translation that lives in Shopify containing the up to date values (This is the one the client updates from Shopify's backend).
            const rawLiveVersion: Buffer = await fs.readFileSync(tmpFilePath);
            const liveVersion: JsonData = JSON.parse(rawLiveVersion.toString());

            // Load the current translation structure, we want to push this structure without overwriting any values that have been updated by the client in Shopify
            const rawNewStructure: Buffer = await fs.readFileSync(srcFilePath);
            const newStructure: JsonData = JSON.parse(rawNewStructure.toString());

            // We get a new json with the structure from the translations in the src directory mapped with the current values in Shopify
            const finalResult: JsonData = getJsonStructureWithData(newStructure, liveVersion);
            await writeFileSyncRecursive(distFilePath, JSON.stringify(finalResult));
            console.log(chalk.yellow(`\n${file} Translation structure updated ${distFilePath}.`));
        } // End for...of

        console.log(chalk.magenta(`\n${figures.heart} All Translations structures updated. \n`));
    } catch (e) {
        // Catch anything bad that happens
        console.error("We've thrown! Whoops!", e);
    }
}
