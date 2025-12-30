# Frontend Plan

## Current State
- Vanilla HTML/CSS/JS frontend
- Simple chat interface

## Target State
- Next.js 15 with App Router
- Tailwind CSS v4 (matching my-portfolio styling)
- Dark cyan/teal theme from my-portfolio
- SSE streaming for chat responses
- Framer Motion animations
- "B" logo in navigation
- Single "Assistant" tab (default view)

---

## Design System (from my-portfolio)

### Color Palette
```css
--background: #0a0e1a
--background-secondary: #0f1729
--foreground: #e5e7eb
--primary: #06b6d4
--primary-hover: #0891b2
--secondary: #14b8a6
--accent: #22d3ee
--muted: #64748b
--border: rgba(148, 163, 184, 0.1)
--card-bg: rgba(15, 23, 41, 0.5)
```

### Fonts
- Geist (sans-serif)
- Geist Mono (monospace)

### Key Patterns
- Glassmorphism: `backdrop-blur-sm bg-card-bg border border-border`
- Gradient text: `bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent`
- Hover glow: `hover:shadow-lg hover:shadow-primary/50`

---

## Phase 1: Project Setup

### 1.1 Initialize Next.js
- [ ] Remove old frontend files
- [ ] Create Next.js 15 project with TypeScript
- [ ] Configure Tailwind CSS v4
- [ ] Set up Geist fonts
- [ ] Copy logo.svg from my-portfolio

### 1.2 Theme Setup
- [ ] Create globals.css with CSS variables
- [ ] Configure Tailwind theme integration

---

## Phase 2: Layout & Navigation

### 2.1 Root Layout
- [ ] App layout with fonts and metadata
- [ ] Full-height dark background

### 2.2 Navigation Component
- [ ] Fixed header with logo
- [ ] "Assistant" tab (active by default)
- [ ] Responsive design

---

## Phase 3: Chat Interface

### 3.1 Chat Container
- [ ] Full-height chat area with glassmorphism styling
- [ ] Messages list with scroll
- [ ] User/Assistant message bubbles

### 3.2 Message Input
- [ ] Input field with send button
- [ ] Keyboard submit (Enter)
- [ ] Loading state during streaming

### 3.3 SSE Streaming
- [ ] Connect to backend `/chat` endpoint
- [ ] Handle streaming response
- [ ] Display tokens as they arrive
- [ ] Session ID management

---

## Phase 4: Polish

### 4.1 Animations
- [ ] Framer Motion for message animations
- [ ] Typing indicator
- [ ] Smooth scrolling to new messages

### 4.2 Responsive
- [ ] Mobile-friendly chat layout
- [ ] Collapsible navigation on mobile

---

## Project Structure

```
frontend/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── public/
│   └── logo.svg
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Navigation.tsx
│   ├── Chat.tsx
│   ├── MessageList.tsx
│   ├── MessageBubble.tsx
│   └── ChatInput.tsx
├── lib/
│   └── api.ts
└── types/
    └── index.ts
```

---

## Execution Order

1. Phase 1.1 - Initialize Next.js
2. Phase 1.2 - Theme setup
3. Phase 2 - Layout & Navigation
4. Phase 3 - Chat interface
5. Phase 4 - Polish
