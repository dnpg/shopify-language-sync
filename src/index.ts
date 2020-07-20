import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import figures from 'figures';
import themeKit from '@shopify/themekit';
import minimist from 'minimist';
import dotenv from 'dotenv';
import { JsonData, RecursiveUpdate } from './types/types';
const argv = minimist(process.argv.slice(2));
const dir = './tmp';

interface Flags {
    password?: string;
    themeid?: string;
    store?: string;
    env?: string;
}

export const init = () => {
    // Load env variables
    if (argv.env) {
        dotenv.config({ path: `.env.${argv.env}` });
    } else {
        dotenv.config({ path: '.env' });
    }

    // Create tmp dir if not exitent
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    // To prevent a warning that the config.yml file doesn't exist
    fs.writeFileSync(`${dir}/config.yml`, '');
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
                    files: ['locales/en.default.json'],
                    ...flags,
                },
                {
                    cwd: path.join(process.cwd(), '/tmp'),
                },
            )
            .then(() => {
                console.log(chalk.yellow('\n[locales-sync] Translations downloaded...\n'));
                updateLocale();
            })
            .catch((e: any) => {
                console.error(e);
            });
    } else {
        console.error(chalk.magenta('\n[locales-sync] Missing environment details\n'));
    }
}

async function updateLocale(): Promise<void> {
    // Load the translation that lives in Shopify containing the up to date values (This is the one the client updates from Shopify's backend).
    const rawLiveVersion: Buffer = await fs.readFileSync('./tmp/locales/en.default.json');
    const liveVersion: JsonData = JSON.parse(rawLiveVersion.toString());

    // Load the current translation structure, we want to push this structure without overwriting any values that have been updated by the client in Shopify
    const rawNewSchema: Buffer = await fs.readFileSync('./src/locales/en.default.json');
    const newSchema: JsonData = JSON.parse(rawNewSchema.toString());

    // We get a new json with the structure from the translations in the src directory mapped with the current values in Shopify
    const finalResult: JsonData = recursiveUpdate(newSchema, liveVersion);
    await fs.writeFileSync('./dist/locales/en.default.json', JSON.stringify(finalResult));
    console.log(chalk.magenta(`\n${figures.heart}  Translations structure updated. \n`));
}

// json1: one is the file with the structure we need
// json2 is the file with the up to date content for the file
// At the end the structure from json1 is kept, any objects deleted from json1 are not returned. Any objects existing in json2 are replaced in the final response
export const recursiveUpdate: RecursiveUpdate = (structureJson, dataJson) => {
    const newJson: JsonData = {};
    if (typeof structureJson === 'object') {
        Object.keys(structureJson).forEach((key) => {
            if (structureJson[key].constructor === Object) {
                newJson[key] = recursiveUpdate(
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
