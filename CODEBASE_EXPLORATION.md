# Figuroo Codebase Exploration Summary

## Project Overview
Figuroo is a 3D printed figurine order management dashboard built with:
- **Frontend**: React + TypeScript with Vite, Wouter routing, TailwindCSS
- **Backend**: Express.js with Drizzle ORM
- **Database**: PostgreSQL
- **Package Manager**: pnpm monorepo

---

## 1. Language/Translation System (i18n)

### Current Status: **NOT IMPLEMENTED**
- ❌ No i18n library installed (no i18next, react-i18next, or intl libraries)
- ❌ No translation files or language configuration
- ✅ UI text is **hardcoded in English** in components

### Evidence:
- `package.json` contains no i18n dependencies
- Login page has mixed Romanian/English: "Accesează dashboard-ul", "Introdu tokenul de acces"
- Error messages in English: "Order deleted", "Failed to delete order"
- All UI strings are directly in JSX

### Recommendation if i18n needed:
- Would require adding i18next or similar library
- Create language files for EN, RO, etc.
- Wrap all text strings with translation hooks

---

## 2. Currency Display & Formatting

### Current Implementation: **Basic**
- **Default Currency**: USD ($)
- **Format**: Hard-coded `$` prefix with `.toFixed(2)` rounding
- **Locale**: No locale-specific formatting (no grouping separators, no locale variant)

### Where Currency is Used:

#### Frontend Currency Display:
| Location | Format | Example |
|----------|--------|---------|
| Dashboard Card | `$${value.toFixed(2)}` | `$1234.56` |
| Order Price | Direct display: `${order.order_price}` | `$123.45` |
| Revenue Chart | `tickFormatter={(value) => \`$${value}\`` | Y-axis labels |
| Analytics Cards | `$${summary?.monthly_revenue?.toFixed(2)}` | `$5000.00` |

**File**: `artifacts/figuroo/src/pages/dashboard.tsx` (lines 18-19)
**File**: `artifacts/figuroo/src/pages/analytics.tsx` (line 35)

#### Database Storage:
- Currency values stored as **NUMERIC** with precision 10, scale 2 in PostgreSQL
- Converted to strings in database, parsed to floats in API responses
- Orders: `orderPrice`, `shippingPrice`, `filamentCost`, `profit` - all numeric
- Products: `defaultPrice` - numeric
- Inventory: `costPerKg` - numeric

**Database Schema Files**:
- `lib/db/src/schema/orders.ts`
- `lib/db/src/schema/products.ts`
- `lib/db/src/schema/inventory.ts`

#### Settings Page Currency Option:
**File**: `artifacts/figuroo/src/pages/settings.tsx` (lines 54-65)
```jsx
<Select defaultValue="usd">
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select currency" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="usd">USD ($)</SelectItem>
    <SelectItem value="eur">EUR (€)</SelectItem>
    <SelectItem value="gbp">GBP (£)</SelectItem>
  </SelectContent>
</Select>
```
⚠️ **This select exists in UI but is NOT FUNCTIONAL** - selection doesn't change actual display

### Profit Calculation:
**File**: `artifacts/api-server/src/routes/orders.ts`
```typescript
function calcProfit(row: { orderPrice: string | null; shippingPrice: string | null; filamentCost: string | null }) {
  const price = parseFloat(row.orderPrice ?? "0");
  const shipping = parseFloat(row.shippingPrice ?? "0");
  const filament = parseFloat(row.filamentCost ?? "0");
  if (isNaN(price)) return null;
  return price - shipping - filament;
}
```

---

## 3. Authentication & Token Handling

### System Type: **Simple Token-Based Authentication**

### Token Storage:
- **Location**: Browser `localStorage`
- **Key**: `figuroo_token`
- **Type**: String (opaque bearer token)
- **Verification**: POST request to `/api/auth/verify`

