# CROS

**CrossTech Retail Operating System (CROS)** — Modern, fast, and resilient Point of Sale (POS) system built with React, Vite, Tailwind CSS, and Supabase.

## Features

- ⚡ High-speed checkout & barcode-friendly POS interface
- 🛒 Cart management with quick quantity toggles & tax calculations
- ⏸️ Hold and resume orders
- 👥 Multi-role authentication (Cashier, Manager, Admin)
- 💳 Split & flexible payment handling (Cash, Card, UPI, Store Credit)
- 📴 Offline resilience and sync with Supabase cloud database
- 📊 Real-time inventory & sales management

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Chandan2909-commits/CROS.git
   cd CROS
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your Supabase configuration:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons
- **Backend & Auth**: Supabase
- **UI Utilities**: Canvas Confetti
