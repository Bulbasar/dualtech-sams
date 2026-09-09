import eslintPluginReact from "eslint-plugin-react";

export default [
    {
        files: ["**/*.js", "**/*.jsx", "**/*.html"],
        plugins: {
            react: eslintPluginReact
        },
        languageOptions: {
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        rules: {
            "react/jsx-uses-react": "error",
            "react/jsx-uses-vars": "error"
        }
    }
];
