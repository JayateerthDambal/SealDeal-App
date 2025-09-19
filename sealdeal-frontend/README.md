# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
Sealdeal.ai Frontend - Milestone 1 Setup Guide
Welcome to the start of your Sealdeal.ai frontend! This guide will walk you through setting up the initial project structure and running the application.

1. Prerequisites
Node.js and npm: Make sure you have Node.js (version 18 or newer) and npm installed on your computer. You can download it from nodejs.org.

2. Project Setup
Create a Project Folder: Create a new folder on your computer named sealdeal-ai-frontend.

Add Files: Place all the files I've generated for you into this folder, maintaining the directory structure (e.g., files meant to be in src/ should go into a src folder).

Install Dependencies: Open your terminal or command prompt, navigate into the sealdeal-ai-frontend folder, and run the following command. This will download and install all the necessary libraries defined in package.json.

npm install

Set up Firebase:

Go to the Firebase Console.

Create a new project (or use an existing one).

In your project's settings, find the "Your apps" card and click on the web icon (</>) to add a new web app.

Give it a nickname (e.g., "Sealdeal AI Frontend") and register the app.

After registration, Firebase will give you a firebaseConfig object. Copy this object.

Open the src/firebaseConfig.ts file in your project and paste the object you just copied, replacing the placeholder configuration.

3. Running the Development Server
Once the installation is complete and you've configured Firebase, you can start the local development server. Run this command in your terminal:

npm run dev

This will start the application. You can now view it in your web browser at the local address provided in the terminal (usually http://localhost:5173).

You should see a beautiful, modern login screen styled with the glossy topaz and black theme.

What's Next?
This is the foundation. In our next milestone, we will:

Implement the actual Firebase authentication logic.

Build the main application shell (AppHeader, SidebarNav).

Create the main Dashboard view with the DealsListView.

You're off to a great start!