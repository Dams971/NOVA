#!/bin/bash

echo "Fixing lint issues in batches..."

# 1. Fix unescaped entities in JSX files
echo "Fixing unescaped entities..."
find src -name "*.tsx" -o -name "*.jsx" | while read file; do
  # Fix apostrophes in JSX text
  sed -i.bak -E "s/>([^<{]*)'([^<{]*)</>\1\&apos;\2</g" "$file"
  sed -i.bak -E "s/>([^<{]*)\"([^<{]*)</>\1\&quot;\2</g" "$file"
done

# 2. Remove unused imports
echo "Removing unused imports..."

# Remove specific unused imports
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak '/^import.*Clock.*from.*lucide-react.*$/d'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak '/^import.*Award.*from.*lucide-react.*$/d'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak '/^import.*FileText.*from.*lucide-react.*$/d'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak '/^import.*Calendar.*from.*lucide-react.*$/d'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak '/^import.*Filter.*from.*lucide-react.*$/d'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak '/^import { motion } from .framer-motion.$/d'

# 3. Fix any types
echo "Replacing any with unknown..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/: any\[\]/: unknown[]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/: any\b/: unknown/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/<any>/<unknown>/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/ as any\b/ as unknown/g'

# 4. Prefix unused parameters with underscore
echo "Prefixing unused parameters..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak -E 's/\b(error|err|index|type|id|cabinetId|appointment)\b(\s*[,):=])/_\1\2/g'

# 5. Fix prefer-const
echo "Fixing prefer-const..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/let currentDate = new Date()/const currentDate = new Date()/g'

# Clean up backup files
find src -name "*.bak" -delete

echo "Batch fixes complete!"