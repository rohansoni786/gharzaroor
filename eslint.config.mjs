// Simple ESLint config for Next.js 16 without @eslint/eslintrc (which has issues)
const eslintConfig = [
  {
    ignores: [".next/**", "build/**", "out/**", "node_modules/**"],
  },
  {
    rules: {
      // Allow any for now to avoid type issues with complex Next.js types
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
