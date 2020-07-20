import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import figures from 'figures';
import themeKit from '@shopify/themekit';
import minimist from 'minimist';
import dotenv from 'dotenv';
import { JsonData, Init } from './types/types';
import { getJsonStructureWithData } from './utilities/utilities';
const argv = minimist(process.argv.slice(2));
const dir = './tmp';

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
            // eslint-disable-next-line
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
    const rawNewStructure: Buffer = await fs.readFileSync('./src/locales/en.default.json');
    const newStructure: JsonData = JSON.parse(rawNewStructure.toString());

    // We get a new json with the structure from the translations in the src directory mapped with the current values in Shopify
    const finalResult: JsonData = getJsonStructureWithData(newStructure, liveVersion);
    await fs.writeFileSync('./dist/locales/en.default.json', JSON.stringify(finalResult));
    console.log(chalk.magenta(`\n${figures.heart}  Translations structure updated. \n`));
}
