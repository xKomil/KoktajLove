# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

// frontend/README.md
# KoktajLOVE Frontend

Frontend aplikacji webowej "KoktajLOVE" napisany w React z TypeScript, wykorzystujący Vite.

## Główne Technologie

*   **Framework:** React (v18+) z TypeScript
*   **Build Tool:** Vite (z szablonem React-TS + SWC)
*   **Routing:** React Router DOM (v6+)
*   **Zarządzanie stanem:**
    *   Globalny: React Context API (uwierzytelnienie)
    *   Lokalny: Hooki `useState` i `useReducer`
    *   Stan serwera: Axios w serwisach + `useApi` hook
*   **Komunikacja HTTP:** Axios
*   **Stylizacja:** CSS Modules + globalne style CSS
*   **Walidacja formularzy:** React Hook Form
*   **Formatowanie kodu i Linting:** Prettier i ESLint

## Struktura Projektu

Struktura projektu znajduje się w katalogu `frontend/`. Główne katalogi w `src/`:

*   `assets/`: Statyczne zasoby (obrazy, fonty).
*   `components/`: Reużywalne komponenty UI, layoutu i specyficzne dla funkcjonalności.
*   `contexts/`: Konteksty React (np. `AuthContext`).
*   `hooks/`: Customowe hooki React.
*   `pages/`: Komponenty reprezentujące widoki/strony aplikacji.
*   `router/`: Konfiguracja routingu.
*   `services/`: Logika komunikacji z API.
*   `styles/`: Globalne style i zmienne CSS.
*   `types/`: Definicje typów TypeScript.
*   `utils/`: Funkcje pomocnicze.

## Dostępne Skrypty

W katalogu projektu możesz uruchomić:

### `npm run dev`

Uruchamia aplikację w trybie deweloperskim.<br />
Otwórz [http://localhost:5173](http://localhost:5173) (lub inny port wskazany przez Vite) aby zobaczyć ją w przeglądarce.

Strona będzie się automatycznie przeładowywać po dokonaniu zmian.<br />
Zobaczysz również błędy lintowania w konsoli.

### `npm run build`

Buduje aplikację do produkcyjnego folderu `dist/`.<br />
Poprawnie bundluje React w trybie produkcyjnym i optymalizuje build dla najlepszej wydajności.

### `npm run lint`

Uruchamia ESLint do analizy kodu pod kątem błędów i stylu.

### `npm run format`

Uruchamia Prettier do automatycznego formatowania kodu.

### `npm run preview`

Uruchamia lokalny serwer statyczny z produkcyjną wersją aplikacji z folderu `dist/`.

## Zmienne Środowiskowe

Aplikacja używa zmiennych środowiskowych do konfiguracji, np. adresu URL backendu.

*   Skopiuj plik `.env.example` do `.env`.
*   Dostosuj wartości w pliku `.env` do swojej konfiguracji.

Przykład:
`VITE_API_BASE_URL=http://localhost:8000/api/v1`