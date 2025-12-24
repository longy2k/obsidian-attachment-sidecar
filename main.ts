import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

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
							await this.app.vault.delete(sidecarFile);
						} catch (error) {
							console.log(`Could not delete sidecar: ${error.message}`);
						}
					}
				} else if (file.path.endsWith('.md')) {
					// MD file deleted -> check if binary file exists and delete it
					const binaryPath = file.path.slice(0, -3); // Remove .md
					const binaryFile = this.app.vault.getAbstractFileByPath(binaryPath);
					if (binaryFile instanceof TFile && binaryFile.extension !== 'md') {
						try {
							await this.app.vault.delete(binaryFile);
						} catch (error) {
							console.log(`Could not delete binary file: ${error.message}`);
						}
					}
				}
			})
		);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			// console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Default location for new attachment metadata')
			.setDesc('Where newly added attachment metadata files are placed.')
			.addDropdown(dropdown => dropdown
				.addOption('option1', 'Vault Folder')
				.addOption('option2', 'In the folder specified below')
				.addOption('option3', 'Same folder as current file')
				.addOption('option4', 'In subfolder under current folder')
				.setValue(this.plugin.settings.mySetting || 'option1')
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();

					// Handle each option
					switch(value) {
						case 'option1':
							await this.handleVaultFolder();
							break;
						case 'option2':
							this.handleSpecifiedFolder();
							break;
						case 'option3':
							this.handleCurrentFileFolder();
							break;
						case 'option4':
							this.handleSubfolder();
							break;
					}
				}));
	}

	// Updated handleVaultFolder method for creating sidecar markdown files
	async handleVaultFolder() {
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
			console.error('Error in handleVaultFolder:', error);
			new Notice('Error creating sidecar files. Check console for details.');
		}
	}

	// Helper method to generate basic sidecar content
	private generateSidecarContent(binaryFile: TFile): string {
		const filename = binaryFile.name;
		
		return `---\nfile: "[[${filename}]]"\n---\n![[${filename}]]`;
	}

	handleSpecifiedFolder() {
		console.log('In the folder specified below selected');
		new Notice('Setting attachment location to: Specified folder');
		// Add your specific logic for specified folder here
		// You might want to show an additional input field for folder path
	}

	handleCurrentFileFolder() {
		console.log('Same folder as current file selected');
		new Notice('Setting attachment location to: Same folder as current file');
		// Add your specific logic for current file folder here
	}

	handleSubfolder() {
		console.log('In subfolder under current folder selected');
		new Notice('Setting attachment location to: Subfolder under current folder');
		// Add your specific logic for subfolder here
	}
}