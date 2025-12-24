import { Notice, TFile } from "obsidian";
import SideCarPlugin from "src/main";

export async function createSideCarFiles(plugin: SideCarPlugin) {
    try {
        // Get all files in the vault
        const allFiles = plugin.app.vault.getFiles();
        const binaryFiles = getBinaryFiles(allFiles);
        
        let createdCount = 0;
        let skippedCount = 0;
        
        for (const binaryFile of binaryFiles) {
            // Create the sidecar file path by adding .md extension
            const sidecarPath = `${binaryFile.path}.md.md`;
            
            // Check if sidecar file already exists
            const existingSidecar = plugin.app.vault.getAbstractFileByPath(sidecarPath);
            
            if (existingSidecar) {
                // Skip if sidecar already exists
                // console.log(`Skipping ${binaryFile.path} - sidecar already exists`);
                skippedCount++;
                continue;
            }
            
            // Create basic sidecar content
            const sidecarContent = generateSidecarContent(binaryFile);
            
            try {
                // Create the sidecar markdown file
                await plugin.app.vault.create(sidecarPath, sidecarContent);
                // console.log(`Created sidecar for: ${binaryFile.path}`);
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

export function getBinaryFiles(files: TFile[]): TFile[] {
    return files.filter((file: TFile) => {
        return file.extension !== 'md' && !file.path.endsWith('.md') && !file.path.endsWith('.md.md');
    });
}

export function getSidecarFiles(files: TFile[]): TFile[] {
    return files.filter((file: TFile) => {
        return file.path.endsWith('.md.md');
    });
}

// Helper method to generate basic sidecar content
function generateSidecarContent(binaryFile: TFile): string {
    const filename = binaryFile.name;
    
    return `---\nfile: "[[${filename}]]"\n---\n![[${filename}]]`;
}
