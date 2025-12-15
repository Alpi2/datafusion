# Socket Rooms & Subscription Model

This document describes the intended room access rules and subscription error behavior for Socket.IO rooms used by DataFusion.

Principles

- Authentication: sockets are authenticated during the handshake using JWTs. The verified token payload is attached to `socket.data.user` and `socket` is automatically joined to `user:{userId}`.
- Least privilege: clients may only join rooms they are authorized for. Attempting to join unauthorized rooms results in a `subscription:error` event with a structured payload.

Room patterns and rules

- `user:{userId}`

  - Personal room for user-specific events.
  - Only the authenticated user whose id matches `{userId}` may subscribe.

- `job:{jobId}`

  - Live generation job progress events are emitted to this room.
  - To subscribe, use the dedicated `subscribe-job` event which enforces ownership checks: the requesting socket's `user.userId` must match the `generationJob.userId` (or the user must have an admin role).
  - Unauthorized subscription attempts receive `subscription:error` with `code: "forbidden"`.

- `bonding:{datasetId}`

  - Bonding curve updates for a dataset.
  - Only the dataset creator or users who have purchased the dataset may subscribe.

- `dataset:{datasetId}`
  - General dataset-level broadcasts (e.g., metadata updates).
  - Public datasets (`status === "active"`) are allowed for subscription by anyone; private datasets require ownership.

Subscription errors

- When a client attempts to subscribe to a channel they are not authorized to, the server emits:
  - Event: `subscription:error`
  - Payload: `{ channel: string, code: string, message: string }`
  - Example: `{ channel: "bonding:abc123", code: "forbidden", message: "Not authorized for bonding channel" }`

Guidelines for developers

- Use the dedicated events (`subscribe-job`) for sensitive rooms when possible.
- Keep room names and patterns documented and follow the whitelist enforced by the server.
- When adding new room types, extend the server whitelist and implement ownership checks consistently.
