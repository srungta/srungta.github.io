---
layout: post
unique_id: WEB01

title: Creating web components using Microsoft fast elements
tldr: Fast is a web component library and framework from Microsoft.
permalink: /blog/web/creating-web-components-using-microsoft-fast-element
author: srungta
tags: 
- Web-Component
- Web
- Fast

series: 
  id: WEB
  index: 1
---

#### What is Fast?
Microsoft FAST is a collection of technologies built on Web Components and modern Web Standards It helps you write your custom HTML elements with ease.

> You can read more about web components [on this mozilla docs page](https://developer.mozilla.org/en-US/docs/Web/Web_Components)

#### What we will try to achieve?
- Set up a managed typescript project to write the components.
- Have hot reload and watch mode enabled.
- Create a web component that displays the name in uppercase based on an input attribute with an optional greeting.

#### Setting up the environment.
1. Install Node from https://nodejs.org/en/download/ page.
2. After the installation is complete, open a command line window (cmd, bash, powershell anything is fine) and type
```
node -v
```
If all is good you should see something like 
```bash
~/srungta>node -v
v12.3.1
```
3. Next, type
```
npm -v
```
If all is good you should see something like 
```bash
~/srungta>npm -v
6.9.0
```

#### Creating the package
1. Create a workspace folder.
```
mkdir fast-playground
cd fast-playground
```

2. Initialize the npm package using
```
npm init
```
This should ask you a couple of questions about your package.  
This is what i used.  
```bash
~/fast-playground>npm init
This utility will walk you through creating a package.json file.
It only covers the most common items, and tries to guess sensible defaults.
See 'npm help json' for definitive documentation on these fields
and exactly what they do.
Use 'npm install <pkg>' afterwards to install a package and
save it as a dependency in the package.json file.
Press ^C at any time to quit.
package name: (fast-playground) fast-playground
version: (1.0.0)
description: Test package to create fast components
entry point: (index.js) index.js
test command:
git repository:
keywords: FAST
author: srungta
license: (ISC) MIT
About to write to ~/fast-playground\package.json:
```
```json
{
  "name": "fast-playground",
  "version": "1.0.0",
  "description": "Test package to create fast components",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "FAST"
  ],
  "author": "srungta",
  "license": "MIT"
}
```
```
Is this OK? (yes) yes
~/fast-playground>
```

> At this point it would also be advisable to initialize a Git repo in the same directory using `git init` so that you can track changes across files easily.


#### Adding typescript
Typescript adds much needed type support for javascript. 
Webpack makes it easier to create bundles for JS, CSS and HTML files. It also helps us setup the TS to JS transpilation.
So we add typescript to the package and use that instead of plain JS.
1. Install typescript using
```
npm install --save typescript
```

> If you are using git, better add a `.gitignore` file with `node_modules` as one of the omissions.

2. Initialize a `tsconfig.json` file using
```
~/fast-playground>.\node_modules\.bin\tsc --init
```

3. Edit your `tsconfig.json` to set your preferences.
I am using the below configuration. You can check the other options mentioned in the [official documentation](https://www.typescriptlang.org/tsconfig)  
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ES2015",
    "moduleResolution": "Node",
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "strictFunctionTypes": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "target": "ES2015"
  },
  "files": ["src/index.ts"]
}
```


#### Add dummy typescript files
1. Create a file `src/index.ts` with following contents.
```typescript
const adder = (a: number, b: number):number => {
    return a+ b;
}
console.log("Stuff printed from js file");
export {adder};
```
2. In `package.json`, add a build script that we will use to build this package.
```json
...
"scripts": {
    "build": "tsc",
    ...
  },    
...
```

3. Run the build command at the package root.
```bash
npm run build
```

You should see a new folder called `dist` that has the transpiled js and map files.


#### Adding a dummy HTML file
Add a `index.html` file with the following contents.
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Webpack App</title>
  </head>
  <body>
    <h1>Hello world!</h1>
    <h2>Tip: Check your console</h2>
  </body>
</html>

```


#### Adding webpack
While the `tsc` is sufficient for now, running it again and again after every change is annoying.
We will setup webpack as our build system, so that it can watch the changed files, generate the js files, bundle them as a single file and serve up the html (yet to be added) files.
> `tsc` comes with a default `--watch` flag that we could use to watch the files for compilation. We are using webpack as it helps add plugins for other things also.

1. Install webpack as a dependency.
```bash
npm install webpack webpack-cli webpack-dev-server --save-dev
```

2. Install the loaders that we will use.
Since we want to use webpack to transpile typescript, we need a loader that can do that. We will use `ts-loader`.
```bash
npm install ts-loader --save-dev
```

3. Add webpack.config.js
Add a new file next to `package.json` called `webpack.config.js`.
We will try to do a few things. 
- Process SCSS files to CSS
- Transpile TS files to JS
- Inject the bundled files in an html file to test.
- Process assets.
- Minify CSS and JS files.

