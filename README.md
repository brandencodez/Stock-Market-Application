  <div>
    <img src="https://img.shields.io/badge/-Next.js-black?style=for-the-badge&logoColor=white&logo=next.js&color=black"/>
    <img src="https://img.shields.io/badge/-Better Auth-black?style=for-the-badge&logoColor=white&logo=betterauth&color=black"/>
<img src="https://img.shields.io/badge/-Shadcn-black?style=for-the-badge&logoColor=white&logo=shadcnui&color=black"/>
<img src="https://img.shields.io/badge/-Inngest-black?style=for-the-badge&logoColor=white&logo=inngest&color=black"/><br/>

<img src="https://img.shields.io/badge/-MongoDB-black?style=for-the-badge&logoColor=white&logo=mongodb&color=00A35C"/>
<img src="https://img.shields.io/badge/-TailwindCSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=38B2AC"/>
<img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6"/>

  </div>

  <h3 align="center">Stock Market App — Alerts, Charts, AI Insights</h3>


## 📋 <a name="table">Table of Contents</a>

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🤸 [Quick Start](#quick-start)

## <a name="introduction">✨ Introduction</a>

The stock market moves fast, and staying informed can be overwhelming. This platform simplifies investing by combining real-time market data, personalized news, and AI-driven insights into one seamless experience. Built with Next.js, it integrates live stock prices and market news via Finnhub and TradingView APIs, helping users make confident investment decisions.
Key features include:
- AI-powered stock recommendations using Moonshot Kimi K2 Pro API, tailored to user profiles, portfolios, and risk preferences
- Portfolio Health Score with quick suggestions for optimization
- Automated notifications via Email and WhatsApp using Twilio and Nodemailer, scheduled with Inngest Cron.
- Personalized, timely news feed aligned with user watchlists

Stay informed, manage risk, and get actionable insights — all in one adaptive, investor-focused platform.

## SignUp / Login Page
![Image](https://github.com/user-attachments/assets/1a5d0e66-9f83-470b-8f25-7775fb50b251)

## Home Dashboard
![Image](https://github.com/user-attachments/assets/4f01a0cd-cc20-47e3-96b5-ff86a88cdafb)

## Watchlist
![Image](https://github.com/user-attachments/assets/fbd526ad-d228-4f90-b370-4b10d25952a9)

## AI Recommendations
![Image](https://github.com/user-attachments/assets/8c2f667c-e3b1-47df-a507-87153beb6bf3)

## Email Notification
![Image](https://github.com/user-attachments/assets/4c6b5442-faf6-483e-8e6f-f41549d278e0)

## WhatsApp Notification
![Image](https://github.com/user-attachments/assets/1b6a2989-b2f7-41fa-be98-af54c56b103c)


## <a name="tech-stack">⚙️ Tech Stack</a>

- **[Better Auth](https://www.better-auth.com/)** is a framework-agnostic authentication and authorization library for TypeScript. It provides built-in support for email/password login, social sign-on (Google, GitHub, Apple, and more), and multi-factor authentication, simplifying user authentication and account management.

- **[Finnhub](https://finnhub.io/)** is a real-time financial data API that provides stock, forex, and cryptocurrency market data. It offers developers access to fundamental data, economic indicators, and news, making it useful for building trading apps, dashboards, and financial analysis tools.

- **[Inngest](https://jsm.dev/stocks-inngest)** is a platform for event-driven workflows and background jobs. It allows developers to build reliable, scalable automated processes such as real-time alerts, notifications, and AI-powered workflows.

- **[MongoDB](https://www.mongodb.com/)** is a flexible, high-performance NoSQL database. It stores data in JSON-like documents, supports dynamic schemas, and provides robust features for scalability, replication, and querying.

- **[Nodemailer](https://nodemailer.com/)** is a Node.js library for sending emails easily. It supports various transport methods such as SMTP, OAuth2, and third-party services, making it a reliable tool for handling transactional emails, notifications, and contact forms in applications.

- **[Twilio](https://login.twilio.com/u/signup)** is a cloud communications platform that lets developers send SMS, WhatsApp messages, make voice calls, and build real-time communication features. It offers robust APIs, global reach, and easy integration for notifications, alerts, and customer engagement in applications.

- **[Next.js](https://nextjs.org/docs)** is a powerful React framework for building full-stack web applications. It provides server-side rendering, static site generation, and API routes, allowing developers to create optimized and scalable apps quickly.

- **[Shadcn](https://ui.shadcn.com/docs)** is an open-source library of fully customizable, accessible React components. It helps teams rapidly build consistent, visually appealing UIs while allowing full control over design and layout.

- **[TailwindCSS](https://tailwindcss.com/)** is a utility-first CSS framework that allows developers to build custom, responsive designs quickly without leaving their HTML. It provides pre-defined classes for layout, typography, colors, and more.

- **[TypeScript](https://www.typescriptlang.org/)** is a statically typed superset of JavaScript that improves code quality, tooling, and error detection. It is ideal for building large-scale applications and enhances maintainability.

## <a name="features">🔋 Features</a>

👉 **Stock Dashboard**: Track real-time stock prices with interactive line and candlestick charts, including historical data, and filter stocks by industry, performance, or market cap.

👉 **Powerful Search**: Quickly find the best stocks with an intelligent search system that helps you navigate through Signalist.

👉 **Watchlist & Alerts**: Create a personalized watchlist, set alert thresholds for price changes or volume spikes, and receive instant email and WhatsApp notifications to stay on top of the market.

👉 **Portfolio Health Score**: A rule-based quantitative risk scoring system that evaluates a user’s watchlist using price volatility, sector exposure, and diversification metrics. Deterministic mathematical calculations categorize stocks into Low, Medium, or High risk, enabling users to quickly assess portfolio stability and concentration risk at a glance.

👉 **AI-Powered Recommendations and Smart Suggestions**: Delivers personalized stock recommendations tailored to each user’s profile, risk appetite, and investment goals, along with proactive suggestions driven by real-time portfolio health scores to optimize performance and manage risk effectively.

👉 **Company Insights**: Explore detailed financial data such as PE ratio, EPS, revenue, recent news, filings, analyst ratings, and sentiment scores for informed decision-making.

👉 **Personalized News Feed**: Delivers curated news and updates tailored to each user’s interests, focusing specifically on the stocks and sectors in their watchlist to keep them informed and ahead of market developments.

👉 **Real-Time Workflows**: Powered by **Inngest**, automate event-driven processes like price updates, alert scheduling, automated reporting, and AI-driven insights.

👉 **Analytics & Insights**: Gain insights into user behavior, stock trends, and engagement metrics, enabling smarter business and trading decisions.

And many more, including code architecture and reusability.

## <a name="quick-start">🤸 Quick Start</a>

Follow these steps to set up the project locally on your machine.

**Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

**Cloning the Repository**

```bash
git clone https://github.com/adrianhajdin/signalist_stock-tracker-app.git
cd signalist_stock-tracker-app
```

**Installation**

Install the project dependencies using npm:

```bash
npm install
```

**Set Up Environment Variables**

Create a new file named `.env` in the root of your project and add the following content:

```env
NODE_ENV='development'
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# FINNHUB
NEXT_PUBLIC_NEXT_PUBLIC_FINNHUB_API_KEY=
FINNHUB_BASE_URL=https://finnhub.io/api/v1

# MONGODB
MONGODB_URI=

# BETTER AUTH
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# GROQ API
GROQ_API_KEY

#NODEMAILER
NODEMAILER_EMAIL=
NODEMAILER_PASSWORD=

# TWILIO
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=whatsapp:
TEST_PHONE_NUMBER=
```

Replace the placeholder values with your real credentials. You can get these by signing up at: [**MongoDB**](https://www.mongodb.com/products/platform/atlas-database), [**Gemini**](https://aistudio.google.com/prompts/new_chat?utm_source=chatgpt.com), [**Inngest**](https://jsm.dev/stocks-inggest), [**Finnhub**](https://finnhub.io). [**Twilio**](https://www.twilio.com/try-twilio)

**Running the Project**

```bash
npm run dev
npx inngest-cli@latest dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the project.
