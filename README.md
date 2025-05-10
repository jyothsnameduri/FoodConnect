# 🍽️ FoodConnect - Community Food Donation & Request Platform

## 🌟 Overview

FoodConnect is a powerful community-driven platform that bridges the gap between food surplus and scarcity. It enables neighbors to coordinate food donations and requests in real-time, reducing waste and fighting hunger simultaneously.

## 🎯 Mission

To create a sustainable ecosystem where surplus food finds its way to those who need it most, fostering community connections and reducing food waste.

## ✨ Key Features

- **📝 Post Donations & Requests**: Users can easily create posts to donate food or request meals
- **🗺️ Interactive Map View**: Browse nearby offers and needs with an intuitive map interface
- **⏱️ Real-time Status Tracking**: Follow posts from creation to completion with a clear timeline
- **👥 Claim & Confirm Flow**: Simple process for claiming donations and confirming pickups
- **🔔 Smart Notifications**: Stay informed with timely alerts about claims, approvals, and expiring posts
- **⭐ Reputation System**: Build trust through ratings and reviews after successful exchanges

## 🛠️ Tech Stack

### Frontend
- **React**: Modern UI library for building interactive interfaces
- **TypeScript**: Type-safe JavaScript for robust code
- **TailwindCSS**: Utility-first CSS framework for responsive design
- **Shadcn/UI**: Component library built on Radix UI primitives
- **React Hook Form**: Form validation and handling
- **Zod**: Schema validation
- **Mapbox GL**: Interactive mapping capabilities
- **Wouter**: Lightweight routing solution
- **React Query**: Data fetching and state management

### Backend
- **Express.js**: Fast, unopinionated web framework for Node.js
- **Drizzle ORM**: TypeScript ORM for SQL databases
- **PostgreSQL (Neon)**: Serverless Postgres database
- **Passport.js**: Authentication middleware
- **Multer**: File upload handling
- **WebSockets**: Real-time communication

### Development & Deployment
- **Vite**: Next-generation frontend tooling
- **TypeScript**: End-to-end type safety
- **ESBuild**: Fast JavaScript bundler

## 🔄 Core Workflow

1. **Post Creation**: Users create donation or request posts with details (description, quantity, location, expiry date)
2. **Discovery**: Community members browse the feed or map to find relevant posts
3. **Claiming**: Interested users claim posts they want to fulfill
4. **Approval**: Post owners approve claims and coordinate pickups
5. **Completion**: After successful exchange, users mark posts as completed
6. **Rating**: Both parties can rate each other to build community trust

## 📊 Data Model

- **Users**: Account information, reputation metrics, and profile details
- **Food Posts**: Donation/request details, status, location, and expiry information
- **Claims**: Tracking who claimed what, with pickup arrangements
- **Ratings**: User feedback system for building trust
- **Notifications**: System for keeping users informed
- **Messages**: In-app communication between users

## 🔐 Authentication & Authorization

- Login required to post or claim donations/requests
- Public browsing allowed without login
- Secure session management

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npm run migrations:push`
5. Start the development server: `npm run dev`

## 💡 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
