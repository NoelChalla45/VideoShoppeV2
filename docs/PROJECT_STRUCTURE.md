# Project Structure

```text
Video_Shoppe/
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── index.js
│   │   ├── lib/
│   │   │   └── prisma.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── inventory.js
│   │       └── orders.js
│   ├── package.json
│   └── README.md
├── Frontend/React/
│   ├── components/
│   │   ├── Account.jsx
│   │   ├── Cart.jsx
│   │   ├── Catalog.jsx
│   │   ├── CustomerActivity.jsx
│   │   ├── DVDDetail.jsx
│   │   ├── EmployeeDashboard.jsx
│   │   ├── Inventory.jsx
│   │   ├── OwnerDashboard.jsx
│   │   ├── OwnerEmployees.jsx
│   │   ├── OwnerInventory.jsx
│   │   ├── OwnerStock.jsx
│   │   └── RentalAlerts.jsx
│   ├── styles/
│   │   ├── account.css
│   │   ├── alerts.css
│   │   ├── cart.css
│   │   ├── catalog.css
│   │   ├── dvddetail.css
│   │   ├── employee.css
│   │   ├── owner.css
│   │   └── login.css
│   ├── utils/
│   │   ├── accountActivity.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   └── rentalRules.js
│   ├── App.jsx
│   └── README.md
├── docs/
├── scripts/
├── Documents/
└── README.md
```

## Architecture Notes
- Backend exposes auth, inventory, and order APIs.
- Frontend enforces route-level role access and uses backend as source of truth for inventory and checkout.
- Owner inventory updates flow through protected backend endpoints.
- Customer account history and rental alerts are derived from backend order data.
- Employee customer activity is a drill-down flow backed by customer and order endpoints.
