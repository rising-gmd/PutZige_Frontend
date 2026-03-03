# PUTZIGE FRONTEND — Project Reference

## Stack

Angular 21, PrimeNG 21, SCSS, SignalR, NgRx, ngx-translate, Outfit font.
Cookie-based auth (HttpOnly cookies, server owns session).
No tokens stored on client.

## Run

```bash
npm install
npm start          # dev server
npm run build      # production build
npm test           # unit tests
```

## Folder Structure

```
src/
  app/
    core/               singletons loaded once: guards, interceptors, models, services, utils
    design-system/      all UI components — primitives and composites only
      primitives/       ds-avatar, ds-badge, ds-button, ds-input, ds-password, ds-empty-state, ds-spinner
      composites/       ds-icon-button, ds-search-input, ds-chat-list-item, ds-message-bubble
    features/           lazy-loaded feature modules
      auth/             login, register, verify-email
      chat/             conversation list, chat area, message list, message input
      contacts/
      profile/
      settings/
    layout/             app shells: main-layout, auth-layout, header, sidebar
    shared/             directives, pipes, validators only — no UI components
    store/              NgRx slices: chat, messages, presence
  styles/
    tokens/             _colors, _typography, _spacing, _radius, _shadows, _transitions, _z-index
    themes/             _light (default), _dark (.my-app-dark on html element)
    base/               reset, base element styles
    chat/               _chat-tokens, _chat-mixins, _chat-primeng-overrides
  assets/
    i18n/               translation files
    fonts/
```

## Dependency Rules

Features import from design-system. Design-system never imports from features. Shared never imports from features. One direction only.

## Design System

Primitives have zero business logic. Input and Output only. No service injection.
Composites are built from primitives only. No service injection.
Feature components can use services and store.

Selector convention: ds-avatar (primitive), ds-icon-button (composite), feat-chat-area (feature).

Every component uses ChangeDetectionStrategy.OnPush. Signals for internal state, never plain properties. No any types anywhere.

## Token System

All visual values are CSS custom properties. No raw hex, px, or rem in component SCSS files.

Token naming:

- --app-\* global semantic tokens (--app-text, --app-bg, --app-border)
- --chat-\* chat feature tokens (--chat-bubble-own-bg, --chat-avatar-size)
- --auth-\* auth feature tokens
- --p-\* PrimeNG tokens, never manually set

Spacing is a 4pt grid: --space-1 (4px) through --space-16 (64px). No other spacing values.

## Theming

Dark mode is toggled by adding my-app-dark class to the html element. DarkModeService handles this.

Color themes are applied at runtime via document.documentElement.style.setProperty. ThemeService manages presets: default (blue), rose, forest, ocean, sunset, lavender. Each preset updates both --app-primary tokens and PrimeNG --p-primary-\* tokens via updatePreset() from @primeuix/themes.

PrimeNG preset is a custom Aura base with blue primary and zinc surfaces defined in src/app/app.config.ts.

Theme and dark mode preference are persisted to localStorage and restored via APP_INITIALIZER before first render.

## State Management

NgRx manages all server-synced shared state. Signals manage local UI state.

Store slices:

- chat: conversations (EntityState), active conversation ID, current user, search results
- messages: messages (EntityState), optimistic temp IDs, loaded conversation IDs
- presence: online user IDs, typing map (conversationId to userIds)

Auth state stays outside NgRx. AuthService uses BehaviorSubject because the HTTP interceptor needs synchronous access for token refresh. Do not move auth to NgRx.

Components use toSignal(store.select(selector)) to connect store to template. Never use async pipe for store. Never compute derived data in templates — use selectors.

Local UI state (search input value, modal open/closed, form loading) stays as component signals. Never put these in the store.

NgRx action naming: [Source] Event in past tense. Example: [Chat API] Conversations Load Success.

Effect operator rules: exhaustMap for page loads, switchMap for search, concatMap for send message, mergeMap for parallel independent operations. Every effect has catchError. No exceptions.

## Auth Architecture

Cookie-based. HttpOnly cookies set by server. No access tokens on the client.

AuthService owns login, logout, checkAuthStatus, and refreshAccessToken.
AuthApiService wraps HTTP calls. Uses two HttpClient instances: standard for normal calls, rawHttp via HttpBackend for refresh and logout to bypass interceptors and avoid recursion.
authState is a signal-based object holding user, isLoading, and error. Lives in core/services/auth/auth.state.ts.

The HTTP interceptor catches 401 responses and calls authService.refreshAccessToken(). This method has a single-flight guard so multiple simultaneous 401s result in only one refresh request. All callers wait for the same result.

Do not add JWT storage, do not add tokens to localStorage, do not move auth to NgRx.

## Real-Time (SignalR)

SignalRService manages the HubConnection lifecycle. It exposes Observable streams: onMessageReceived, onMessageDelivered, onMessageRead, onUserOnline, onUserOffline, onUserTyping, onUserStoppedTyping, onConversationCreated.

NgRx effects subscribe to these streams and dispatch actions. Components never subscribe to SignalR directly.

Automatic reconnect is configured with backoff: 0, 2000, 5000, 10000, 30000 ms.

## Optimistic Messaging

When a message is sent: a temp message with isOptimistic true and status sending is added to the store immediately. SignalR sends the message. On server ack, the temp ID is replaced with the real message ID. On failure, the message status changes to failed and a retry option is shown. Never remove a failed message silently.

## Accessibility

All components meet WCAG 2.1 AA. Every interactive element is keyboard accessible. Every icon-only button has aria-label. Focus ring is 2px solid with 2px offset. The message list uses role="log" with aria-live="polite". The conversation list uses role="listbox". Typing indicator uses aria-live="polite" aria-atomic="true". Timestamps use the time element with datetime attribute in ISO 8601 format. Online status dots are aria-hidden with sr-only text for screen readers.

## Security

No innerHTML binding with user content. No bypassSecurityTrust anywhere. Angular template binding handles escaping automatically. No sensitive data in localStorage. No tokens in JavaScript-accessible storage. Console logs are stripped in production builds.

## Internationalisation

ngx-translate. Translation files in assets/i18n/. Use the translate pipe in templates. Never hardcode user-facing strings.

## Component Rules

Max 300 lines per file. One component per file. Every component folder has .ts, .scss, and .spec.ts. No inline styles. No hardcoded colors or spacing in component SCSS.

Before merging any component: tokens only in SCSS, OnPush applied, inputs and outputs typed with no any, ARIA attributes present, unit tests written.

## Git

Branches: main (production), staging (QA), develop (integration).
Branch naming: feature/DS-123-description, fix/DS-456-description.
Commit format: feat(chat): add virtual scroll to message list.
Conventional Commits spec.
