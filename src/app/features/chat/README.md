# Chat Feature (Example Pattern)

This folder demonstrates the architecture pattern for feature modules in Putzige.

## What's Implemented (Examples)

- ✅ `chat-container/` - Smart container component pattern
- ✅ `message-list/` - Presentation component pattern
- ✅ `chat-api.service.ts` - REST API service pattern
- ✅ `chat-signalr.service.ts` - SignalR real-time service pattern
- ✅ `chat.state.ts` - Signal-based state management pattern

## What to Build Later

Follow this same structure for:

- `conversation-list/`
- `message-input/`
- `chat-header/`
- `typing-indicator/`
- `message-reactions/`
- etc.

## Key Principles

1. Container components orchestrate business logic
2. Presentation components are pure and reusable
3. Services handle API and real-time communication
4. State is managed with Angular signals
5. Every component has a corresponding `.spec.ts` test
