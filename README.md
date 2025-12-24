# Attachment Sidecar for Obsidian

Add metadata to binary files (e.g. base, canvas, jpg, mp4, pdf) by creating sidecar markdown files.

| Show Sidecar Files                                               | Hide Sidecar Files                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| ![Image 2](images/CleanShot%202025-12-24%20at%2016.00.09@2x.png) | ![Image 1](images/CleanShot%202025-12-24%20at%2015.59.42@2x.png) |

![alt text](<images/CleanShot 2025-12-24 at 15.48.08@2x.png>)
![alt text](<images/CleanShot 2025-12-24 at 15.48.40@2x.png>)

Filter your binary files using [Obsidian Bases](https://help.obsidian.md/bases) to view and modify your metadata.

![alt text](<images/CleanShot 2025-12-24 at 15.56.01@2x.png>)

The plugin will automatically create a sidecar markdown file every time you add a binary file to your vault. Otherwise, you can run the `Create Sidecar Files` for any missing sidecar markdown files.

![alt text](<images/CleanShot 2025-12-24 at 16.08.11@2x.png>)

## How to activate the plugin

**Method 1** - Obsidian Community plugins (**To be submitted**):

> Currently not available.

1. Search for "Attachment Sidecar" in the Obsidian Community plugins.
2. Enable "Attachment Sidecar" in the settings.

**Method 2** - Install using Beta Reviewers Auto-update Tester ([BRAT](https://github.com/TfTHacker/obsidian42-brat)) - [Quick guide for using BRAT](https://tfthacker.com/Obsidian+Plugins+by+TfTHacker/BRAT+-+Beta+Reviewer's+Auto-update+Tool/Quick+guide+for+using+BRAT):

1. Search for "Obsidian42 - BRAT" in the Obsidian Community plugins.
2. Open the command palette and run the command `BRAT: Add a beta plugin for testing` (If you want the plugin version to be frozen, use the command `BRAT: Add a beta plugin with frozen version based on a release tag`.)
3. Paste "https://github.com/longy2k/obsidian-attachment-sidecar".
4. Click on "Add Plugin".
5. After BRAT confirms the installation, in Settings go to the Community plugins tab.
6. Refresh the list of plugins.
7. Find the beta plugin you just installed and enable it.

**Method 3** - To activate the plugin from this repo:

1. Navigate to the plugin's folder in your terminal.
2. Run `npm install` to install any necessary dependencies for the plugin.
3. Once the dependencies have been installed, run `npm run build` to build the plugin.
4. Once the plugin has been built, it should be ready to activate.

## Getting Started

> It is recommended to backup your vault before running this plugin! The plugin will create sidecar markdown files for all your binary files.

Enable the plugin in the "Community plugins" tab. Go to the plugin's setting and run the `Create Sidecar Files` command. You will receive a notice once the command is done executing.

## Tips

If you want to view all file extensions that Obsidian cannot open natively, go to `Settings > Files and link > Show all file types`.

## Support

<a href='https://ko-fi.com/K3K8PNYT8' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
