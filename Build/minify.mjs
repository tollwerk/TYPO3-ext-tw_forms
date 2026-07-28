#!/usr/bin/env node
/**
 * Minifies the extension's public JavaScript.
 *
 * Every `*.js` below Resources/Public/Javascript is written to a sibling
 * `*.min.js`. Files that are already minified are skipped as inputs.
 *
 * esbuild runs WITHOUT bundling on purpose: the sources are plain browser
 * scripts that share globals (`tw_forms`, `PowermailValidators`) across files.
 * In non-bundle mode esbuild leaves top-level names untouched, so those
 * globals keep working exactly as before.
 *
 * Usage:
 *   node Build/minify.mjs          build once
 *   node Build/minify.mjs --watch  rebuild on change
 */

import { build } from 'esbuild';
import { readdir, watch } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXTENSION_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIRECTORY = join(EXTENSION_ROOT, 'Resources/Public/Javascript');

// Browser baseline. Keeps `??` and `?.` intact, as the previous minifier did.
const TARGET = 'es2020';

/**
 * Collect all minifiable JavaScript sources, recursively.
 *
 * @param {string} directory Absolute path to scan.
 * @returns {Promise<string[]>} Absolute paths of source files.
 */
async function collectSources(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(entries.map((entry) => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            return collectSources(path);
        }
        const minifiable = entry.name.endsWith('.js') && !entry.name.endsWith('.min.js');
        return minifiable ? [path] : [];
    }));
    return files.flat();
}

/**
 * Minify every source file into its `.min.js` sibling.
 *
 * @returns {Promise<boolean>} True when all files built successfully.
 */
async function minifyAll() {
    const sources = await collectSources(SOURCE_DIRECTORY);

    if (!sources.length) {
        console.warn(`No JavaScript sources found below ${relative(EXTENSION_ROOT, SOURCE_DIRECTORY)}`);
        return true;
    }

    const results = await Promise.all(sources.map(async (source) => {
        const outfile = `${source.slice(0, -3)}.min.js`;
        try {
            await build({
                entryPoints: [source],
                outfile,
                minify: true,
                bundle: false,
                target: TARGET,
                charset: 'utf8',
                logLevel: 'silent'
            });
            console.log(`  ok  ${relative(EXTENSION_ROOT, outfile)}`);
            return true;
        } catch (error) {
            console.error(`  FAIL ${relative(EXTENSION_ROOT, source)}`);
            console.error(`       ${error.message.split('\n')[0]}`);
            return false;
        }
    }));

    return results.every(Boolean);
}

const watchMode = process.argv.includes('--watch');

if (!(await minifyAll()) && !watchMode) {
    process.exit(1);
}

if (watchMode) {
    console.log('\nWatching for changes. Press Ctrl+C to stop.');
    let pending = null;
    for await (const event of watch(SOURCE_DIRECTORY, { recursive: true })) {
        // Ignore our own output to avoid a rebuild loop.
        if (!event.filename || !event.filename.endsWith('.js') || event.filename.endsWith('.min.js')) {
            continue;
        }
        // Editors often emit several events per save; collapse them.
        clearTimeout(pending);
        pending = setTimeout(minifyAll, 50);
    }
}
