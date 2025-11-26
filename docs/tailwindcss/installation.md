Installation

## Get started with Tailwind CSS

Tailwind CSS works by scanning all of your HTML files, JavaScript components, and any other templates for class names, generating the corresponding styles and then writing them to a static CSS file.

It's fast, flexible, and reliable — with zero-runtime.

Installing Tailwind CSS as a Vite plugin is the most seamless way to integrate it with frameworks like Laravel, SvelteKit, React Router, Nuxt, and SolidJS.

01

#### Create your project

Start by creating a new Vite project if you don’t have one set up already. The most common approach is to use [Create Vite](https://vite.dev/guide/#scaffolding-your-first-vite-project).

Terminal

```
npm create vite@latest my-project
cd my-project
```

02

#### Install Tailwind CSS

Install `tailwindcss` and `@tailwindcss/vite` via npm.

Terminal

```
npm install tailwindcss @tailwindcss/vite
```

03

#### Configure the Vite plugin

Add the `@tailwindcss/vite` plugin to your Vite configuration.

vite.config.ts

```
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})
```

04

#### Import Tailwind CSS

Add an `@import` to your CSS file that imports Tailwind CSS.

CSS

```
@import "tailwindcss";
```

05

#### Start your build process

Run your build process with `npm run dev` or whatever command is configured in your `package.json` file.

Terminal

```
npm run dev
```

06

#### Start using Tailwind in your HTML

Make sure your compiled CSS is included in the `<head>` _(your framework might handle this for you)_, then start using Tailwind’s utility classes to style your content.

HTML

```
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="/src/style.css" rel="stylesheet">
</head>
<body>
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
</body>
</html>
```

**Are you stuck?** Setting up Tailwind with Vite can be a bit different across different build tools. Check our framework guides to see if we have more specific instructions for your particular setup.

[Explore our framework guides](https://tailwindcss.com/docs/installation/framework-guides)
