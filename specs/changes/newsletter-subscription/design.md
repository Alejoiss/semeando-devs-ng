# Design Document

## Overview
This document outlines the technical design for the Newsletter Subscription feature. It introduces the ability for users to opt-in to newsletters during registration and from their profile settings. It also defines the database structures and operational logic required to manage newsletter content and dispatch emails.

### Change Type
new-feature

### Design Goals
1. Provide a seamless opt-in experience in the frontend registration and profile forms.
2. Establish a scalable database schema for newsletter management and tracking user dispatches.
3. Implement an efficient mechanism to dispatch newsletters using Supabase Edge Functions.

### References
- **REQ-1**: Newsletter Opt-In on Registration
- **REQ-2**: Newsletter Opt-In on Profile Settings
- **REQ-3**: Newsletter Content Management
- **REQ-4**: Newsletter Dispatch Processing

## System Architecture

### DES-1: User Profile Opt-in
The `profiles` table and corresponding frontend model will be extended to include a `newsletter_active` boolean field. The `Register` and `Profile` frontend components will be updated to handle this preference.

```mermaid
flowchart TD
    A[Frontend: Register/Profile Form] -->|Submit preference| B[Supabase Auth / Profile Service]
    B --> C[(profiles table)]
```

_Implements: REQ-1.1, REQ-1.2, REQ-2.1, REQ-2.2_

### DES-2: Newsletter Database Schema
Two new tables will be created: `newsletter` to store the HTML body and CTA details, and `user_newsletter` to track dispatch history and relationships to profiles.

```mermaid
erDiagram
    PROFILES {
        uuid id
        boolean newsletter_active
    }
    NEWSLETTER {
        uuid id
        text body
        text cta_url
        text cta_label
        timestamp created_at
    }
    USER_NEWSLETTER {
        uuid user_id FK
        uuid newsletter_id FK
        boolean email_sent
        timestamp created_at
    }
    PROFILES ||--o{ USER_NEWSLETTER : receives
    NEWSLETTER ||--o{ USER_NEWSLETTER : dispatches
```

_Implements: REQ-3.1, REQ-4.2, REQ-4.3_

### DES-3: Newsletter Dispatch Mechanism
A Supabase Edge Function (`dispatch-newsletter`) will be introduced to handle the mass mailing. It will retrieve the list of users based on `newsletter_active` status, invoke the email service for opted-in users, and record the event in `user_newsletter`.

```mermaid
sequenceDiagram
    participant Admin as Admin (via cURL)
    participant EdgeFunc as dispatch-newsletter
    participant DB as Supabase DB
    participant Email as Email Provider
    
    Admin->>EdgeFunc: Invoke Dispatch (newsletter_id)
    EdgeFunc->>DB: Fetch Profiles & Newsletter
    EdgeFunc->>Email: Send Emails (only if newsletter_active)
    EdgeFunc->>DB: Insert user_newsletter records (email_sent)
    EdgeFunc-->>Admin: Success
```

_Implements: REQ-4.1, REQ-4.2, REQ-4.3_

## Data Flow

```mermaid
flowchart LR
    A[Admin cURL] --> B[Edge Function]
    B --> C{Check Profile newsletter_active}
    C -->|true| D[Send Email via Email Provider]
    C -->|false| E[Skip Email]
    D --> F[Log user_newsletter with email_sent=true]
    E --> F
```

## Code Anatomy

| File Path | Purpose | Implements |
|-----------|---------|------------|
| src/app/pages/register/register.* | Update UI and submission logic for opt-in | DES-1 |
| src/app/pages/app/profile/profile.* | Update UI and submission logic for opt-in | DES-1 |
| src/models/profile/profile.ts | Add newsletter_active property | DES-1 |
| supabase/migrations/timestamp_newsletter.sql | Create newsletter schema & update profiles | DES-1, DES-2 |
| src/models/newsletter/newsletter.ts | Data model for newsletter | DES-2 |
| src/models/user-newsletter/user-newsletter.ts | Data model for tracking user emails | DES-2 |
| supabase/functions/dispatch-newsletter/index.ts | Edge function to send emails and track | DES-3 |
| supabase/functions/dispatch-newsletter/README.md | Documentation with example cURL command | DES-3 |

## Traceability Matrix

| Design Element | Requirements |
|----------------|--------------|
| DES-1 | REQ-1.1, REQ-1.2, REQ-2.1, REQ-2.2 |
| DES-2 | REQ-3.1, REQ-4.2, REQ-4.3 |
| DES-3 | REQ-4.1, REQ-4.2, REQ-4.3 |
