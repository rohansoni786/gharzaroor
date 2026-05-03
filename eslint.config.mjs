// Simple ESLint config for Next.js 16 without @eslint/eslintrc (which has issues)
const eslintConfig = [
  {
    ignores: [".next/**", "build/**", "out/**", "node_modules/**"],
  },
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
];


export default eslintConfig;
