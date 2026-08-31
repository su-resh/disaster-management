# Rescue Platform

**Emergency Response & Disaster Coordination Platform**

A real-time dashboard for emergency response teams to coordinate disaster operations, track emergency requests, and manage rescue efforts during crises.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Overview
The Rescue Platform is a specialized dashboard designed for emergency coordinators and disaster response teams. It provides real-time visibility into emergency situations, enabling faster decision-making and more effective coordination of rescue operations during disasters, humanitarian crises, and emergency scenarios.

Built with Next.js and Supabase, the platform combines interactive mapping, real-time data synchronization, and intuitive emergency tracking to help response teams save lives when every second counts.

## Key Features
- 🆘 **Real-Time Emergency Tracking**: Live map view of active emergencies with color-coded severity indicators
- 📍 **Geospatial Awareness**: Interactive maps showing exact emergency locations with detailed popups
- 🚨 **Status & Severity Management**: Track emergency progression through statuses (NEW → VERIFIED → ASSIGNED → RESPONDER_ON_WAY → RESCUING → RESCUED) and severity levels (Critical, High, Medium, Low)
- 👥 **Impact Assessment**: Monitor affected populations, injury counts, and special needs requirements
- 📱 **Responsive Design**: Accessible on desktop and tablet devices for field and command center use
- ⚡ **Instant Updates**: Real-time synchronization via Supabase Realtime for all connected clients
- 🔒 **Secure Authentication**: Protected access for authorized emergency personnel only
- 💬 **Detailed Emergency Info**: Complete emergency descriptions, contact information, location details, and disaster type classification

## Architecture
The system follows a modern web architecture optimized for emergency response scenarios:
- **Frontend**: Next.js 16+ with React 19 for responsive, real-time UI
- **Backend**: Supabase providing PostgreSQL database, authentication, and real-time subscriptions
- **Mapping**: MapLibre GL for interactive, offline-capable emergency maps
- **State Management**: React hooks combined with Supabase real-time subscriptions
- **Security**: Row-level security (RLS) in Supabase ensuring data protection

For detailed architecture diagrams and technical explanations, see [docs/architecture.md](./docs/architecture.md).

## Getting Started

### Prerequisites
- Node.js (v20+)
- npm or yarn
- Supabase account
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation
1. Clone the repository
2. Install dependencies for the dashboard:
   ```bash
   cd dashboard
   npm install
   ```
3. Install root dependencies (if any):
   ```bash
   npm install
   ```

### Environment Variables
Create a `.env.local` file in the `dashboard` directory with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
You can find these values in your Supabase project settings under **API** > **Project API keys**.

## Usage
### Development
Start the development server:
```bash
cd dashboard
npm run dev
```
The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production
```bash
cd dashboard
npm run build
npm run start
```

### Using the Platform
1. **Login** with authorized emergency responder credentials
2. **View Active Emergencies** on the dashboard - emergencies appear as color-coded markers on the map
3. **Filter & Sort** by status (NEW, VERIFIED, ASSIGNED, etc.) and severity (Critical, High, Medium, Low)
4. **Click on Markers** or list items to view detailed emergency information
5. **Monitor Real-Time Updates** as new emergencies are reported and situations evolve
6. **Coordinate Response** by assigning teams, tracking progress, and updating statuses

## Documentation
Comprehensive documentation is available in the `docs/` directory:
- [Architecture Overview](./docs/architecture.md) - System design and components
- [Development Guide](./docs/development.md) - Setup, coding standards, and workflows
- [Database Schema](./docs/database.md) - Tables, relationships, and constraints (emergency_requests, severity_levels, disaster_types)
- [Realtime Implementation](./docs/realtime.md) - Real-time features and subscriptions for live updates
- [Authentication Flow](./docs/authentication.md) - User authentication and role-based access control
- [Deployment Guide](./docs/deployment.md) - Deployment environments and CI/CD pipelines
- [Security Model](./docs/security.md) - Security practices, data protection, and compliance
- [Contributing Guidelines](./docs/contributing.md) - How to contribute to the project
- [Project Roadmap](./docs/roadmap.md) - Future feature prioritization for emergency response enhancement

## Deployment
The application can be deployed to various platforms including Vercel, Netlify, or traditional VPS providers. See [deployment guide](./docs/deployment.md) for detailed instructions on deploying emergency response infrastructure.

## Contributing
We welcome contributions from developers, emergency responders, and domain experts! Please read our [contributing guidelines](./docs/contributing.md) for details on our code of conduct, pull request process, and development setup.

Given the critical nature of emergency response software, all contributions undergo thorough review to ensure reliability and safety in life-saving operations.

## License
This project is licensed under the GNU Affero General Public License v3.0 — see the [LICENSE](LICENSE) file for details.

## Support
For support related to emergency response operations:
- **Emergency Situations**: Contact local emergency services immediately
- **Platform Issues**: Please open an issue in the repository with detailed reproduction steps
- **Feature Requests**: Suggest enhancements that could improve emergency coordination
- **Security Concerns**: Report vulnerabilities through our security contact procedures

---
*When disaster strikes, every second counts. The Rescue Platform helps emergency teams respond faster, coordinate better, and save more lives.*