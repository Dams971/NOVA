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
  
  // Main configuration for all files
  {
    rules: {
      // Enhanced unused variables configuration
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^(_error|__error|err)$",
        "destructuredArrayIgnorePattern": "^_"
      }],
      
      // TypeScript specific rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": ["warn", {
        "ts-expect-error": "allow-with-description",
        "ts-ignore": "allow-with-description",
        "ts-nocheck": "allow-with-description",
        "ts-check": false
      }],
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-namespace": "warn",
      
      // React specific rules with French language consideration
      "react/no-unescaped-entities": ["warn", {
        "forbid": [
          {
            "char": ">",
            "alternatives": ["&gt;"]
          },
          {
            "char": "<", 
            "alternatives": ["&lt;"]
          },
          {
            "char": "{",
            "alternatives": ["&#123;"]
          },
          {
            "char": "}",
            "alternatives": ["&#125;"]
          }
        ]
      }],
      
      // React hooks rules
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      
      // General JavaScript/TypeScript rules
      "prefer-const": "warn",
      "no-var": "warn",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      
      // Import/export rules
      "import/no-anonymous-default-export": ["warn", {
        "allowArray": false,
        "allowArrowFunction": false,
        "allowAnonymousClass": false,
        "allowAnonymousFunction": false,
        "allowCallExpression": true,
        "allowNew": false,
        "allowLiteral": false,
        "allowObject": false
      }],
      "import/order": ["warn", {
        "groups": [
          "builtin",
          "external", 
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "newlines-between": "never",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }]
    }
  },

  // Test files configuration - more lenient rules
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

  // API routes configuration - specific patterns for Next.js API
  {
    files: ["**/api/**/*.ts", "**/api/**/*.js"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // API responses often need any
      "import/no-anonymous-default-export": "off", // Next.js API routes use default exports
      "no-console": ["warn", { "allow": ["log", "warn", "error"] }]
    }
  },

  // Chat/AI service files - specific patterns for AI integration
  {
    files: [
      "**/lib/chat/**/*",
      "**/lib/ai/**/*", 
      "**/lib/llm/**/*",
      "**/services/chat/**/*"
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // AI responses are dynamic
      "no-console": ["warn", { "allow": ["log", "warn", "error", "debug"] }]
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
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^(_error|__error|error|err)$", // More lenient for service errors
        "destructuredArrayIgnorePattern": "^_"
      }]
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
