import { App, PluginSettingTab, Setting } from 'obsidian';
import { createSideCarFiles } from './utils/sidecarUtils';
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

		containerEl.createEl('h1', {text: 'Attachment Sidecar Settings'});

		containerEl.createEl('p', {text: ''}).innerHTML = '<strong>Recommended:</strong> Backup your vault before running this plugin.';

		new Setting(containerEl)
		.setName('Create Sidecar Files')
		.setDesc('This will create sidecar markdown files for all binary files (e.g. base, canvas, jpeg, mp4, pdf) in your current vault.')
		.addButton(button => button
			.setButtonText('Run')
			.setCta() 
			.onClick(async () => {
            await createSideCarFiles(this.plugin);
			}));

		new Setting(containerEl)
			.setName('Hide Sidecar Files')
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