import fs from 'fs/promises';
import path from 'path';

async function fixImports(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      await fixImports(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      let content = await fs.readFile(fullPath, 'utf8');
      // Regex to add .tsx extension if missing
      content = content.replace(/(from\s+['"])(\.\/[^.'"]+)(['"])/g, (match, p1, p2, p3) => {
        if (p2.endsWith('.ts') || p2.endsWith('.tsx') || p2.endsWith('.js') || p2.endsWith('.jsx')) {
          return match; // already has extension
        }
        return `${p1}${p2}.tsx${p3}`; // append .tsx extension
      });
      await fs.writeFile(fullPath, content, 'utf8');
      console.log(`Fixed imports in ${fullPath}`);
    }
  }
}

fixImports('./src').catch(console.error);
