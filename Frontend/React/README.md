# Frontend (React)

React + Vite SPA for Video Shoppe.

## App Responsibilities
- Handle user login/register and store token/user in local storage.
- Enforce role-aware route access.
- Render customer, employee, and owner page sets.
- Call backend APIs for inventory, checkout, account activity, rental alerts, and owner/employee operations.

## Key Files
- `App.jsx`: route map and role guards.
- `components/`: page-level components.
- `styles/`: page/component styles.
- `utils/`: shared auth/api helpers, cart helpers, rental rules, and order-derived account utilities.

## Customer Flow Notes
- Registration requires name, email, and password.
- Checkout prompts for phone number and address.
- Account activity and rental alerts are built from backend order data instead of local-only history.

## Employee Flow Notes
- Customer Activity shows a customer list first.
- Clicking a customer opens their details and order activity.

## Run Frontend
```bash
cd Frontend/React
npm run dev
```
