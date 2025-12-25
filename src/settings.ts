import { App, PluginSettingTab, Setting } from 'obsidian';
import { createSideCarFiles, getBinaryFiles, getSidecarFiles } from './utils/sidecarUtils';
import SideCarPlugin from './main';

export class SideCarSettingTab extends PluginSettingTab {
	plugin: SideCarPlugin;

	constructor(app: App, plugin: SideCarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		const p = containerEl.createEl('p');
		p.createEl('strong', { text: 'Recommended:' });
		p.appendText(' Backup your vault before running this plugin.');

        // Count files
		const allFiles = this.app.vault.getFiles();
		const binaryFiles = getBinaryFiles(allFiles);
        const sidecarFiles = getSidecarFiles(allFiles);

		new Setting(containerEl)
		.setName('Create sidecar files')
		.setDesc(`This will create sidecar markdown files for all binary files (e.g. base, canvas, jpg, mp4, pdf) that does not exist in your vault. 
            You currently have ${binaryFiles.length} binary files and ${sidecarFiles.length} sidecar markdown files in your vault.`)
		.addButton(button => button
			.setButtonText('Run')
			.setCta() 
			.onClick(async () => {
            await createSideCarFiles(this.plugin);
            this.display();
			}));

		new Setting(containerEl)
			.setName('Hide sidecar files')
			.setDesc('Hide sidecar markdown files from the file explorer.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideSidecarFiles)
				.onChange(async (value) => {
					this.plugin.settings.hideSidecarFiles = value;
					await this.plugin.saveSettings();
					
					// Toggle CSS class on body to control the CSS rule
					document.body.toggleClass('hide-sidecar-files', value);
				}));

		
	}
}