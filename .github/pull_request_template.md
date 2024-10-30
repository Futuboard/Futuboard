## Changes

Replace this text with a brief description of the changes in this PR, e.g.
- Switched to using Material-UI for styling
- Added a new page for user profile
- Fixed bug with user login

## Checklist (check all that apply, once you have confirmed they are OK)

- [] **Styles:**
  1. No global styles.
  2. Root element (App component) should not have any specific styles.
  3. Utilize the MUI (Material-UI) library for styling.
  4. Prefer creating styled components using MUI or custom styling for specific classes/IDs.
  5. Define styles using `sx` prop rather than `style` prop.

- [] **File Naming and Folder Structure:**
  1. File naming conventions: React components in PascalCase, others in camelCase
  2. Database types and api logic is handled in an `entities` directory.
  3. 'Pages' directory for primary page components handled by the router.
  4. Prefer one React component per file.

- [] **General Guidelines:**
  1. Limit additional types/interfaces in `.tsx` files to main function props; place other types/interfaces in separate type files.
  2. Avoid unnecessary comments.
  3. Use arrow notation, e.g. `const xxx = () => {}` for defining functions.
  4. No `console.log()` in the code.
