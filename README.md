# Reuse Dahab

Tech Stack

- **Lit**: For building fast, reusable Web Components.
- **Vite**: For a lightning-fast development experience.
- **SchmancyUI**: A UI component library for elegant interfaces.
- **Tailwind CSS**: For utility-first CSS styling.
- **TypeScript**: For type-safe code.
- **ESLint and Prettier**: For code quality and formatting.
- **Husky and Commitlint**: For enforcing commit conventions and pre-commit hooks.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Development Server](#running-the-development-server)
- [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Web Components with Lit**: Build efficient and lightweight web components.
- **Vite as Build Tool**: Benefit from instant server start and HMR.
- **SchmancyUI Integration**: Use pre-built UI components to speed up development.
- **Tailwind CSS**: Style your application rapidly with utility classes.
- **TypeScript Support**: Write type-safe code with TypeScript.
- **ESLint and Prettier**: Maintain code quality and consistency.
- **Husky and Commitlint**: Enforce commit conventions and run pre-commit hooks.
- **Atomic CSS Structure**: Organized CSS for scalable projects.

---

## Demo

Check out the live demo [here](https://reusedahab.netlify.app/).

---

## Getting Started

### Prerequisites

- **Node.js** (version 14 or higher)
- **npm** or **Yarn**

---

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/mhmo91/reuse.git
   ```

2. Navigate to the project directory:

   ```bash
   cd reuse
   ```

3. Install dependencies:

Using npm:

```bash
npm install
```

Or using Yarn:

```bash
yarn install
```

## Running the Development Server

Start the development server with hot module replacement:

Using npm:

```bash
npm run dev
```

Using Yarn:

```bash
yarn dev
```

Open your browser and navigate to http://localhost:3000.

## Building for Production

Build the application for production:

Using npm: `bash npm run build`

Using Yarn: `bash yarn build`

The output will be in the dist directory.

## Project Structure

```
├── src
│ ├── components
│ │ └── my-component.ts
│ └── main.ts
├── public
│ └── assets
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
├── package.json
├── README.md
└── index.md
```

    •	src/: Main source directory.
    •	index.html: Entry HTML file.
    •	main.ts: Entry TypeScript file.
    •	public/: Static assets.
    •	tailwind.config.js: Tailwind CSS configuration.
    •	vite.config.ts: Vite configuration in TypeScript.
    •	tsconfig.json: TypeScript configuration.
    •	package.json: Project dependencies and scripts.

## Usage

1. Customize the Template

   • Update package.json with your project details.
   • Modify the README.md to reflect your project.
   • Customize the components in the src/components directory.

2. Add New Components

Create new components in the src/ directory using Lit:

```ts
import { LitElement, html, css, customElement } from 'lit'

@customElement('my-new-component')
export class MyNewComponent extends $litElement(
	css`
		/* Your styles here */
	`,
) {
	render() {
		return html` <!-- Your template here -->`
	}
}
```

3. Import Components

Import your components in index.ts:

```ts
import './components/my-new-component'
```

4. Use Components in HTML

Use your components in index.html:

```html
<body>
	<my-new-component></my-new-component>
</body>
```

Contributing

Contributions are welcome! Please open an issue or submit a pull request.

License

This project is licensed under the MIT License.
