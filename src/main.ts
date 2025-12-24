import { Plugin, TFile } from 'obsidian';
import { SideCarSettingTab } from './settings';

interface SideCarSettings {
	hideSidecarFiles: boolean;
}

const DEFAULT_SETTINGS: SideCarSettings = {
	hideSidecarFiles: true,
}

export default class SideCarPlugin extends Plugin {
	settings: SideCarSettings;

	async onload() {
		await this.loadSettings();

		// Register a CSS class to hide sidecar files in the file explorer
		document.body.toggleClass('hide-sidecar-files', this.settings.hideSidecarFiles);

		this.registerEvent(
			this.app.vault.on('create', async (file) => {
				// Only handle TFile instances that are not markdown files
				if (file instanceof TFile && file.extension !== 'md') {
					const sidecarPath = `${file.path}.md.md`;
					
					// Check if sidecar already exists
					const existingSidecar = this.app.vault.getAbstractFileByPath(sidecarPath);
					if (existingSidecar) {
						return; // Skip if sidecar already exists
					}
					
					try {
						// Generate sidecar content
						const sidecarContent = `---\nfile: "[[${file.name}]]"\n---\n![[${file.name}]]`;
						
						// Create the sidecar file
						await this.app.vault.create(sidecarPath, sidecarContent);
						console.log(`Created sidecar for: ${file.path}`);
					} catch (error) {
						console.log(`Failed to create sidecar for ${file.path}: ${error.message}`);
					}
				}
			})
		);

		// Handle renaming of files to keep sidecars in sync
		this.registerEvent(
		this.app.vault.on('rename', async (file, oldPath) => {
			// Case 1: Handle non-markdown files being renamed
			if (file instanceof TFile && file.extension !== 'md') {
			const oldSidecarPath = `${oldPath}.md.md`;
			const newSidecarPath = `${file.path}.md.md`;
			const sidecarFile = this.app.vault.getAbstractFileByPath(oldSidecarPath);
			
			if (sidecarFile instanceof TFile) {
				try {
				// Check if the sidecar file actually exists and is readable
				const fileExists = await this.app.vault.adapter.exists(oldSidecarPath);
				if (!fileExists) {
					console.log(`Sidecar file ${oldSidecarPath} doesn't exist, skipping rename`);
					return;
				}
				
				// Read the current sidecar content
				const sidecarContent = await this.app.vault.read(sidecarFile);
				
				// Extract old and new filenames
				const oldFilename = oldPath.split('/').pop(); // Get just the filename
				const newFilename = file.name;
				
				// Update the content to reference the new filename
				const updatedContent = sidecarContent
					.replace(new RegExp(`\\[\\[${oldFilename}\\]\\]`, 'g'), `[[${newFilename}]]`)
					.replace(new RegExp(`!\\[\\[${oldFilename}\\]\\]`, 'g'), `![[${newFilename}]]`);
				
				// Rename the sidecar file
				await this.app.fileManager.renameFile(sidecarFile, newSidecarPath);
				
				// Update the content with new filename references
				const renamedSidecarFile = this.app.vault.getAbstractFileByPath(newSidecarPath);
				if (renamedSidecarFile instanceof TFile) {
					await this.app.vault.modify(renamedSidecarFile, updatedContent);
				}
				} catch (error) {
				console.log(`Sidecar rename skipped for ${oldPath}: ${error.message}`);
				}
			}
			}
			
			// Case 2: Handle markdown sidecar files being renamed
			else if (file instanceof TFile && file.extension === 'md' && oldPath.endsWith('.md.md')) {
			// Check if this is a sidecar file by seeing if there's a corresponding main file
			let oldMainFilePath = oldPath;
			let newMainFilePath = file.path;

			// Only slice if the specific sidecar extension is found
			if (oldPath.endsWith('.md.md')) {
				oldMainFilePath = oldPath.slice(0, -6); // Remove '.md.md' extension
			}

			if (file.path.endsWith('.md.md')) {
				newMainFilePath = file.path.slice(0, -6); // Remove '.md.md' extension
			}

			const mainFile = this.app.vault.getAbstractFileByPath(oldMainFilePath);
			
			if (mainFile instanceof TFile && mainFile.extension !== 'md') {
				try {
				// Check if the main file actually exists
				const fileExists = await this.app.vault.adapter.exists(oldMainFilePath);
				if (!fileExists) {
					console.log(`Main file ${oldMainFilePath} doesn't exist, skipping rename`);
					return;
				}
				
				// Read the current sidecar content to update internal references
				const sidecarContent = await this.app.vault.read(file);
				
				// Extract old and new filenames
				const oldFilename = oldMainFilePath.split('/').pop();
				const newFilename = newMainFilePath.split('/').pop();
				
				// Update the sidecar content to reference the new main filename
				const updatedContent = sidecarContent
					.replace(new RegExp(`\\[\\[${oldFilename}\\]\\]`, 'g'), `[[${newFilename}]]`)
					.replace(new RegExp(`!\\[\\[${oldFilename}\\]\\]`, 'g'), `![[${newFilename}]]`);
				
				// Rename the main file to match the sidecar
				await this.app.fileManager.renameFile(mainFile, newMainFilePath);
				
				// Update the sidecar content with new filename references
				await this.app.vault.modify(file, updatedContent);
				
				} catch (error) {
				console.log(`Main file rename skipped for ${oldPath}: ${error.message}`);
				}
			}
			}
		})
		);

		this.registerEvent(
		this.app.vault.on('delete', async (file) => {
			if (!(file instanceof TFile)) return;
			
			if (file.extension !== 'md') {
			// Binary file deleted -> delete sidecar
			const sidecarPath = `${file.path}.md.md`;
			const sidecarFile = this.app.vault.getAbstractFileByPath(sidecarPath);
			
			if (sidecarFile instanceof TFile) {
				try {
				// Check if file still exists before attempting to delete
				const exists = await this.app.vault.adapter.exists(sidecarPath);
				if (exists) {
					await this.app.vault.trash(sidecarFile, false);
				}
				} catch (error) {
				console.log(`Could not delete sidecar: ${error.message}`);
				}
			}
			}
		})
		);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SideCarSettingTab(this.app, this));

	}

	onunload() {
		document.body.removeClass('hide-sidecar-files');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}