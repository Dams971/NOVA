import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Main configuration for all files - WARNINGS DISABLED
  {
    rules: {
      // Enhanced unused variables configuration - DISABLED
      "@typescript-eslint/no-unused-vars": "off",
      
      // TypeScript specific rules - DISABLED
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-namespace": "off",
      
      // React specific rules - DISABLED
      "react/no-unescaped-entities": "off",
      
      // React hooks rules - DISABLED WARNINGS (keeping error for rules-of-hooks)
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "error", // Keep this as error - it's critical
      
      // General JavaScript/TypeScript rules - DISABLED
      "prefer-const": "off",
      "no-var": "off",
      "no-console": "off",
      
      // Import/export rules - DISABLED
      "import/no-anonymous-default-export": "off",
      "import/order": "off"
    }
  },

  // Test files configuration - all rules disabled
  {
    files: [
      "**/__tests__/**/*",
      "**/*.test.*",
      "**/*.spec.*",
      "**/test/**/*",
      "**/tests/**/*"
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
      "no-console": "off"
    }
  },

  // API routes configuration
  {
    files: ["**/api/**/*.ts", "**/api/**/*.js"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "import/no-anonymous-default-export": "off",
      "no-console": "off"
    }
  },

  // Chat/AI service files
  {
    files: [
      "**/lib/chat/**/*",
      "**/lib/ai/**/*", 
      "**/lib/llm/**/*",
      "**/services/chat/**/*"
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off"
    }
  },

  // Database and service layer files
  {
    files: [
      "**/lib/database/**/*",
      "**/lib/services/**/*",
      "**/services/**/*",
      "**/repositories/**/*"
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "off"
    }
  },

  // Configuration and setup files
  {
    files: [
      "*.config.*",
      "**/scripts/**/*", 
      "**/migrations/**/*",
      "middleware.*"
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "import/no-anonymous-default-export": "off",
      "no-console": "off"
    }
  },

  // Development and build files
  {
    files: [
      "**/*.d.ts",
      "**/types/**/*",
      "**/build/**/*",
      "**/dist/**/*"
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off"
    }
  }
];

export default eslintConfig;