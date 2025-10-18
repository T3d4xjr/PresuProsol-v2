# PresuProsol

PresuProsol is a Next.js project that serves as a template for building modern web applications using React. This project is structured to provide a clean and efficient development experience.

## Getting Started

To get started with the project, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd PresuProsol
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   This will start the Next.js development server on `http://localhost:3000`.

## Project Structure

- `src/pages`: Contains the application's pages.
  - `_app.js`: Custom App component for global styles and layout.
  - `index.js`: Main entry point of the application.
  - `api/hello.js`: API route for handling requests.

- `src/components`: Contains reusable components.
  - `Header.js`: Navigation or header section of the application.

- `src/styles`: Contains CSS files.
  - `globals.css`: Global styles for the application.
  - `Home.module.css`: Scoped styles for the Home component.

- `public`: Contains static files.
  - `robots.txt`: Controls how search engines index the site.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.

## License

This project is licensed under the MIT License.