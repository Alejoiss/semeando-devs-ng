# Design Document

## Overview

This feature extends the `TabExtraMaterial` Angular standalone component with a JSON bulk-import capability, mirroring the pattern already established in `TabQuiz`. The change is entirely self-contained within the component's TypeScript, HTML, and SCSS files — no new services, routes, or data model fields are required.

When the professor clicks "Importar JSON", a modal overlay appears. The professor pastes a JSON array into a plain `<textarea>`. On submit, the component validates the payload inline (no server call) and, if valid, replaces the current `FormArray` entries with new reactive form groups built from the imported items. The modal closes and the professor can review, edit, or delete each entry before pressing the existing "Salvar Materiais" button to persist to the database.

The UI pattern for the modal follows the design system defined in `STYLEGUIDE.md`: glassmorphic overlay (`backdrop-blur`, `surface_bright` at 70% opacity), `surface_container` panel, no border lines, and `secondary` accent for the import action. Validation errors are shown inline inside the modal using the existing `error` color token.

### Change Type

enhancement

### Design Goals

1. Reuse the existing modal interaction pattern from `TabQuiz` (open/close signals, inline error signal, backdrop-click dismissal).
2. Keep the import entirely in-memory so no new service calls or model changes are needed.
3. Preserve the existing materials list when the professor cancels or closes the modal without importing.

### References

- **REQ-1**: Open Import JSON Modal
- **REQ-2**: Validate and Import JSON Payload
- **REQ-3**: Post-Import Form State
- **REQ-4**: Close and Reset Modal

## System Architecture

### DES-1: Import Modal State and Trigger (Component Logic)

The `TabExtraMaterial` component class gains three new signals and a local interface to manage modal lifecycle:

- `isImportModalOpen: Signal<boolean>` — controls modal visibility.
- `importError: Signal<string | null>` — holds the validation error message shown inside the modal.
- `importRawJson: Signal<string>` — holds the current textarea value as the professor types.

A `JsonImportItem` interface (`{ title: string; url: string }`) defines the expected shape of each array element and is used only inside the component for type narrowing during validation.

Three methods are added: `openImportModal()`, `closeImportModal()`, and `importFromJson()`. `openImportModal()` records a snapshot of the current `FormArray` length as a safeguard; `closeImportModal()` resets all import signals regardless of the caller; `importFromJson()` validates the payload, rebuilds the `FormArray`, and calls `closeImportModal()` on success.

```mermaid
flowchart TD
    A[Professor clicks Importar JSON] --> B[openImportModal sets isImportModalOpen=true]
    B --> C[Modal renders with empty textarea]
    C --> D{Professor action}
    D -->|Types JSON + clicks Importar| E[importFromJson validates payload]
    D -->|Clicks Cancelar or backdrop| F[closeImportModal resets signals]
    E -->|Invalid| G[importError signal set, modal stays open]
    E -->|Valid| H[FormArray rebuilt from parsed items]
    H --> F
```

_Implements: REQ-1.1, REQ-1.2, REQ-4.1, REQ-4.2, REQ-4.3_

### DES-2: JSON Validation Pipeline

`importFromJson()` applies four sequential guards before touching the `FormArray`. Each guard sets `importError` and returns early on failure, leaving the modal open so the professor can correct the input.

```mermaid
flowchart TD
    V1["Guard 1: JSON.parse — syntax check"] --> V2["Guard 2: Array.isArray — structure check"]
    V2 --> V3["Guard 3: title present and non-empty per item"]
    V3 --> V4["Guard 4: url present and matches https?:// pattern"]
    V4 --> V5["Clear FormArray and push new groups"]
    V1 -->|fail| E1["importError: JSON inválido"]
    V2 -->|fail| E2["importError: payload deve ser um array"]
    V3 -->|fail| E3["importError: item N — título ausente ou vazio"]
    V4 -->|fail| E4["importError: item N — URL inválida"]
```

_Implements: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4_

### DES-3: FormArray Rebuild and Post-Import State

When all guards pass, the component clears the existing `FormArray` and pushes one `FormGroup` per imported item. Each group follows the same schema as `addMaterial()` — `id` (new `crypto.randomUUID()`), `title`, `type` (defaulting to `ExtraMaterialType.URL`), and `url` — so the imported entries are indistinguishable from manually added ones and benefit from all existing validators.

The `loadedMaterialIds` set is **not** modified during an import because imported entries are treated as new (not yet persisted). The `materialsToDelete` signal is also left untouched, preserving any pending deletions the professor had queued before opening the modal.

