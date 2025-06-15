import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname replacement in ES modules:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directory = path.join(__dirname, 'src');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.resolve(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Regex to match import statements with relative path but missing extension
  const importRegex = /(from\s+['"])(\.\/[^'".]+)(['"])/g;

  let replaced = false;
  content = content.replace(importRegex, (match, p1, p2, p3) => {
    replaced = true;
    return `${p1}${p2}.tsx${p3}`;
  });

  if (replaced) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed imports in: ${filePath}`);
  }
}

const files = walkDir(directory);
files.forEach(fixImports);