**File**: `artifacts/figuroo/src/App.tsx` (lines 18-32)
```typescript
useEffect(() => {
  const stored = localStorage.getItem("figuroo_token");
  if (!stored) {
    setAuthenticated(false);
    return;
  }
  fetch(`${import.meta.env.BASE_URL}api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: stored }),
  })
    .then((r) => setAuthenticated(r.ok))
    .catch(() => setAuthenticated(false));
}, []);
```

### Backend Authentication:
**File**: `artifacts/api-server/src/routes/auth.ts`
```typescript
router.post("/auth/verify", (req, res) => {
  const { token } = req.body as { token?: string };
  const expected = process.env["ACCESS_TOKEN"];

  if (!expected) {
    res.status(500).json({ error: "ACCESS_TOKEN not configured" });
    return;
  }

  if (token && token === expected) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: "Invalid token" });
  }
});
```

### Login Flow:
1. User enters token on login page
2. Token submitted to `/api/auth/verify`
3. If verified (matches `ACCESS_TOKEN` env var), token stored in `localStorage`
4. On page load/refresh, token from localStorage is verified again
5. If invalid/missing, redirected to login
6. On logout, token removed from localStorage

**File**: `artifacts/figuroo/src/pages/login.tsx`

### Authentication Requirements:
- ✅ Token required for all dashboard pages
- ✅ Token verified on app startup
- ❌ No other auth middleware on backend routes
- ❌ No API-level token validation (only verified endpoint)
- ❌ No permission/role system
- ❌ No token expiration/refresh mechanism

### API Client Configuration:
**File**: `lib/api-client-react/src/custom-fetch.ts`
- Provides `setAuthTokenGetter()` function for bearer token authentication
- Currently NOT USED - app relies on token being in localStorage
- Backend has no middleware checking Authorization headers

---

## 4. Order Management System

### Order Data Model:
**File**: `lib/db/src/schema/orders.ts`

| Field | Type | Purpose |
|-------|------|---------|
| `id` | SERIAL PRIMARY KEY | Unique identifier |
| `customerName` | TEXT NOT NULL | Customer name |
| `productName` | TEXT NOT NULL | Product being ordered |
| `productColor` | TEXT | Color variant |
| `material` | TEXT | Filament material type |
| `orderPrice` | NUMERIC(10,2) | Total order price |
| `shippingPrice` | NUMERIC(10,2) | Shipping cost |
| `filamentCost` | NUMERIC(10,2) | Material cost |
| `profit` | NUMERIC(10,2) | Calculated: orderPrice - shippingPrice - filamentCost |
| `courier` | TEXT | Shipping courier (e.g., EasyBox, DHL) |
| `awbCode` | TEXT | Air Waybill/tracking number |
| `easyboxQrImageUrl` | TEXT | QR code image URL for EasyBox |
| `status` | TEXT NOT NULL (default: "Pending") | Current order status |
| `deadline` | TEXT | Delivery deadline ISO date |
| `notes` | TEXT | Additional notes |
| `createdAt` | TIMESTAMP WITH TZ | Creation timestamp |

### Order Statuses:
**File**: `artifacts/figuroo/src/pages/kanban.tsx` (line 9-14)
```typescript
const STATUSES = [
  "Pending",
  "Printing",
  "Packaging",
  "Ready to Ship",
  "Shipped",
  "Delivered"
] as const;
```

### API Endpoints:
**File**: `artifacts/api-server/src/routes/orders.ts`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/orders` | List all orders with optional status/search filters |
| POST | `/orders` | Create new order |
| GET | `/orders/:id` | Get single order details |
| PATCH | `/orders/:id` | Update order details (recalculates profit) |
| DELETE | `/orders/:id` | Delete order |
| PATCH | `/orders/:id/status` | Update only order status |

### Frontend Pages & Components:

#### Orders List Page
**File**: `artifacts/figuroo/src/pages/orders.tsx`
- Table view of all orders
- Search/filter by customer name, product name, or AWB code
- Inline status badges with color coding
- Urgency indicators for approaching deadlines
- CRUD operations via dialog
- QR code viewer for EasyBox tracking

