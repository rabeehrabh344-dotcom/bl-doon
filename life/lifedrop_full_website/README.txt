# LifeDrop Blood Donation Website

## Files
- `index.html` — page structure
- `style.css` — responsive design
- `script.js` — form logic, localStorage, donor search, admin panel, WhatsApp links and CSV export

## Run it
1. Extract the ZIP file.
2. Open the `lifedrop_full_website` folder.
3. Open `index.html` in a browser, or use the VS Code Live Server extension.
4. Register a sample donor and submit a sample blood request to test it.

## Included features
- Home page
- Donor registration form
- Blood request form
- Search donors by blood group and location
- Admin panel with donor/request lists
- Request status updates
- WhatsApp contact buttons
- Export CSV
- Responsive layout for desktop and mobile

## Important limitations
- This is a front-end demo. Data is stored in the browser's localStorage, not in a shared online database.
- There is no admin login or server-side security.
- WhatsApp buttons open WhatsApp with a prefilled message; they do not send it automatically. The phone number must be valid and may need a country code. Ten-digit Indian mobile numbers are prefixed with 91 by this demo.
- For a real deployment, use a secure backend/database, admin authentication, consent/privacy controls, and proper verification. Never rely on this demo for emergency medical care; contact hospitals or blood banks directly.
