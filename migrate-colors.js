/**
 * Script de migration des couleurs hardcodées vers le design system NOVA
 * Remplace les couleurs hexadécimales par les classes Tailwind basées sur les tokens CSS
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Mapping des couleurs hardcodées vers les nouvelles classes Tailwind
const colorMappings = {
  // Couleurs primaires NOVA
  '#4A90E2': 'primary-600',
  'bg-[#4A90E2]': 'bg-primary-600',
  'text-[#4A90E2]': 'text-primary-600',
  'border-[#4A90E2]': 'border-primary-600',
  'hover:text-[#4A90E2]': 'hover:text-primary-600',
  
  '#3A7BC8': 'primary-700',
  'bg-[#3A7BC8]': 'bg-primary-700',
  'text-[#3A7BC8]': 'text-primary-700',
  'hover:bg-[#3A7BC8]': 'hover:bg-primary-700',
  
  '#E8F2FF': 'primary-100',
  'bg-[#E8F2FF]': 'bg-primary-100',
  'text-[#E8F2FF]': 'text-primary-100',
  
  // Couleurs de texte
  '#0B1220': 'neutral-900',
  'text-[#0B1220]': 'text-neutral-900',
  'bg-[#0B1220]': 'bg-neutral-900',
  
  '#111827': 'neutral-800',
  'text-[#111827]': 'text-neutral-800',
  
  '#4B5563': 'neutral-600',
  'text-[#4B5563]': 'text-neutral-600',
  'hover:text-[#4B5563]': 'hover:text-neutral-600',
  
  '#9CA3AF': 'neutral-400',
  'text-[#9CA3AF]': 'text-neutral-400',
  
  // Couleurs de bordure et arrière-plan
  '#E5E7EB': 'neutral-200',
  'border-[#E5E7EB]': 'border-neutral-200',
  'bg-[#E5E7EB]': 'bg-neutral-200',
  
  '#F3F4F6': 'neutral-100',
  'bg-[#F3F4F6]': 'bg-neutral-100',
  
  '#1F2937': 'neutral-700',
  'border-[#1F2937]': 'border-neutral-700',
  'bg-[#1F2937]': 'bg-neutral-700',
  
  // Couleurs médicales
  '#2E7D32': 'success-600',
  'text-[#2E7D32]': 'text-success-600',
  'bg-[#2E7D32]': 'bg-success-600',
  
  '#E8F5E9': 'success-100',
  'bg-[#E8F5E9]': 'bg-success-100',
  
  '#F59E0B': 'warning-600',
  'text-[#F59E0B]': 'text-warning-600',
  'bg-[#F59E0B]': 'bg-warning-600',
  
  '#FFF7E6': 'warning-100',
  'bg-[#FFF7E6]': 'bg-warning-100',
  
  '#D92D20': 'error-600',
  'text-[#D92D20]': 'text-error-600',
  'bg-[#D92D20]': 'bg-error-600',
  
  '#FEECEC': 'error-100',
  'bg-[#FEECEC]': 'bg-error-100',
  
  // Couleurs secondaires
  '#1E5AEF': 'trust-primary',
  'bg-[#1E5AEF]': 'bg-trust-primary',
  'text-[#1E5AEF]': 'text-trust-primary',
  
  '#EAF1FF': 'primary-50',
  'bg-[#EAF1FF]': 'bg-primary-50',
  
  // Couleurs d'urgence
  '#B91C1C': 'error-700',
  'hover:bg-[#B91C1C]': 'hover:bg-error-700',
};

function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Appliquer chaque mapping de couleur
    for (const [oldColor, newClass] of Object.entries(colorMappings)) {
      const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(oldColor)) {
        content = content.replace(regex, newClass);
        hasChanges = true;
        console.log(`  ✓ Remplacé ${oldColor} → ${newClass}`);
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Migré: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors de la migration de ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Début de la migration des couleurs vers le design system NOVA\n');
  
  // Patterns de fichiers à migrer
  const patterns = [
    'src/**/*.{tsx,ts,jsx,js}',
    'src/**/*.css',
  ];
  
  let totalFiles = 0;
  let migratedFiles = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { 
      ignore: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.d.ts',
        '**/tokens.css', // Ne pas modifier les fichiers de tokens
        '**/design-tokens.css',
      ]
    });
    
    files.forEach(filePath => {
      totalFiles++;
      console.log(`\n📄 Migration de: ${filePath}`);
      
      if (migrateFile(filePath)) {
        migratedFiles++;
      } else {
        console.log(`  ➖ Aucun changement nécessaire`);
      }
    });
  });
  
  console.log(`\n📊 Résumé de la migration:`);
  console.log(`   Total de fichiers analysés: ${totalFiles}`);
  console.log(`   Fichiers migrés: ${migratedFiles}`);
  console.log(`   Fichiers inchangés: ${totalFiles - migratedFiles}`);
  
  if (migratedFiles > 0) {
    console.log(`\n✅ Migration terminée avec succès!`);
    console.log(`\n📝 Prochaines étapes recommandées:`);
    console.log(`   1. Vérifiez les changements avec: git diff`);
    console.log(`   2. Testez l'application: npm run dev`);
    console.log(`   3. Vérifiez que les couleurs s'affichent correctement`);
    console.log(`   4. Committez les changements si tout fonctionne`);
  } else {
    console.log(`\n✨ Aucune migration nécessaire - les couleurs sont déjà conformes!`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrateFile, colorMappings };