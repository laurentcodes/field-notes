# Field Notes

An offline-first notes application built with React Native and Expo, designed for environments with unreliable or no internet connectivity.

## Features

- **Offline-First Architecture** - All data stored locally in SQLite, works without internet
- **Background Sync** - Automatic synchronization when connectivity is restored
- **Optimistic Updates** - Instant UI feedback, no waiting for server responses
- **Conflict Resolution** - Server-wins strategy with user notifications
- **Search & Filter** - Search by title, filter by tags
- **Manual Retry** - Retry failed syncs with one tap

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 54, React Native 0.81 |
| Routing | Expo Router 6 (file-based) |
| UI | HeroUI Native, TailwindCSS 4 (uniwind) |
| State/Data | TanStack React Query 5 |
| Local Database | expo-sqlite (SQLite) |
| HTTP Client | Axios |
| Language | TypeScript (strict mode) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- iOS Simulator (Mac) or Android Emulator
- Expo Go app (for physical device testing)

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

### Running the App

```bash
npm run ios      # run on iOS simulator
npm run android  # run on Android emulator
npm run web      # run in browser
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

services/               # api service layer (axios calls)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      UI LAYER                               │
│  Screens & Components (no direct API/DB calls)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DOMAIN LAYER                              │
│  React Query Hooks, Sync Manager, Business Logic            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │   SQLite DB     │◄────sync────►│   REST API      │       │
│  │  (local first)  │              │   (remote)      │       │
│  └─────────────────┘              └─────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Offline-First Strategy

SQLite serves as the **single source of truth** for all data:

1. **All reads come from local SQLite** - React Query fetches from the local database
2. **All writes go to SQLite first** - Changes are saved locally with `syncStatus: 'pending'`
3. **UI never waits for server** - Optimistic updates provide instant feedback
4. **Sync happens in background** - Pending changes are pushed to the server when online
5. **Data persists across restarts** - The sync queue survives app closures

### Sync Status

Each note has a `syncStatus` field:

| Status | Meaning |
|--------|---------|
| `synced` | Successfully synchronized with server |
| `pending` | Local changes awaiting sync |
| `failed` | Sync attempted but failed (retry available) |

## Sync Behavior

### Sync Triggers

Synchronization is triggered when:

1. **App comes to foreground** - Retries any failed syncs
2. **Network connectivity restored** - Automatically syncs pending changes
3. **Pull-to-refresh** - Manual sync from notes list
4. **After local mutation** - Immediate sync attempt for new/updated notes

### Sync Flow

```
Local Change
     │
     ▼
┌──────────────┐
│ Save to      │
│ SQLite       │
│ (pending)    │
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
│ Push to      │
│ Server       │
└──────┬───────┘
       │
   ┌───┴───┐
   ▼       ▼
Success   Failure
   │         │
   ▼         ▼
synced    failed
```

### Remote Deletion Detection

When pulling from the server, notes that exist locally but not on the server are automatically removed (if they were previously synced).

## Conflict Handling

The app uses a **server-wins (last-write-wins)** conflict resolution strategy:

1. When updating a note, if the server returns a `409 Conflict`:
   - The server version is accepted as the source of truth
   - Local note is updated with server data
   - User is notified via toast: *"Note was updated on another device"*

2. **Rationale**: This approach is simpler to implement and understand. It prioritizes data consistency over preserving local changes.

3. **Trade-off**: Local changes may be lost if edited simultaneously on multiple devices. For most note-taking use cases, this is acceptable.

## Testing

The project includes unit tests for database query operations:

```bash
npm test
```

Tests cover:
- `insertNote()` - Creates notes with `pending` sync status
- `getAllNotes()` - Returns non-deleted notes sorted by date
- `softDeleteNote()` - Marks notes for deletion sync
- `updateNote()` - Updates fields and resets sync status
- `getPendingNotes()` - Retrieves notes awaiting sync
- `updateSyncStatus()` - Updates sync state and error messages

## Trade-offs & Future Improvements

### Current Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Server-wins conflict resolution | Simpler implementation, but may lose local changes on simultaneous edits |
| Full sync on reconnect | Fetches all notes; may be slow with large datasets |
| Client-side search | Works offline, but limited to loaded data |
| Soft deletes | Requires sync before permanent deletion |

## API

The app connects to:

- **Base URL**: `https://interviewapi.czettapay.com/v1`
- **Documentation**: `https://interviewapi.czettapay.com/swagger/index.html`
- **Authentication**: Not required

## License

MIT
