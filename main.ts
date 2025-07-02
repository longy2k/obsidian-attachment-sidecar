import { App, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface SideCarSettings {
	toggleSideCarFiles: boolean;
}

const DEFAULT_SETTINGS: SideCarSettings = {
	toggleSideCarFiles: false,
}

export default class SideCarPlugin extends Plugin {
	settings: SideCarSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// });
		// Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-sample-modal-simple',
		// 	name: 'Open sample modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });
		// This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });

		this.registerEvent(
			this.app.vault.on('create', async (file) => {
				// Only handle TFile instances that are not markdown files
				if (file instanceof TFile && file.extension !== 'md') {
					const sidecarPath = `${file.path}.md`;
					
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

		this.registerEvent(
		this.app.vault.on('rename', async (file, oldPath) => {
			// Case 1: Handle non-markdown files being renamed (your existing logic)
			if (file instanceof TFile && file.extension !== 'md') {
			const oldSidecarPath = `${oldPath}.md`;
			const newSidecarPath = `${file.path}.md`;
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
				await this.app.vault.rename(sidecarFile, newSidecarPath);
				
				// Update the content with new filename references
				const renamedSidecarFile = this.app.vault.getAbstractFileByPath(newSidecarPath);
				if (renamedSidecarFile instanceof TFile) {
					await this.app.vault.modify(renamedSidecarFile, updatedContent);
				}
				} catch (error) {
				// Silently handle file system errors - they're usually harmless race conditions
				console.log(`Sidecar rename skipped for ${oldPath}: ${error.message}`);
				}
			}
			}
			
			// Case 2: Handle markdown sidecar files being renamed (NEW LOGIC)
			else if (file instanceof TFile && file.extension === 'md' && oldPath.endsWith('.md')) {
			// Check if this is a sidecar file by seeing if there's a corresponding main file
			const oldMainFilePath = oldPath.slice(0, -3); // Remove '.md' extension
			const newMainFilePath = file.path.slice(0, -3); // Remove '.md' extension
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
				await this.app.vault.rename(mainFile, newMainFilePath);
				
				// Update the sidecar content with new filename references
				await this.app.vault.modify(file, updatedContent);
				
				} catch (error) {
				// Silently handle file system errors - they're usually harmless race conditions
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
			const sidecarPath = `${file.path}.md`;
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

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			// console.log('click', evt);
		});

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const {contentEl} = this;
// 		contentEl.setText('Woah!');
// 	}

// 	onClose() {
// 		const {contentEl} = this;
// 		contentEl.empty();
// 	}
// }

class SideCarSettingTab extends PluginSettingTab {
	plugin: SideCarPlugin;

	constructor(app: App, plugin: SideCarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('p', {text: 'Backup your vault before activating just in case you want to revert changes.'});

		new Setting(containerEl)
			.setName('Generate and Run Sidecar Files')
			.setDesc('Toggle to create sidecar markdown files for all binary attachments in vault.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.toggleSideCarFiles)
				.onChange(async (value) => {
					this.plugin.settings.toggleSideCarFiles = value;
					await this.plugin.saveSettings();
					
					if (value) {
						await this.createSideCarFiles();
					}
					// Handle toggle state change
					// You might want to show/hide other settings based on this toggle
				}));
	}

	// Updated createSideCarFiles method for creating sidecar markdown files
	async createSideCarFiles() {
		console.log('Vault Folder selected');
		new Notice('Creating sidecar files for attachments in vault folder...');
		
		try {
			// Get all files in the vault
			const allFiles = this.plugin.app.vault.getFiles();
			
			// Filter to get only binary/non-markdown files
			const binaryFiles = allFiles.filter(file => {
				return file.extension !== 'md' && !file.path.endsWith('.md');
			});
			
			console.log(`Found ${binaryFiles.length} binary files`);
			
			let createdCount = 0;
			let skippedCount = 0;
			
			for (const binaryFile of binaryFiles) {
				// Create the sidecar file path by adding .md extension
				const sidecarPath = `${binaryFile.path}.md`;
				
				// Check if sidecar file already exists
				const existingSidecar = this.plugin.app.vault.getAbstractFileByPath(sidecarPath);
				
				if (existingSidecar) {
					// Skip if sidecar already exists
					console.log(`Skipping ${binaryFile.path} - sidecar already exists`);
					skippedCount++;
					continue;
				}
				
				// Create basic sidecar content
				const sidecarContent = this.generateSidecarContent(binaryFile);
				
				try {
					// Create the sidecar markdown file
					await this.plugin.app.vault.create(sidecarPath, sidecarContent);
					console.log(`Created sidecar for: ${binaryFile.path}`);
					createdCount++;
				} catch (error) {
					console.error(`Failed to create sidecar for ${binaryFile.path}:`, error);
				}
			}
			
			// Show summary notice
			new Notice(`Sidecar creation complete: ${createdCount} created, ${skippedCount} skipped`);
			
		} catch (error) {
			console.error('Error in createSideCarFiles:', error);
			new Notice('Error creating sidecar files. Check console for details.');
		}
	}

	// Helper method to generate basic sidecar content
	private generateSidecarContent(binaryFile: TFile): string {
		const filename = binaryFile.name;
		
		return `---\nfile: "[[${filename}]]"\n---\n![[${filename}]]`;
	}
}