# shopify-language-sync
Tool to synchronise a live Shopify translation with a local translation file.

This was created while using [Slate](https://github.com/Shopify/slate) as a base project (Note that Slate ended support in January 2020)

# Installation

```
    yarn add shopify-language-sync
```

# Setup

You neet to have a .env file with the settings for your project, same structure as https://shopify.github.io/slate/docs/connect-to-your-store

Example .env file with minimum required information
```
# The myshopify.com URL to your Shopify store
SLATE_STORE={store-name}.myshopify.com

# The API password generated from a Private App
SLATE_PASSWORD=ccf7fb19ed4dc6993ac6355c0c489c7c7

# The ID of the theme you wish to upload files to
SLATE_THEME_ID=32112656003
```

Update your package.json scripts

```
...
"scripts": {
        "start": "slate-tools start",
        "sync": "locales-sync",
        "build": "slate-tools build && locales-sync",
        ...
```

# How it works

Using [themekit](https://shopify.github.io/themekit/), this tool downloads your theme's locales directory to a ./tmp/locales in your project.
Then updates your src translation with the content in tmp and replaces it in your destination directory.

# Example using Slate

In slate, all your files are under a ./src directory. The translations are in ./src/locales

Lets say we have a directory with the following structure

```
- src
    ...
    - layout
    - locales
        en.default.json
        es-AR.json
        fi.json
        ...
```

We know that the locales file can be updated by the Store owner and staff at any time. We need to get the latest translations from the live site, but at the same time we want to update the structure with the latest changes in our code.

This tool takes the ./src/locales as the translation structure and replaces any existing values stored in Shopify.

Let's say that our ./src/locales/en.default.json file looks like this

```
{
    general: {
        hello: 'Hello',
        thanks: 'Thanks',
    },
    test: 'Test',
    nonExistent: 'Now Exisits',
}
```

And the file currently in Shopify looks like this:

```
{
    general: {
        hello: 'Hola',
        how_are_you: 'This is deleted',
        thanks: 'Thanke',
    },
    test: 'Another test',
}
```

After this tool run, the final result is:

```
{
    general: {
        hello: 'Hola',
        thanks: 'Thanke',
    },
    test: 'Another test',
    nonExistent: 'Now Exisits',
}
```


# Arguments
If you are not using Slate or have a different folder structure you can pass the following arguments

| Argument | Description | Default |
| ------- | ------- | ----------- |
| srcDir | Source directory | ./src/locales |
| destDir | Destination directory | ./dist/locales |

```
...
"scripts": {
        "start": "slate-tools start",
        "sync": "locales-sync --srcDir=./source/locales --destDir=./dest/locales",
        ...
```