We can do this using the below webpack file.  
```js
// Generated using webpack-cli https://github.com/webpack/webpack-cli
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const isProduction = process.env.NODE_ENV == "production";
const stylesHandler = isProduction
  ? MiniCssExtractPlugin.loader
  : "style-loader";
const config = {
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    open: true,
    host: "localhost",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "index.html",
    }),

    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, "css-loader"],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [stylesHandler, "css-loader", "sass-loader"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
    config.plugins.push(new MiniCssExtractPlugin());
  } else {
    config.mode = "development";
  }
  return config;
};

```

For this webpack config to work, you need to install the dependencies as well.
```bash
npm install -D css-loader html-webpack-plugin mini-css-extract-plugin sass sass-loader style-loader
```

4. Add webpack script to npm commands.
In your `package.json` file add the following scripts
```json
...
"scripts": {
  "build": "webpack --mode=production --node-env=production",
  "build:dev": "webpack --mode=development",
  "build:prod": "webpack --mode=production --node-env=production",
  "watch": "webpack --watch",
  "serve": "webpack serve",
  "start": "webpack serve",
}
...
```

5. Type `npm run build:dev` to see a `dist` folder getting created with an `index.html` file and a `main.js` file.

6. Type `npm run start` to see a dev server start and your html file should pop up.

#### Adding FAST element.
Now that we have the basic dev experience setup, we will start with FAST element development.
Install the FAST element package using  
```bash
npm install @microsoft/fast-element
```

#### Adding the custom component.
1. Create a new file called `src/PersonCard.ts` with following contents.    
```typescript  
import { attr, customElement, FASTElement, html} from "@microsoft/fast-element";
const template = html<PersonCard>`<h1>${(x) => x.shouldGreet ? "Hello" : ""} ${(x) => x.name?.toUpperCase()}</h1>`;
@customElement({
  name: "person-card",
  template: template,
})
class PersonCard extends FASTElement {
  @attr name: string;
  @attr({ mode: 'boolean' }) shouldGreet: boolean;
}
export { PersonCard };
```

2. Export the newly created web component.
Update your `index.ts` with the following
```typescript
export * from "./PersonCard";
```
You can remove rest of the dummy code.

3. Update your `index.html` file to use your new web component.  

```html
<!DOCTYPE html>
<html>
  ...
  <body>
    <h1>Hello world!</h1>
    <h2>Tip: Check your console</h2>
    <person-card name="Kirk" shouldGreet></person-card>
  </body>
</html>

```

Run `npm run start` to see the web component in action.
Voila. Your first web component works.

> Keep committing your changes at regular intervals as checkpoints.  

#### BONUS : Setup up storybook
[Storybook JS](https://storybook.js.org/) is a nifty tool for UI component testing.
We will setup a storybook so that we can test the web component in isolation.

1. Add storybook js
We will use the storybook init command to add storybook dependencies automatically.
At project root, run `npm sb init`

2. Choose the `html` option.

3. This command should add the dependencies in `package.json`, it will also add the related scripts and some sample stories.

#### Adding stories for PersonCard
1. Create a file named `src/PersonCard.stories.ts` with following contents.
```typescript
import { Story, Meta } from "@storybook/html";
import { PersonCard } from ".";
PersonCard;
export default {
  title: "Components/PersonCard",
  argTypes: {
    name: { control: "text" },
    shouldGreet: { control: "boolean" },
  },
} as Meta;
const Template: Story<{ name: string; shouldGreet: boolean }> = (args) => {
  return `<person-card  name="${args.name}" shouldGreet="${args.shouldGreet}"></person-card>`;
};
export const Primary = Template.bind({});
Primary.args = {
  name: "Captain Kirk",
  shouldGreet: true
};
```

2. Run `npm run storybook` to start your storybook.
You should see an option in left nav with `PersonCard` title.  
Click on it and you should see a UI like below. 
![Storybook for person card](/assets/images/web/fast/storybook-demo-fail.png)

But why does the UI does not show the text?

This is because there is an existing issue with storybook.
Storybook uses `babel` as a transpiler for typescript instead of `ts-loader`.
We can force storybook to use `ts-loader` by updating the `.storybook/main.js`.
This is what is also done in [the official FAST repo](https://github.com/microsoft/fast/blob/eeb625e346a54da4c1f338eb90341a6e2d9ddb83/packages/web-components/fast-components/.storybook/main.js#L10.)  
```js
module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.ts$/,
      use: [
        {
          loader: require.resolve("ts-loader"),
        },
      ],
    });
    return config;
  },
};
```

The UI will still not pick up. By default installing `ts-loader` adds the latest version to package.json.
However FAST elements in storybook do not work with that version for some reason 😢.
This can be fixed by running  
```bash
npm install -D ts-loader@^7.0.2
```
This is the same version that the official FAST repo uses. [Link to the Github repo](https://github.com/microsoft/fast/blob/eeb625e346a54da4c1f338eb90341a6e2d9ddb83/packages/web-components/fast-components/package.json#L107)

Rerun `npm run storybook` and things should work now with a UI like below. 😊
![Storybook for person card](/assets/images/web/fast/storybook-demo-success.png)

Change the text in the controls and see it live in action.  
Fin.