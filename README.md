# WhatsApp Web Clone

A production-grade, real-time WhatsApp clone built for the web. Faithful to the original's design language and packed with the features that make WhatsApp feel like WhatsApp — live messaging, read receipts, presence, typing indicators, group chats, media sharing, and true end-to-end encryption.

> Made under the guidance of **Gujan Mam** at the **Vedam School of Technology** Bootcamp — *"Build a clone of your WhatsApp."*

---

## Highlights

- **Real-time messaging** — Messages appear instantly in both chats powered by Supabase Realtime (Postgres CDC over WebSockets).
- **Message ticks** — The classic indicators: single gray check (sent), double gray (delivered), double blue (read).
- **Presence & last seen** — Live "online" status and "last seen today at 3:42 PM" subtitles, with a 30-second heartbeat.
- **Typing indicator** — Animated three-dot "typing…" bubble that shows while the other person composes.
- **End-to-end encryption** — ECDH P-256 key exchange + AES-GCM symmetric encryption via the Web Crypto API. Private keys never leave the browser; the server only ever relays encrypted blobs.
- **1:1 & group chats** — Create direct conversations or named groups with multiple participants.
- **Media sharing** — Send photos, documents, and voice notes. Images render inline with captions; voice notes have a custom player with a scrub slider; files show name and size.
- **Voice notes** — In-browser recording via `MediaRecorder`, with a live timer and cancel/send controls.
- **Profile management** — Edit your display name, about text, and upload an avatar photo.
- **Offline-aware sync** — Conversation list and messages refresh automatically on reconnection via Realtime subscriptions.
- **Faithful WhatsApp aesthetic** — Teal headers, the doodle chat background, green outgoing / white incoming bubbles with tails, unread badges, date separators, and reply-to-quote.
- **Fully responsive** — Two-pane layout on desktop collapses to a single pane on mobile.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + custom WhatsApp design tokens |
| **Icons** | lucide-react |
| **Backend / Database** | Supabase (PostgreSQL) |
| **Realtime** | Supabase Realtime (Postgres Changes + Broadcast) |
| **Auth** | Supabase Auth (email / password) |
| **Storage** | Supabase Storage (media bucket, public CDN URLs) |
| **Encryption** | Web Crypto API (ECDH P-256 + AES-GCM 256) |

---

## Features in Detail

### Real-Time Chat
Every conversation subscribes to a Supabase Realtime channel filtered by `conversation_id`. New inserts stream into the open chat instantly, and deletes propagate so removed messages vanish everywhere. The conversation list sidebar also subscribes to `messages`, `conversation_members`, and `message_receipts` changes so previews, unread counts, and tick states stay live.

### Message States (Ticks)
A `message_receipts` table stores one row per `(message, recipient)` with a status of `sent`, `delivered`, or `read`. When a recipient's client receives a message it upserts a `delivered` receipt; when they open the chat it upserts `read` and updates their `last_read_at`. The sender's UI aggregates these into the familiar single / double / blue-double ticks.

### End-to-End Encryption
On first sign-in, each user generates an ECDH P-256 key pair in the browser. The **private key** is stored in `localStorage` and never transmitted. The **public key** is published to the `profiles` table.

- **1:1 chats** — The sender derives a shared AES-GCM key from `(their private key, recipient's public key)` via ECDH. No key material is stored server-side.
- **Group chats** — The group creator generates a random 256-bit AES key, wraps (encrypts) it once per member using each member's pairwise shared key, and stores the wraps in a `conversation_keys` table. Members fetch and unwrap their copy to recover the group key.

Only message **bodies** (text / captions) are encrypted. Metadata (timestamps, media URLs, message type) is visible to the server — this aligns with a metadata-minimization approach while keeping media delivery on the CDN.

### Presence System
A `profiles` table tracks `is_online` and `last_seen`. The client sets itself online on mount, sends a heartbeat every 30 seconds, marks offline on tab-hide (`visibilitychange`) and unload (`beforeunload`). Other users in a chat subscribe to profile updates and see the live status in the chat header.