#### Order Dialog (Create/Edit)
**File**: `artifacts/figuroo/src/components/orders/order-dialog.tsx`
- React Hook Form with Zod validation
- All order fields editable
- URL validation for QR image
- Form reset on successful creation

#### Kanban Board
**File**: `artifacts/figuroo/src/pages/kanban.tsx`
- Drag-and-drop interface using `@hello-pangea/dnd`
- Orders organized by status in columns
- Drag to change order status
- Optimistic updates with rollback on error
- Color-coded status badges

### Order Display Features:
- **Recent Orders Widget** on Dashboard
- **Status Color Coding** across all views
  - Pending: Gray
  - Printing: Blue
  - Packaging: Yellow
  - Ready to Ship: Purple
  - Shipped: Orange
  - Delivered: Green
- **Deadline Urgency**: Highlights orders with deadlines today or in past

---

## 5. Image Handling System

### Image URLs Storage:
Images are stored as **text URLs** in database, not as files

#### Product Images:
- **Field**: `products.imageUrl` (TEXT)
- **Stored as**: Full URL string
- **Display**: Direct HTML `<img>` tag
- **Fallback**: "No Image" placeholder text

**File**: `artifacts/figuroo/src/pages/products.tsx` (lines 72-75)
```jsx
{product.image_url ? (
  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
) : (
  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Image</div>
)}
```

#### QR Code Images (Orders):
- **Field**: `orders.easyboxQrImageUrl` (TEXT)
- **Purpose**: Tracking QR for shipping courier
- **Display**: In modal dialog on demand
- **Source**: External URL provided by user

**File**: `artifacts/figuroo/src/pages/orders.tsx`
```typescript
const showQr = (url: string) => {
  setQrUrl(url);
  setQrOpen(true);
};
```

### Image Upload Flow:
⚠️ **NOT IMPLEMENTED** - Currently users must provide complete image URLs
- No file upload endpoint
- No image server/CDN integration
- Form fields accept URLs with validation: `.url("Must be a valid URL")`

---

## 6. Frontend Structure & Pages

### Routing:
- **Router**: Wouter (lightweight React Router alternative)
- **Base**: Configurable via `import.meta.env.BASE_URL`

**File**: `artifacts/figuroo/src/App.tsx`

### Page Structure:
```
/                   Dashboard     (Home/Summary)
/orders             Orders        (List, CRUD, search)
/kanban             Kanban        (Drag-drop board)
/products           Products      (Grid, CRUD)
/inventory          Inventory     (Stock management)
/analytics          Analytics     (Charts & reports)
/settings           Settings      (User preferences)
/login              Login         (Token auth)
(default)           Not Found     (404)
```

### Layout Structure:
**File**: `artifacts/figuroo/src/components/layout/app-layout.tsx`
```
┌─────────────────────────────────────┐
│         Topbar (Header)             │
├──────────────┬──────────────────────┤
│              │                      │
│  Sidebar     │   Main Content       │
│              │   (Page Router)      │
│              │                      │
│              │                      │
└──────────────┴──────────────────────┘
```

#### Components:
- **Sidebar**: Navigation, logout
- **Topbar**: Header with user info (stub)
- **AppLayout**: Wrapper component
- **Toaster**: Toast notifications (Sonner)
- **TooltipProvider**: Global tooltips (Radix UI)

### UI Component Library:
- **Base**: Radix UI (headless components)
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **Icons**: Lucide React + React Icons
- **Forms**: React Hook Form + Zod
- **Drag-Drop**: @hello-pangea/dnd (based on react-beautiful-dnd)
- **Notifications**: Sonner

### Page Details:

#### 1. Dashboard (`dashboard.tsx`)
- Summary cards: Orders today, Active shipments, Monthly revenue, Monthly profit
- Recent orders widget (last 5)
- Uses `useGetDashboardSummary()` hook

