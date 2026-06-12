---
name: Play9ja admin API hook names
description: Generated Orval hooks for admin routes use non-obvious names — grep api.ts before writing admin pages
---

The generated hooks for admin operations do NOT follow the `use<Get/Update>Admin*` pattern uniformly. Always grep `lib/api-client-react/src/generated/api.ts` before using hooks.

Key mappings:
- Users list: `useListAdminUsers` (not `useGetAdminUsers`)
- Membership list: `useListAdminMemberships`
- Membership update: `useUpdateMembershipStatus` (not `useUpdateAdminMembership`)
- Deposit list: `useListAdminDeposits`
- Deposit update: `useUpdateDepositStatus`
- Withdrawal list: `useListAdminWithdrawals`
- Withdrawal update: `useUpdateWithdrawalStatus`
- Games list: `useListAdminGames`
- Game update: `useUpdateGame` (not `useUpdateAdminGame`)
- Activity messages: `useListActivityMessages`, `useCreateActivityMessage`, `useUpdateActivityMessage`, `useDeleteActivityMessage`
- Broadcast: `useBroadcastMessage`
- Settings: `useGetAdminSettings`, `useUpdateAdminSettings` ✓

**Why:** Orval generates names from operationId in the OpenAPI spec, not from the route path prefix. The admin CRUD operations often share operationIds with user-facing versions.

**How to apply:** Run `grep "^export function use\|^export const use" lib/api-client-react/src/generated/api.ts | grep -i admin` to discover hook names before writing admin components.
