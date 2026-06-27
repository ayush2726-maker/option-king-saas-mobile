# Option King AI — SaaS Mobile App

Multi-user F&O trading bot app for all users.

## Yeh alag hai personal bot app se!

| | Personal Bot App | SaaS App (Yeh) |
|---|---|---|
| Repo | option-king-ai-mobile | option-king-saas-mobile |
| Users | Sirf Ayush | Sabke liye |
| Backend | Termux local bot | Railway SaaS server |
| Login | Nahi | Haan (JWT) |

## Features
- Login / Register
- 7-day Free Trial
- Broker connect (Angel One, Zerodha, Upstox)
- Subscription plans (₹999/month, ₹1999/month)
- Account management

## Backend
Railway: https://option-king-saas-production.up.railway.app

## Build
```bash
npm install
eas build --platform android --profile preview
```
