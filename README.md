# Expense Tracker — API Reference & UI Guide

> Base URL: `http://localhost:3000/api`
> All routes except `/auth/signup` and `/auth/login` require `Authorization: Bearer <token>`

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Data Flow & Relations](#data-flow--relations)
3. [Monthly Workflow](#monthly-workflow)
4. [Auth](#auth)
5. [Income](#income)
6. [Allocations](#allocations)
7. [Categories](#categories)
8. [Budget Rules](#budget-rules)
9. [Transactions](#transactions)
10. [Envelope Transfers](#envelope-transfers)
11. [Periodic Accruals](#periodic-accruals)
12. [UI Screen Guide](#ui-screen-guide)

---

## Core Concepts

Before building any UI screen, understand these 4 pillars:

### 1. The Three Envelopes
Every rupee in this app belongs to one of three envelopes:

| Envelope | `allocation_type` | What goes here |
|---|---|---|
| Fixed Cut | `fixed_cut` | Money sent to parents every month, non-negotiable |
| Expenses | `expenses` | All day-to-day spending — mandatory + non-mandatory |
| Savings | `savings` | Investments, savings, buffer |

Every income entry is split across these three envelopes via **Allocations**.

### 2. Percentage-First Allocations
Allocations are stored as **percentages**, not amounts. The amount is always derived from `income.amount × percentage / 100`. This means when income changes next month, you only need to re-run allocations — the percentages stay the same.

### 3. Monthly Equivalent Normalization
Some bills are periodic (gym every 4 months, WiFi every 4 months). The system normalizes these into a **monthly equivalent** so your monthly budget view is always accurate.

- Gym: ₹2000 every 4 months → `monthly_equivalent_amount = ₹500/month`
- WiFi: ₹1200 every 4 months → `monthly_equivalent_amount = ₹300/month`

This is stored in `BudgetRule.monthly_equivalent_amount`.

### 4. Envelope Transfers are Ledger Rows
When you move money between envelopes (savings → fixed_cut because parents needed extra), the base allocations are **never modified**. Instead a new `EnvelopeTransfer` row is added. The real balance is always `base_allocation ± transfers`.

---

## Data Flow & Relations

```
User
 ├── IncomeEntry (salary received)
 │    └── Allocation × 3 (fixed_cut %, expenses %, savings %)
 │
 ├── Category (Medical, Gym, Parents, etc.)
 │    ├── parent_category_id → Category (self-ref for sub-categories)
 │    └── BudgetRule (one per category, optional)
 │         └── PeriodicAccrual (one row per month for periodic bills)
 │
 ├── Transaction (every rupee spent/saved/transferred)
 │    └── category_id → Category
 │
 └── EnvelopeTransfer (money moved between envelopes)
```

### Key Foreign Key Rules

| Field | Points To | Rule |
|---|---|---|
| `allocation.income_entry_id` | `income_entries.id` | Delete income → delete allocations |
| `allocation.user_id` | `users.id` | Every allocation belongs to a user |
| `category.parent_category_id` | `categories.id` | Nullable, null = top-level category |
| `budget_rule.category_id` | `categories.id` | One rule per category max |
| `transaction.category_id` | `categories.id` | Nullable, SET NULL on category delete |
| `periodic_accrual.budget_rule_id` | `budget_rules.id` | Delete rule → delete accruals |
| `periodic_accrual.settled_transaction_id` | `transactions.id` | Nullable until settled |
| `envelope_transfer.user_id` | `users.id` | No FK to income — pure ledger |

---

## Monthly Workflow

This is the exact order of operations every month. Build your UI around this flow.

```
START OF MONTH
──────────────
1. POST /income              ← Log salary received
2. POST /allocations/income/:id  ← Split into 3 envelopes (must sum to 100%)
3. POST /periodic-accruals/accrue?month=X&year=Y  ← Generate accrual rows for periodic bills

DURING MONTH
────────────
4. POST /transactions        ← Log every expense/payment
5. POST /envelope-transfers  ← If you need to move money between envelopes
6. PATCH /periodic-accruals/:id/settle  ← When you actually pay a periodic bill

END OF MONTH REVIEW
───────────────────
7. GET /transactions/summary?month=X&year=Y     ← Total per envelope
8. GET /transactions/breakdown?month=X&year=Y   ← Total per category
9. GET /periodic-accruals/unsettled             ← What's still unpaid
```

---

## Auth

### Signup
**`POST /auth/signup`** — Public, no token needed.
Auto-seeds 12 default categories for the new user.

```json
// Request
{
  "username": "ganesh_sharma",
  "name": "Ganesh Sharma",
  "password": "secret123"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "ganesh_sharma",
      "name": "Ganesh Sharma",
      "email": null
    },
    "access_token": "eyJhbGci..."
  }
}
```

**UI:** Store `access_token` in memory/secure storage. Attach as `Authorization: Bearer <token>` on every subsequent request. Token expires in 7 days.

---

### Login
**`POST /auth/login`** — Public, no token needed.

```json
// Request
{ "username": "ganesh_sharma", "password": "secret123" }

// Response — same shape as signup
{ "user": {...}, "access_token": "eyJhbGci..." }
```

---

## Income

Income entries represent salary/money received. Every income entry must have allocations created for it before it's useful.

### Create Income Entry
**`POST /income`**

```json
// Request
{
  "amount": 30000,
  "received_on": "2026-03-01",
  "notes": "March salary"
}

// Response
{
  "id": 16,
  "amount": "30000.00",
  "received_on": "2026-03-01",
  "notes": "March salary",
  "user_id": 17,
  "allocations": [],
  "created_at": "2026-03-01T...",
  "updated_at": "2026-03-01T..."
}
```

> ⚠️ `allocations` is empty at this point. You MUST call `POST /allocations/income/:id` next.

---

### Get All Income
**`GET /income`** — Returns all income entries with allocations joined.

```json
// Response
[
  {
    "id": 16,
    "amount": "30000.00",
    "received_on": "2026-03-01",
    "allocations": [
      { "allocation_type": "fixed_cut", "percentage": "33.33", "amount": "9999.00" },
      { "allocation_type": "expenses",  "percentage": "33.33", "amount": "9999.00" },
      { "allocation_type": "savings",   "percentage": "33.34", "amount": "10002.00" }
    ]
  }
]
```

**UI:** Use this to build an income history list. Show the 3 allocation amounts alongside each income entry.

---

### Get One Income
**`GET /income/:id`** — Returns income with allocations joined.

---

### Update Income
**`PATCH /income/:id`**

```json
{ "notes": "March salary - updated" }
```

---

### Delete Income
**`DELETE /income/:id`** — Also deletes all allocations for that income entry (CASCADE).

---

## Allocations

Allocations split one income entry into the three envelopes. Always send all 3 types in a single request.

### Create Allocations for Income Entry
**`POST /allocations/income/:incomeId`**

```json
// Request — array of exactly 3, must include all 3 types, must sum to 100%
[
  { "allocation_type": "fixed_cut", "percentage": 33.33 },
  { "allocation_type": "expenses",  "percentage": 33.33 },
  { "allocation_type": "savings",   "percentage": 33.34 }
]

// Response — 3 allocation objects with calculated amounts
[
  {
    "id": 1,
    "income_entry_id": 16,
    "allocation_type": "fixed_cut",
    "percentage": "33.33",
    "amount": "9999.00",
    "user_id": 17
  },
  ...
]
```

**Rules:**
- Exactly 3 types required: `fixed_cut`, `expenses`, `savings`
- Percentages must sum to exactly 100
- Calling this again for the same income entry **replaces** existing allocations
- `amount` is auto-calculated — never send it manually

**UI:** After creating income, immediately show a "Set Allocations" step with 3 sliders/inputs that enforce the 100% rule before submitting.

---

### Get Allocations for Income Entry
**`GET /allocations/income/:incomeId`**

---

### Get All Allocations
**`GET /allocations`** — All allocations across all income entries, with `incomeEntry` joined.

---

## Categories

Categories are seeded automatically on signup. Users can add custom ones. Support a two-level tree (parent → children).

### Default Categories Created on Signup

| Name | Type | Envelope |
|---|---|---|
| Medical | mandatory | expenses |
| Electricity | mandatory | expenses |
| LPG Gas | mandatory | expenses |
| Petrol | mandatory | expenses |
| WiFi | mandatory | expenses |
| Gym | non_mandatory | expenses |
| Diet | non_mandatory | expenses |
| Casual Food | non_mandatory | expenses |
| Clothing | non_mandatory | expenses |
| Parents | — | fixed_cut |
| Savings | — | savings |
| Investment | — | savings |

---

### Get Category Tree
**`GET /categories/tree`** — Parents with children nested inside. Use this for the category management screen.

```json
[
  {
    "id": 6,
    "name": "Gym",
    "category_type": "non_mandatory",
    "allocation_type": "expenses",
    "icon": "💪",
    "color": "#28B463",
    "is_active": true,
    "parent_category_id": null,
    "children": [
      {
        "id": 25,
        "name": "Protein Supplements",
        "icon": "💊",
        "parent_category_id": 6
      }
    ]
  }
]
```

---

### Get Flat List
**`GET /categories`** — All active categories, no nesting. Use this for dropdowns when creating a transaction.

---

### Create Category
**`POST /categories`**

```json
// Top-level category
{
  "name": "OTT Subscriptions",
  "category_type": "non_mandatory",
  "allocation_type": "expenses",
  "icon": "📺",
  "color": "#E50914"
}

// Sub-category under Gym (id: 6)
{
  "name": "Protein Supplements",
  "parent_category_id": 6,
  "icon": "💊"
}
```

**Rules:**
- Child inherits parent's `allocation_type` if you don't specify one
- Cannot set a category as its own parent (circular reference guard)

---

### Deactivate Category
**`PATCH /categories/:id/deactivate`** — Soft delete. Hides from flat list but preserves transaction history. Prefer this over hard delete.

---

### Hard Delete
**`DELETE /categories/:id`** — Only use if no transactions exist for this category.

---

## Budget Rules

One budget rule per category. Defines how much you expect to spend and at what frequency. Mandatory for periodic bills (anything not monthly).

### Create Budget Rule
**`POST /budget-rules`**

```json
// Gym — paid every 4 months
{
  "category_id": 17,
  "actual_period_amount": 2000,
  "billing_cycle_months": 4,
  "expected_spend": 2000,
  "expected_saved": 0,
  "notes": "Gym membership"
}

// Response — monthly_equivalent_amount is auto-calculated
{
  "id": 1,
  "category_id": 17,
  "actual_period_amount": "2000.00",
  "billing_cycle_months": 4,
  "monthly_equivalent_amount": "500.00",  // ← 2000 / 4
  "expected_spend": "2000.00",
  "expected_saved": "0.00"
}
```

**Rules:**
- `billing_cycle_months` must be one of: `1, 2, 3, 4, 6, 12`
- `monthly_equivalent_amount` is always auto-derived — never send it
- Only one rule per category — PATCH to update, don't create again
- Monthly bills (`billing_cycle_months: 1`) won't generate periodic accruals

---

### Get All Rules
**`GET /budget-rules`** — With `category` joined.

---

### Get Rule for Specific Category
**`GET /budget-rules/category/:categoryId`**

**UI:** When a user taps a category, fetch this to show what the budget rule is. If null, show "No budget rule set."

---

### Update Rule
**`PATCH /budget-rules/:id`** — `monthly_equivalent_amount` is recalculated automatically if `actual_period_amount` or `billing_cycle_months` changes.

---

## Transactions

The most used module. Every rupee that moves gets recorded here.

### Create Transaction
**`POST /transactions`**

```json
// Expense
{
  "category_id": 17,
  "amount": 500,
  "transaction_date": "2026-03-06",
  "transaction_type": "expense",
  "payment_method": "upi",
  "notes": "Tank full"
}

// Fixed cut (parents)
{
  "category_id": 23,
  "amount": 5000,
  "transaction_date": "2026-03-01",
  "transaction_type": "fixed_cut"
}

// Savings / Investment
{
  "category_id": 24,
  "amount": 3000,
  "transaction_date": "2026-03-05",
  "transaction_type": "savings"
}
```

**`transaction_type` values:**
| Value | When to use |
|---|---|
| `expense` | Day-to-day spending from expenses envelope |
| `fixed_cut` | Money sent to parents |
| `savings` | Money moved to savings/investment |
| `investment` | Invested in stocks/mutual funds etc. |

**`payment_method` values:** `cash`, `upi`, `card`, `auto_debit`

---

### Get All Transactions (with filters)
**`GET /transactions?month=3&year=2026&transaction_type=expense&category_id=17&page=1&limit=20`**

All params are optional. Returns paginated result:

```json
{
  "data": [ ...transactions with category joined... ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

**UI filter options:**
- Month + Year picker
- Transaction type dropdown
- Category dropdown (use flat list from `/categories`)
- Pagination controls

---

### Monthly Summary
**`GET /transactions/summary?month=3&year=2026`**

```json
{
  "expense": 8400.00,
  "fixed_cut": 5000.00,
  "savings": 5000.00,
  "investment": 0.00
}
```

**UI:** Use this for the main dashboard — show 4 cards, one per envelope, with spent vs budgeted.

---

### Category Breakdown
**`GET /transactions/breakdown?month=3&year=2026`**

```json
[
  { "category_id": 17, "name": "Petrol",      "total": 1500.00 },
  { "category_id": 23, "name": "Parents",     "total": 5000.00 },
  { "category_id": 19, "name": "Gym",         "total": 2000.00 },
  { "category_id": 21, "name": "Casual Food", "total": 900.00 }
]
```

Sorted by highest spend. **UI:** Pie chart or horizontal bar list.

---

### Get / Update / Delete One Transaction
```
GET    /transactions/:id
PATCH  /transactions/:id
DELETE /transactions/:id
```

---

## Envelope Transfers

When you need to move money between envelopes. These are ledger rows — they never modify the original allocation.

### Create Transfer
**`POST /envelope-transfers`**

```json
{
  "from_allocation_type": "savings",
  "to_allocation_type": "fixed_cut",
  "amount": 800,
  "reason": "Parents medical this month",
  "transfer_date": "2026-03-05",
  "month": 3,
  "year": 2026
}
```

**Rules:**
- `from` and `to` cannot be the same envelope
- `reason` is required — must justify why money moved
- `month` + `year` must match the budget period this transfer belongs to
- These do NOT create transactions — they only adjust envelope balances

**UI:** Show a "Transfer between envelopes" button. Pre-fill month/year from the current month view. Disable the submit button if from === to.

---

### Get Transfers for a Month
**`GET /envelope-transfers/month?month=3&year=2026`**

**UI:** Show these in the monthly detail view alongside allocations so the user can see the real available balance per envelope.

---

### Full Transfer History
**`GET /envelope-transfers`**

---

## Periodic Accruals

Tracks monthly savings toward periodic bills. If gym is ₹2000 every 4 months, this creates a ₹500 row every month so you know money is being "set aside."

### Generate Accruals for a Month
**`POST /periodic-accruals/accrue?month=3&year=2026`**

Call at the start of every month. Scans all budget rules where `billing_cycle_months > 1` and creates one accrual row per rule. **Safe to call multiple times — idempotent.**

```json
// Response — one object per periodic budget rule
[
  {
    "id": 1,
    "budget_rule_id": 1,
    "month": 3,
    "year": 2026,
    "accrued_amount": "500.00",
    "is_settled": false,
    "settled_transaction_id": null,
    "budgetRule": {
      "category": { "name": "Gym", "icon": "💪" }
    }
  }
]
```

---

### Get Accruals for a Month
**`GET /periodic-accruals/month?month=3&year=2026`**

Returns all accruals sorted by `is_settled ASC` (pending first).

**UI:** Show as a "Bills this month" section. Settled ones appear greyed out at the bottom.

---

### Get Unsettled Accruals
**`GET /periodic-accruals/unsettled`**

All pending accruals across all months. **UI:** Show as a notification badge or "Pending bills" widget on the dashboard.

---

### Settle an Accrual
Two steps — first log the transaction, then settle the accrual:

**Step 1 — Log the actual payment as a transaction:**
```json
POST /transactions
{
  "category_id": 19,
  "amount": 2000,
  "transaction_date": "2026-03-10",
  "transaction_type": "expense"
}
// → returns transaction with id e.g. 42
```

**Step 2 — Mark the accrual as settled:**
```json
PATCH /periodic-accruals/:accrualId/settle
{ "settled_transaction_id": 42 }
```

**UI:** In the accruals list, each unsettled row should have a "Mark as Paid" button that opens a drawer to log the transaction, then auto-calls settle with the returned transaction id.

---

### Unsettle an Accrual
**`PATCH /periodic-accruals/:id/unsettle`** — No body required. Reverses a settlement. Sets `is_settled = false` and clears `settled_transaction_id`.

---

## UI Screen Guide

### Screen 1 — Dashboard (Home)
**APIs to call on load:**
```
GET /transactions/summary?month=X&year=Y
GET /transactions/breakdown?month=X&year=Y
GET /periodic-accruals/unsettled
GET /income  (to show latest income + allocation amounts)
```

**What to show:**
- 3 envelope cards: Budget vs Spent for fixed_cut / expenses / savings
- Category breakdown chart
- "Pending Bills" badge from unsettled accruals
- Latest income entry with allocation split

---

### Screen 2 — Add Transaction (most used screen)
**APIs to call on load:**
```
GET /categories  ← flat list for the category dropdown
```

**On submit:**
```
POST /transactions
```

**Fields:** Amount, Date, Category (dropdown), Type, Payment Method, Notes

---

### Screen 3 — Monthly View
**APIs to call:**
```
GET /transactions?month=X&year=Y&page=1&limit=20
GET /transactions/summary?month=X&year=Y
GET /envelope-transfers/month?month=X&year=Y
GET /periodic-accruals/month?month=X&year=Y
```

**What to show:**
- Transaction list (paginated, filterable)
- Envelope summary at top
- Transfers section (shows envelope adjustments)
- Periodic bills section (settled/unsettled)

---

### Screen 4 — Income & Allocations
**APIs to call on load:**
```
GET /income
```

**Add new income flow:**
1. `POST /income` → get back income `id`
2. Show allocation slider (3 inputs, enforce sum = 100%)
3. `POST /allocations/income/:id`

---

### Screen 5 — Categories
**APIs to call on load:**
```
GET /categories/tree
```

**Actions:**
- `POST /categories` — add new
- `PATCH /categories/:id` — edit
- `PATCH /categories/:id/deactivate` — hide

---

### Screen 6 — Budget Rules
**APIs to call on load:**
```
GET /budget-rules
GET /categories  ← to show category name in the form
```

**Create rule flow:**
1. Pick a category from flat list
2. Enter `actual_period_amount` + `billing_cycle_months`
3. `POST /budget-rules` → show auto-calculated `monthly_equivalent_amount`

---

### Screen 7 — Start of Month Checklist
UI prompt at start of each month with these steps:

```
[ ] 1. Log income            → POST /income
[ ] 2. Set allocations       → POST /allocations/income/:id
[ ] 3. Generate accruals     → POST /periodic-accruals/accrue?month=X&year=Y
```

---

## Enum Reference

```typescript
// allocation_type
"fixed_cut" | "expenses" | "savings"

// category_type
"mandatory" | "non_mandatory"

// transaction_type
"expense" | "fixed_cut" | "savings" | "investment"

// payment_method
"cash" | "upi" | "card" | "auto_debit"

// billing_cycle_months (budget rules)
1 | 2 | 3 | 4 | 6 | 12
```

---

## Common Gotchas

| Situation | What happens | What to do in UI |
|---|---|---|
| Income created but no allocations | `allocations: []` on income | Force allocation step before allowing transactions |
| Periodic accruals not generated | No accrual rows for the month | Prompt user to run accrue at month start |
| Category deactivated | Disappears from flat list | Still shows on existing transactions via join |
| Envelope transfer created | Base allocations unchanged | Fetch transfers separately to show real balance |
| Budget rule updated | `monthly_equivalent_amount` auto-recalculates | Re-fetch and display updated value |
| Same category rule exists | `400 Bad Request` | Show "Edit existing rule" instead of create form |
| Percentages don't sum to 100 | `400 Bad Request` | Enforce client-side before submitting |