```mermaid
sequenceDiagram
    participant Component
    participant FormArray
    participant Modal

    Component->>Component: importFromJson() — all guards pass
    Component->>FormArray: removeAt(0) loop — clear existing entries
    Component->>FormArray: push FormGroup per imported item
    Component->>Modal: closeImportModal() — reset signals, close
    Modal-->>Component: isImportModalOpen = false
```

_Implements: REQ-2.5, REQ-3.1, REQ-3.2_

### DES-4: Modal Overlay UI

The modal is rendered inline in `tab-extra-material.html` using an `@if (isImportModalOpen())` block, identical in structure to the quiz import modal. Layout layers:

- **Backdrop**: `fixed inset-0` with `bg-surface/70 backdrop-blur-xl`; click handler calls `closeImportModal()`.
- **Panel**: `relative` container, `bg-surface-container`, `max-w-lg`, `rounded-2xl`; stops click propagation.
- **Header**: title + close button (calls `closeImportModal()`).
- **Instructions**: one-line description of the expected JSON format, using `font-mono text-xs text-on-surface-variant`.
- **Textarea**: `w-full`, `bg-surface-container-lowest`, `rounded-xl`, `min-h-[200px]`, `resize-y`; bound to `importRawJson` via two-way binding.
- **Error banner**: `@if (importError())` block styled with `bg-error/10 border-l-4 border-error text-error`.
- **Footer**: "Cancelar" ghost button + "Importar" gradient button (primary style) with `aria-busy` binding.

The modal relies on the component's own SCSS for the `glass-alert` glassmorphic style; no new CSS classes are needed.

```mermaid
flowchart TD
    Backdrop["Backdrop — fixed overlay, blur, click-to-close"] --> Panel["Panel — surface-container card"]
    Panel --> Header["Header: title + close button"]
    Panel --> Instructions["Instructions: format description"]
    Panel --> Textarea["Textarea: raw JSON input"]
    Panel --> ErrorBanner["Error banner (conditional)"]
    Panel --> Footer["Footer: Cancelar + Importar buttons"]
```

_Implements: REQ-1.2, REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-4.1, REQ-4.2, REQ-4.3_

## Data Flow

```mermaid
flowchart LR
    Textarea["Textarea value (raw string)"] -->|importRawJson signal| Validator["importFromJson — 4 guards"]
    Validator -->|valid array| Builder["FormArray rebuild loop"]
    Builder -->|FormGroup per item| Form["Reactive Form — existing save flow"]
    Form -->|professor clicks Salvar| Service["ExtraMaterialService.upsertExtraMaterials"]
```

## Data Models

The existing `ExtraMaterial` interface and `ExtraMaterialType` enum remain unchanged. A lightweight local interface is introduced inside the component file only:

```mermaid
classDiagram
    class JsonImportItem {
        +title: string
        +url: string
    }
    class ExtraMaterial {
        +id: string
        +title: string
        +type: ExtraMaterialType
        +url: string
        +file: string
    }
    JsonImportItem ..> ExtraMaterial : mapped to FormGroup at import time
```

## Error Handling

| Error Condition | Response | Recovery |
|-----------------|----------|----------|
| Syntactically invalid JSON | Set `importError` to "JSON inválido. Verifique a sintaxe." | Modal stays open; professor corrects input |
| Valid JSON but not an array | Set `importError` to "O payload deve ser um array." | Modal stays open |
| Item missing or empty `title` | Set `importError` identifying item index | Modal stays open |
| Item missing `url` or invalid URL | Set `importError` identifying item index | Modal stays open |
| Import succeeds but `FormArray` rebuild throws | `importError` shows generic error; modal stays open | Professor retries |

## Code Anatomy

| File Path | Purpose | Implements |
|-----------|---------|------------|
| `src/app/pages/professor/professor-app/create-lesson/tab-extra-material/tab-extra-material.ts` | Adds import signals, `JsonImportItem` interface, and modal methods | DES-1, DES-2, DES-3 |
| `src/app/pages/professor/professor-app/create-lesson/tab-extra-material/tab-extra-material.html` | Adds "Importar JSON" button in header and modal overlay block | DES-4 |
| `src/app/pages/professor/professor-app/create-lesson/tab-extra-material/tab-extra-material.scss` | No new styles required; existing `.glass-alert`, `.btn-primary`, `.btn-secondary` cover modal needs | DES-4 |

## Traceability Matrix

| Design Element | Requirements |
|----------------|--------------|
| DES-1 | REQ-1.1, REQ-1.2, REQ-4.1, REQ-4.2, REQ-4.3 |
| DES-2 | REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4 |
| DES-3 | REQ-2.5, REQ-3.1, REQ-3.2 |
| DES-4 | REQ-1.2, REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-4.1, REQ-4.2, REQ-4.3 |