#### 2. Orders (`orders.tsx`)
- Full-width table of all orders
- Search/filter functionality
- Create/Edit/Delete operations
- Status badges, deadline highlighting
- QR code viewer
- AWB copy-to-clipboard

#### 3. Kanban (`kanban.tsx`)
- 6 status columns (Pending → Delivered)
- Drag-and-drop order movement
- Optimistic UI updates
- Automatic status update on drop
- Color-coded order cards

#### 4. Products (`products.tsx`)
- 4-column responsive grid
- Product cards with image, name, price
- Create/Edit/Delete operations
- Hover menu for actions

#### 5. Inventory (`inventory.tsx`)
- 3-column grid of filament stock
- Progress bar showing remaining grams
- Low stock warnings (highlighted in red)
- Filament name, color, weight displayed
- Create/Edit/Delete operations

#### 6. Analytics (`analytics.tsx`)
- Revenue & Profit area chart (last 6 months)
- Top Products bar chart
- Courier Stats pie chart
- All using Recharts library
- Currency formatting on Y-axis

#### 7. Settings (`settings.tsx`)
- Profile section (name, email) - stub
- Preferences:
  - Dark mode toggle (disabled, always on)
  - **Currency selector** (USD/EUR/GBP) - non-functional
  - Deadline notifications toggle
  - Low stock warnings toggle

#### 8. Login (`login.tsx`)
- Token input field
- Form validation (required field)
- Loading state during verification
- Toast error notifications

### Data Flow:
```
Frontend (React) 
    ↓ (API calls via @workspace/api-client-react)
Backend (Express)
    ↓ (Queries via Drizzle ORM)
Database (PostgreSQL)
```

### API Client:
- **Auto-generated** from OpenAPI spec via Orval
- **Location**: `lib/api-client-react/src/generated/`
- **Hooks**: React Query hooks for each endpoint
- **Query Keys**: Auto-generated for caching

---

## Technology Stack Summary

### Backend
- Express.js (HTTP server)
- Drizzle ORM (Type-safe database queries)
- PostgreSQL (Database)
- Pino (Logging)
- Zod (Schema validation)

### Frontend
- React 18+
- TypeScript
- Vite (Build tool)
- Wouter (Routing)
- React Query (@tanstack/react-query)
- React Hook Form (Form management)
- Zod (Form validation)
- TailwindCSS (Styling)
- Radix UI (Component primitives)
- Recharts (Data visualization)
- Lucide React (Icons)
- Sonner (Toast notifications)

### Build & DevOps
- pnpm (Package manager)
- TypeScript (Compilation)
- ESBuild (Backend bundling)
- Vite (Frontend bundling)

---

## Key Observations

### Strengths:
✅ Type-safe throughout (TypeScript + Zod)  
✅ Modern React patterns (hooks, Query, form handling)  
✅ Clean separation of concerns (Frontend/Backend/DB)  
✅ Auto-generated API client from OpenAPI  
✅ Responsive UI with TailwindCSS  
✅ Good data visualization with Recharts  
✅ Monorepo structure with shared types  

### Gaps/TODO Items:
❌ No i18n/translation system  
❌ Currency selection UI non-functional  
❌ No image upload capability  
❌ No advanced authentication (no roles, permissions, expiration)  
❌ No API-level auth middleware (only endpoint verification)  
❌ Settings page largely non-functional (profile save not implemented)  
❌ No deadline notifications despite toggle  
❌ No real-time updates (dashboard may show stale data)  
❌ Limited error handling in some components  

---

## File Reference

### Key Files:
- **Frontend App**: `artifacts/figuroo/src/App.tsx`
- **Backend Server**: `artifacts/api-server/src/index.ts`
- **OpenAPI Spec**: `lib/api-spec/openapi.yaml`
- **DB Schema**: `lib/db/src/schema/`
- **Pages**: `artifacts/figuroo/src/pages/`
- **Components**: `artifacts/figuroo/src/components/`
- **API Routes**: `artifacts/api-server/src/routes/`

