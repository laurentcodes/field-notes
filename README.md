# Field Notes

An offline-first notes application built with React Native and Expo, designed for environments with unreliable or no internet connectivity.

[Watch Demo Video](https://drive.google.com/file/d/1fIaMLBTXBVL_IFFcL3fHeDgPBIvh8hGq/view?usp=sharing)

## Features

- **Offline-First Architecture** - All data stored locally in SQLite, works without internet
- **Background Sync** - Automatic synchronization with Convex when connectivity is restored
- **Optimistic Updates** - Instant UI feedback, no waiting for server responses
- **Pending Mutation Queue** - Offline writes are queued and replayed when back online
- **Search & Filter** - Search by title, filter by tags
- **Manual Retry** - Pull-to-refresh to trigger sync manually

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 54, React Native 0.81 |
| Routing | Expo Router 6 (file-based) |
| UI | HeroUI Native, TailwindCSS 4 (Uniwind) |
| Backend | Convex (self-hosted) |
| Local Database | expo-sqlite (SQLite) |
| Language | TypeScript (strict mode) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- iOS Simulator (Mac) or Android Emulator
- Expo Go app (for physical device testing)
- A running Convex deployment

### Installation

```bash
# clone the repository
git clone <repository-url>
cd field-notes

# install dependencies
npm install

# start development server
npm start
```

### Environment Variables

Create a `.env` file at the project root:

```
EXPO_PUBLIC_CONVEX_URL=your_convex_deployment_url
```

### Running the App

```bash
npm run ios      # run on iOS simulator
npm run android  # run on Android emulator
npm run web      # run in browser
```

### Convex Backend

```bash
npm run convex:dev     # start convex dev server
npm run convex:deploy  # deploy convex functions
```

### Running Tests

```bash
npm test
```

## Project Structure

```
app/                    # expo router file-based routes
├── _layout.tsx         # root layout (providers, initialization)
├── (tabs)/             # tab navigation group
│   ├── index.tsx       # notes list (home)
│   └── settings.tsx    # settings page
└── notes/              # notes routes
    ├── [id].tsx        # note detail view
    ├── [id]/edit.tsx   # edit note
    └── create.tsx      # create note

convex/                 # convex backend
├── schema.ts           # database schema
└── notes.ts            # queries and mutations

components/             # reusable components
├── notes/              # note-related (NoteCard, NoteForm, etc.)
├── ui/                 # generic ui (FAB, EmptyState, etc.)
└── sync/               # sync status components

hooks/                  # custom react hooks
lib/
├── db/                 # sqlite (client, queries, migrations)
├── sync/               # offline sync system
├── types/              # typescript type definitions
├── schemas/            # zod validation schemas
└── utils/              # utilities (uuid, date)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      UI LAYER                               │
│  Screens & Components (no direct DB/API calls)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DOMAIN LAYER                              │
│  Convex React Hooks, Offline Sync, Business Logic           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │  SQLite Cache   │◄────sync────►│  Convex Backend │       │
│  │  (offline-first)│              │  (self-hosted)  │       │
│  └─────────────────┘              └─────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Offline-First Strategy

SQLite serves as the **local cache and write queue** for all data:

1. **Reads come from local SQLite cache** - UI always reads from the local `notes_cache` table
2. **Writes go to SQLite first** - Changes are applied locally and queued as pending mutations
3. **UI never waits for server** - Optimistic updates provide instant feedback
4. **Pending mutations replay on reconnect** - The queue is processed in order when back online
5. **Data persists across restarts** - The mutation queue survives app closures

### Local Database Schema

Two SQLite tables power the offline experience:

**`notes_cache`** — mirrors Convex notes for offline reads:
- `id`, `title`, `body`, `tags`, `updated_at`, `creation_time`
- `is_deleted` (soft delete flag)
- `sync_status` (`synced` | `pending`)

**`pending_mutations`** — write-ahead queue for offline operations:
- `type` (`create` | `update` | `remove`)
- `note_id`, `payload` (serialized mutation arguments)

## Sync Behavior

### Sync Triggers

Synchronization is triggered when:

1. **App launches** - Pending mutations are replayed against Convex
2. **Network connectivity restored** - Automatically flushes the mutation queue
3. **Pull-to-refresh** - Manual sync from notes list

### Sync Flow

```
Local Change
     │
     ▼
┌──────────────┐
│ Write to     │
│ SQLite cache │
│ + queue      │
│ mutation     │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌─────────────┐
│ Online?      │────►│ Queue for   │
│              │ No  │ later sync  │
└──────┬───────┘     └─────────────┘
       │ Yes
       ▼
┌──────────────┐
│ Replay queue │
│ via Convex   │
└──────┬───────┘
       │
   ┌───┴───┐
   ▼       ▼
Success   Failure
   │         │
   ▼         ▼
remove    stop + retry
mutation   next launch
from queue
```

### Mutation Ordering

Mutations are processed in insertion order (FIFO). If any mutation fails, processing stops to preserve causal consistency. Failed mutations remain in the queue and will be retried on the next sync attempt.

## Testing

The project includes unit tests for database query operations:

```bash
npm test
```

## Trade-offs & Design Decisions

| Decision | Trade-off |
|----------|-----------|
| SQLite cache + mutation queue | Works fully offline, but cache can drift from server if mutations fail repeatedly |
| FIFO mutation processing | Preserves causal order, but a single failure blocks the queue |
| Convex real-time queries | Live updates when online, falls back to cache when offline |
| Client-side search | Works offline, but limited to cached data |
| Soft deletes | Consistent with Convex schema; hard delete happens server-side |

## License

MIT