### Typing Indicators
Typing is broadcast over a Supabase Realtime **broadcast** channel (`self: false` so your own broadcasts don't echo back). The input sends a `typing: true` event on keystroke and `typing: false` after 1.5 seconds of inactivity. The receiver shows animated typing dots that auto-clear after 3 seconds.

### Media Sharing
Files are uploaded to the Supabase `media` storage bucket and referenced by public CDN URL. Image dimensions are read via `createImageBitmap` for proper layout. Voice notes are recorded with `MediaRecorder` (WebM/Opus) and include a duration field for the player.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (the schema migrations are included in `supabase/migrations/`)

### Install & Run

```bash
npm install
npm run dev
```

The app runs on the Vite dev server.

### Build

```bash
npm run build      # production build
npm run typecheck  # TypeScript check
npm run lint       # ESLint
```

---

## Project Structure

```
src/
├── App.tsx                      # Root: auth gate + two-pane layout
├── main.tsx                     # React entry point
├── index.css                    # WhatsApp design tokens + animations
├── types/
│   └── database.ts              # TypeScript interfaces for all DB tables
├── lib/
│   ├── supabase.ts              # Supabase client singleton
│   ├── auth.tsx                 # Auth context (sign up / in / out, profile)
│   ├── crypto.ts                # E2EE utilities (ECDH, AES-GCM, key wrapping)
│   ├── keyManager.ts            # Per-conversation key cache + group key distribution
│   ├── chat.ts                  # Data-access layer (conversations, messages, receipts)
│   ├── storage.ts               # Media upload, thumbnails, formatters
│   ├── format.ts                # Display helpers (names, times, avatars)
│   ├── useConversations.ts      # Realtime-synced conversation list hook
│   └── usePresence.ts           # Online/last-seen heartbeat hook
└── components/
    ├── AuthScreen.tsx           # Sign in / sign up
    ├── ChatList.tsx             # Sidebar conversation list + search
    ├── ChatHeader.tsx           # Conversation top bar (presence, typing, calls)
    ├── ConversationView.tsx     # Message thread + realtime orchestration
    ├── MessageBubble.tsx        # Individual message (text, media, voice player)
    ├── MessageInput.tsx         # Text input, attachments, voice recording
    ├── Ticks.tsx                # Sent / delivered / read tick icons
    ├── Avatar.tsx               # Initials or photo avatar with online dot
    ├── NewChatModal.tsx         # Contact picker + new group flow
    ├── ProfileScreen.tsx        # Edit name / about / avatar
    ├── InfoPanel.tsx            # Conversation / contact info drawer
    └── EmptyState.tsx           # Welcome screen when no chat is open
```

---

## Database Schema

Five tables power the app, all with Row Level Security enabled:

| Table | Purpose |
| --- | --- |
| `profiles` | Extends `auth.users` with name, phone hash, about, avatar, presence, and E2EE public key |
| `conversations` | A chat room — 1:1 (`is_group=false`) or group (`is_group=true`) |
| `conversation_members` | Join table with `last_read_at` per member (drives unread counts + read receipts) |
| `messages` | Messages with type (text/image/video/document/audio), body, media metadata, reply-to |
| `message_receipts` | Per-recipient delivery/read status for the tick indicators |
| `conversation_keys` | Wrapped group encryption keys (one per member) |

**Privacy:** Phone numbers are stored as SHA-256 hashes for matching, never in plaintext. Contact lists are never stored on the server.

### Row Level Security
- **profiles** — any authenticated user can read (needed for contacts / group members); only the owner can update.
- **conversations** — members-only access via `conversation_members` membership checks.
- **conversation_members** — read members of your conversations; insert your own membership; update your own `last_read_at`.
- **messages** — read/insert in conversations you belong to; delete only your own.
- **message_receipts** — read receipts for messages you sent or conversations you're in; upsert your own.
- **conversation_keys** — read only your own wrapped key; insert wraps for conversations you're a member of.

---

## Testing It Out

1. **Create two accounts** — open the app in two browser windows (or normal + incognito), sign up with two different emails.
2. **Start a chat** — in one account, open "New chat" and select the other account's name.
3. **Send messages** — watch them appear instantly in the other window with live ticks transitioning from sent → delivered → read.
4. **Try presence & typing** — watch the header show "online" / "last seen…" and the typing dots appear while composing.
5. **Send media** — attach a photo or record a voice note.
6. **Create a group** — use "New group", pick multiple contacts, name it, and verify encrypted group messaging works across all members.

---

## Architecture Notes

### Realtime Flow
```
Client A sends message
        │
        ▼
   Supabase Postgres INSERT (encrypted body)
        │
        ├──► Postgres CDC event
        │           │
        │           ▼
        │    Realtime channel (filtered by conversation_id)
        │           │
        │           ▼
        │    Client B receives INSERT → decrypts → renders
        │
        └──► Client B upserts receipt (delivered → read)
                    │
                    ▼
              Receipt Realtime channel
                    │
                    ▼
              Client A updates ticks
```

### Encryption Flow (1:1)
```
Device A                                    Device B
  │                                           │
  ├─ generate ECDH keypair                    ├─ generate ECDH keypair
  ├─ publish public key ─────────────────────►├─ publish public key
  │                                           │
  ├─ derive shared key (A priv + B pub)       ├─ derive shared key (B priv + A pub)
  │         (same key via ECDH)               │         (same key via ECDH)
  │                                           │
  ├─ encrypt(plaintext) ─────────────────────►├─ decrypt(ciphertext)
  │                                           │
  └─ store encrypted blob in DB               └─ render plaintext
```

---

## What's Included vs. What's Not

**Included & working:**
- Real-time text, image, document, and voice-note messaging
- Sent / delivered / read receipts
- Online presence + last seen
- Typing indicators
- 1:1 and group chats
- End-to-end encryption (Web Crypto, ECDH + AES-GCM)
- Profile editing with avatar upload
- Responsive WhatsApp-faithful UI

**Not included (and why):**
- **Self-hosted WebRTC voice/video calls** — require a custom Node.js signaling server (LiveKit / mediasoup) that can't run in this web-only environment. The call buttons are present in the UI and ready to wire to a signaling endpoint.
- **Phone-number OTP auth** — Supabase email/password is used instead, per the platform default. The schema stores phone hashes ready for OTP if a Twilio integration is added.
- **Offline store-and-forward** — Supabase Realtime handles reconnection sync; a local SQLite/Hive store would be the path for full offline-first (more relevant to a Flutter/RN build).

---

## Acknowledgements

Built as part of the **Vedam School of Technology** Bootcamp under the guidance of **Gujan Mam**, with the brief: *"Build a clone of your WhatsApp."*

Huge thanks for the mentorship that shaped this project — from architectural first principles to the polish on every bubble tail and typing dot.

---

## License

This project is built for educational purposes as part of a bootcamp assignment. WhatsApp is a trademark of Meta Platforms, Inc.; this is an independent clone and is not affiliated with or endorsed by WhatsApp or Meta.
