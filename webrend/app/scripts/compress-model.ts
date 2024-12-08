// scripts/compressGLB.ts
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function compressGLBFiles() {
  const sourceDir = path.join(process.cwd(), 'public/glb/raw/ipad_mini_2023.glb');
  const outputDir = path.join(process.cwd(), 'public/glb/compressed/ipad_mini_2023.glb');

  // Create directories if they don't exist
  if (!fs.existsSync(sourceDir)) {
    fs.mkdirSync(sourceDir, { recursive: true });
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all GLB files from source directory
  const files = fs.readdirSync(sourceDir).filter(file => 
    file.endsWith('.glb') || file.endsWith('.gltf')
  );

  for (const file of files) {
    const inputPath = path.join(sourceDir, file);
    const outputPath = path.join(outputDir, file);

    try {
      console.log(`Compressing ${file}...`);
      await execAsync(
        `gltf-pipeline -i "${inputPath}" -o "${outputPath}" --draco.compressionLevel=7`
      );
      console.log(`Successfully compressed ${file}`);
    } catch (error) {
      console.error(`Error compressing ${file}:`, error);
    }
  }
}

compressGLBFiles().catch(console.error);