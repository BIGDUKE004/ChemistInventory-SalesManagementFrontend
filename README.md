# Apothic

React + Redux Toolkit frontend for the Chemist Spring Boot backend — stock, sales
and staff on one counter screen.

## Run it

```bash
npm install
npm run dev
```

Opens on `http://localhost:5500` — that's deliberate. Your backend's `SecurityConfig`
already allows CORS from that exact origin, so you shouldn't need to change anything
on the backend to make this connect.

## What's wired up

- Register / Login (`/Authorization/Register`, `/Authorization/Login`) — stores the JWT
  in Redux and in `localStorage` so a refresh doesn't log you out.
- Add drug / Delete drug by ID (`/DrugManagement/AddDrug`, `/DrugManagement/DeleteDrug`)
- Dispense a sale (`/Sales/dispenseDrug`)
- Logout (`/Authorization/Logout`)
- A live activity log of every request and response (Redux `log` slice), so you can see
  exactly what the frontend sent and what the backend returned.

## What's not wired up, and why

`ViewDrugDetails`, `SearchDrug`, and `GetAmountOfDrugs` are `@GetMapping` endpoints that
read a `@RequestBody`. Browsers refuse to send a body on a GET request (`fetch` throws),
so these can't be called from any frontend as they're currently written. Convert them to
`@RequestParam` or path variables on the backend, and add the calls to `src/api.js` +
a panel in `src/components/Dashboard.jsx`.

## Project structure

```
src/
  api.js                fetch wrapper, logs every call to Redux
  store/
    store.js             combines the three slices
    authSlice.js          token, username, persisted session
    logSlice.js            activity log entries
    configSlice.js          API base URL
  components/
    Auth.jsx              landing + login/register
    Dashboard.jsx           inventory, dispense, activity log
  App.jsx                switches Auth vs Dashboard on auth.token
  main.jsx                Redux Provider + render
  index.css              all styling
```
