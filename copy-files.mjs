#!/usr/bin/env node

import { copyFile, mkdir, access, constants, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import os from 'os';

// Default copy destination
const defaultPath = join(os.homedir(), 'testvault', 'test', '.obsidian', 'plugins', 'nimble-task-notes');
const LOCAL_OVERRIDE_FILE = '.copy-files.local';
let copyPath = process.env.OBSIDIAN_PLUGIN_PATH || defaultPath;

try {
	const local = await readFile(LOCAL_OVERRIDE_FILE, 'utf8');
	const trimmed = local.trim();
	if (trimmed) copyPath = trimmed;
} catch (_) {
	// no local override
}

// Files to copy after build
const files = ['main.js', 'manifest.json'];

async function copyFiles() {
	try {
		// Resolve the destination path
		const destPath = resolve(copyPath);

		// Ensure the directory exists
		await mkdir(destPath, { recursive: true });

		// Copy each file
		const copyPromises = files.map(async (file) => {
			try {
				await access(file, constants.F_OK);
				const destFile = join(destPath, file);
				await copyFile(file, destFile);
				console.log(`✅ Copied ${file}`);
			} catch (err) {
				if (err && err.code === 'ENOENT') {
					console.warn(`⚠️  Warning: ${file} not found, skipping`);
				} else {
					throw new Error(`Failed to copy ${file}: ${err?.message || err}`);
				}
			}
		});

		await Promise.all(copyPromises);
		console.log(`✅ Files copied to: ${destPath}`);
	} catch (error) {
		console.error('❌ Failed to copy files:', error.message);
		process.exit(1);
	}
}

copyFiles();
