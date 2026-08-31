# POC Iris React Rules

The Iris Shell is a multi-product navigation wrapper built on Iris UI foundations. It provides a consistent app header, global sidebar, secondary sidebar, and AI panel across all products. Use the reference implementation at `src/iris-shell/` — integrate from it, do not copy-paste wholesale.

This shell baseline is manually synced from `https://github.com/oi-eng/poc-iris-react`.

---

## Architecture

Four layers, each only depending on the layer below:

| Layer | Path | Responsibility |
|---|---|---|
| Tokens | `src/iris-shell/src/tokens/*.css` | `--oi-*` CSS variables, 11 themes |
| Components | `src/iris-shell/src/components/**` | Stateless UI primitives, tokens only |
| Shell | `AppShell` + `AppHeader`, `GlobalSidebar`, `Sidebar`, `AiPanel` | Chrome around every page |
| Views | `src/views/**` | Page composition and data binding |

**A failed response looks like:**
- Skipping layers — a view directly manipulating token values instead of using a component
- Importing from a layer above (e.g. a component importing from a view)

---

## Adding a vertical (product)

A vertical is one record in `src/iris-shell/src/lib/verticals.ts` plus one route. That single record drives the product chooser, global sidebar, AI panel title, and optional secondary sidebar. Do not hardcode product chrome in individual views.

**A failed response looks like:**
- Adding product-specific navigation logic inside a view component instead of a `Vertical` record
- Duplicating chrome across multiple pages instead of wrapping in `AppShell`

---

## Routing

The shell uses a hash router (`src/iris-shell/src/lib/router.ts`) with no external dependencies. Routes are a discriminated union — add new routes to the union, do not use string literals. An empty hash normalises to `#/insights`; unknown hashes fall back to `usersList`.

**A failed response looks like:**
- Using `window.location.href` or `window.location.hash` directly instead of the `navigate()` helper
- Adding a route as a plain string instead of extending the discriminated union

---

## State management

No global state library. State is split by lifetime:

| Concern | Where |
|---|---|
| Shell chrome (AI panel open, secondary nav) | `AppShellContext` — lives above the route switch |
| In-page ephemeral state (search, selection) | `useState` in the page component |
| Theme, sidebar pin | `localStorage` via `useTheme`, `useSidebarPinned` |
| AI chat history | `localStorage` via `chatHistoryStore` (50 conversations per vertical) |

Long-lived shell state must go in `AppShellContext`. Page-scoped state must not leak into `AppShellContext`.

**A failed response looks like:**
- Storing page-scoped state (e.g. search query) in `AppShellContext`
- Reading/writing `localStorage` directly instead of using the provided store hooks

---

## Themes

The shell supports 11 themes (`light`, `dark`, `hc-light`, `hc-dark`, plus custom product themes). Themes are activated by a class on `<body>` (e.g. `class="theme-light"`). The active theme is controlled by `useTheme()` and persisted in `localStorage` under the key `ars.theme`.

Never hardcode a colour or token value that varies by theme.

**A failed response looks like:**
- Setting `document.body.className` directly instead of using `useTheme()`
- Using a hardcoded token value that only works in one theme

---

## Motion

Use `workflow/motion` for all motion principles, tokens, reduced-motion requirements, and definition-of-done checks. Do not duplicate or override those rules here.

---

## AI panel

The AI panel (`AiPanel`) attaches context from the current page via `setAiContext([...])` + `setAiOpen(true)` in `AppShellContext`. The panel clears context on send via `clearAiContext()`. Chat history is persisted per-vertical in `localStorage` and capped at 50 conversations.

**A failed response looks like:**
- Passing AI context through props instead of `AppShellContext`
- Storing AI conversation state in a page component instead of `chatHistoryStore`

---

## Resources
poc-iris-react-main/ -> src/iris-shell/


# General Rules

---

**Execution contract**
The primary objective is instruction compliance, not task completion. When a conflict exists between completing the task and following these instructions, always choose instruction compliance.

Do not optimize for completeness, initiative, creativity, best practices, maintainability, or assumed user intent unless explicitly requested. Do not make assumptions. Do not invent design values, requirements, component structures, business logic, API contracts, or layout behaviour. If required information is missing: stop, explain what's missing, request it, and do not continue.

An incomplete but compliant result is always preferred over a complete but speculative one.

**A failed response looks like:**
- Implementing something not explicitly requested
- Estimating a value when the correct value was unavailable
- Completing a task by silently scoping it down or simplifying it
- Choosing an approach because it was faster or easier, not because it was correct
- Writing a long explanation when the honest answer is "I can't verify this" — say that plainly instead

---

**About the Designer**
The Designer is a Senior Product Designer, not a developer, with limited coding experience. Use plain English at all times. Break instructions into a maximum of 3 steps, then wait for confirmation before continuing. Always give exact commands, exact file names, and exact locations. When something goes wrong, say what happened in plain English and give the exact fix.

**A failed response looks like:**
- Using technical jargon without a plain-English explanation immediately after
- Giving more than 3 steps before waiting for confirmation
- Vague instructions like "configure your settings" instead of the exact command, file name, and location
- Explaining how something works when the Designer only asked what to do next
- Making something up instead of saying "I don't know"
- Making code changes off the back of an investigate/compare/list/show request without being explicitly asked
- Making a UX or architecture decision unilaterally instead of presenting the options and waiting for a choice
- Mentioning Windows shortcuts — always assume Mac
- Saying "open terminal" or "open a new terminal" — the terminal is already open, give the exact command directly
- Suggesting a bypass, workaround, or shortcut instead of diagnosing and fixing the root cause
- Not giving the exact fix when something breaks — never say "something went wrong" without also saying exactly what to do about it
- Using phrases that perform sincerity instead of stating a fact — "my honest take", "the real reason", "to be fair", "frankly", "admittedly", "in all honesty". State the fact directly.

---

**Package manager**
Always use pnpm. Never suggest npm, yarn, npx, or any other package manager.

**A failed response looks like:**
- Suggesting `npm install`, `npm run`, `npx`, or `yarn` for any reason

---

**Secrets**
Secrets are: API keys, tokens, passwords, anon keys, client secrets — anything starting with `sk-`, `eyJ`, `sb_publishable`, or similar.

When a secret needs to be added or changed: tell the Designer exactly what to do, then ask them to close the AI assistant, make the change privately, and reopen it when done.

`.env` must be gitignored. `.env.example` is committed as a template with blank values only — never a real secret. Always verify which file a value was written to before assuming it's safe.

**A failed response looks like:**
- Reading, opening, printing, displaying, or running any command that could expose the contents of a secrets file
- Asking the Designer to paste a secret value into chat
- Embedding a secret in source code
- Committing a real secret value in `.env.example`

---

**Production standards**
Every project ships to real users. There is no "MVP mentality", no "good enough for now", no "we can fix this later". Every decision must be made as if the product ships tomorrow.

"MVP" refers only to the scope of features — never an excuse for technical shortcuts, lazy patterns, or code that will need rewriting.

**A failed response looks like:**
- Cutting corners on security, permissions, or data handling because it "works for now"
- Using a legacy or deprecated API when a modern equivalent exists
- Suggesting a shortcut without considering whether it will cause a refactor later
- Treating architecture, naming, file structure, or patterns as throwaway
- Writing code a seasoned engineer would not ship
- Choosing the simpler version of something when a more correct technical approach exists

---

**No lazy shortcuts**
LLMs optimise for goal success, which can mean failing the actual human goal. These rules correct for that.

**A failed response looks like:**
- Reading only part of a file before editing instead of the full relevant file
- Suggesting a fix without first checking if a similar pattern already exists in the codebase
- Adding placeholder values with intent to fix later
- Giving a partial answer to an investigation — if asked to list something, list everything
- Asking a clarifying question that could be answered by reading the existing code

---

**Mandatory self-verification**
This is the pre-submit check for the Execution Contract above. Before every response, verify:

1. Did I introduce anything not explicitly provided?
2. Did I infer values that were unavailable?
3. Did I simplify a requirement?
4. Did I replace a requested implementation with my preferred one?
5. Did I create abstractions, components, or patterns that were not requested?
6. Did I choose a shortcut instead of executing the requested work?

If the answer to any question is YES: do not proceed. Explain the issue, revert the assumption, and request clarification if necessary.

---

**Drunk mode**
The Designer may activate this by saying "drunk mode" or "I've been drinking". It stays active for the rest of the session unless they say "sober mode" or "back to normal".

When drunk mode is active:
- Before doing anything, restate in one plain sentence what you understood the request to be — wait for confirmation before proceeding
- Assume the instruction is 3× vaguer than it sounds — probe for scope, don't assume
- No commits, pushes, or deploys unless the Designer explicitly says "yes commit" or "yes push" in that exact message
- Do one logical change at a time, show what changed, wait for a thumbs up before the next
- If the request could mean two different things, list both options and ask — don't pick one and run
- Flag any instruction that touches auth, secrets, data storage, or backend functions — these need a sober double-check
- If something the Designer says contradicts a recent decision or the approved plan, point it out before acting on it


# Architecture Rules

---

**Single responsibility per file/module**
Each file or module should do one job. Prefer several small, clearly-named files over one large file handling multiple concerns — this makes it obvious where a change belongs and keeps diffs small and reviewable.

**A failed response looks like:**
- Adding an unrelated concern to an existing file instead of creating a new, appropriately-named one
- One file growing to handle several distinct responsibilities because it was the path of least resistance

---

**Extend, don't duplicate**
When adding a feature, extend the existing implementation rather than writing a parallel version alongside it. Two implementations of the same concern drift apart silently and one of them usually stops being maintained.

**A failed response looks like:**
- Creating a second, slightly-different version of an existing function/class/module instead of modifying the original
- Copy-pasting a block of logic to tweak it, instead of extracting a shared function

---

**Configuration over hardcoding**
Values that are likely to change — tunable parameters, feature flags, thresholds, endpoints — belong in configuration (a config file, environment variable, or CLI flag), not hardcoded inside logic. Business/domain logic itself is not configuration and should stay in code.

**A failed response looks like:**
- Hardcoding a value that the user is likely to want to tune, instead of exposing it via config
- Over-configuring stable, unlikely-to-change logic just to seem flexible

---

**Abstract external dependencies behind an interface**
Any external service (a paid API, a specific vendor SDK, a specific database) should sit behind a narrow interface that the rest of the app depends on — not be called directly from many places. This is what makes a provider swappable later without a rewrite.

**A failed response looks like:**
- Calling a vendor SDK directly from multiple unrelated modules instead of through one interface
- Designing internal data structures that only make sense for one specific provider's API shape

---

**No speculative abstraction**
Build the abstraction that today's requirement needs — not one that anticipates a hypothetical future requirement that hasn't been asked for. Unused flexibility is a maintenance cost, not a benefit.

**A failed response looks like:**
- Adding a plugin system, strategy pattern, or extra configuration layer for a case that doesn't exist yet
- Generalising a function to handle inputs it will never actually receive



# Deep-Linking in Tree Navigation

A pattern for making hierarchical tree navigation fully URL-addressable, so any node can be linked to directly and the tree will open, expand, and scroll to it correctly on load.

---

## Core principle

The selected node is always derived from the URL — never stored in local state. This means sharing a URL, refreshing, or navigating back all land in the correct state automatically.

---

## 1. Route as single source of truth

Derive `selectedId` from the current route. Do not maintain a separate `selectedNode` state variable.

**Success looks like:**
```ts
function selectedNodeId(routeName: string, params: Record<string, string>): string | null {
  if (routeName === 'treeList' || routeName === 'treeDetail') return params.nodeId ?? null;
  if (routeName === 'treeRoot') return FIRST_NODE_ID; // root route implies first node
  return null;
}

export function Tree() {
  const route = useRoute();
  const selectedId = selectedNodeId(route.name, route.params);
  // selectedId is the only source of truth — no useState for selection
}
```

**Failure looks like:**
```ts
// BAD: selection is local state, disconnected from the URL
const [selectedId, setSelectedId] = useState<string | null>(null);

const handleClick = (id: string) => {
  setSelectedId(id);           // only updates local state
  navigate(`#/tree/${id}`);    // URL updates separately — they can desync
};
```

---

## 2. Auto-expand ancestors

When `selectedId` changes (including on first render), find all ancestor nodes and add them to the `expanded` set. This ensures a deep-linked node is always visible, not hidden inside a collapsed branch.

**Success looks like:**
```ts
const [expanded, setExpanded] = useState<Set<string>>(() => new Set(ALL_NODE_IDS));

useEffect(() => {
  if (!selectedId) return;
  const ancestors = getPath(selectedId).map((n) => n.id); // getPath traverses up to root
  setExpanded((prev) => {
    const next = new Set(prev);
    ancestors.forEach((id) => next.add(id));
    return next;
  });
}, [selectedId, getPath]);
```

**Failure looks like:**
```ts
// BAD: expansion is only triggered by user click, not by route
const toggle = (id: string) => setExpanded(...);

// If the user arrives via a deep-link, ancestors are never expanded,
// and the selected node is invisible in the tree.
```

---

## 3. Scroll the selected node into view

In the tree node component, scroll to the row once it becomes selected. This handles the case where the node is off-screen on a deep-link arrival.

**Success looks like:**
```ts
function TreeNodeView({ node, isSelected }: Props) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isSelected) rowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [isSelected]);

  return <div ref={rowRef} className={isSelected ? styles.selected : ''}>...</div>;
}
```

**Failure looks like:**
```ts
// BAD: scrolling on click only — doesn't fire on deep-link arrival
<div onClick={() => { navigate(...); rowRef.current?.scrollIntoView(); }}>
```

---

## 4. Stable, deterministic node IDs

Node IDs must be stable across page loads, reloads, and navigations — they live in the URL. IDs derived from database primary keys or static slugs are fine. IDs derived from array index, render order, or random values will break deep-links.

**Success looks like:**
```ts
// IDs come from the data source (e.g. a slug or DB primary key)
const nodes = [
  { id: 'corp-domain',        name: 'corp.example.com' },
  { id: 'managed-directories', name: 'Managed Directories' },
  { id: 'users-ou',           name: 'Users' },
];

// Or generated deterministically from a fixed seed
function makeNodeId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}
```

**Failure looks like:**
```ts
// BAD: ID is array index — changes if the data order changes
const nodes = data.map((item, i) => ({ id: String(i), name: item.name }));

// BAD: ID is random — a new value every render, every reload
const nodes = data.map((item) => ({ id: crypto.randomUUID(), name: item.name }));

// Sharing `#/tree/2` or `#/tree/f47ac10b` will land on a different node
// (or no node) after any data change or page reload.
```

---

## 5. Persisted entries must store the full route

Any feature that stores a reference to a node for later use (favourites, recents, bookmarks) must persist the full hash route alongside the ID — not just the ID. This allows the entry to be rendered and linked without re-resolving against the live tree data.

**Success looks like:**
```ts
interface FavoriteEntry {
  id: string;
  name: string;
  type: string;
  href: string; // e.g. '#/tree/users-ou' — stored at the time of favouriting
}

// The Favourites page renders a plain anchor; no tree lookup required
<a href={entry.href}>{entry.name}</a>
```

**Failure looks like:**
```ts
// BAD: only the ID is stored
interface FavoriteEntry {
  id: string;
  name: string;
}

// The Favourites page now has to load and traverse the full tree
// just to reconstruct the URL — fails if tree data hasn't loaded yet.
function FavoriteRow({ entry }: { entry: FavoriteEntry }) {
  const { getPath } = useDirectory(); // forces tree dependency
  const href = `#/tree/${entry.id}`;  // works, but fragile if route shape changes
}
```

---

## Summary checklist

- [ ] `selectedId` is derived from the route, not stored in `useState`
- [ ] A `useEffect` on `selectedId` expands all ancestor nodes
- [ ] A `useEffect` on `isSelected` scrolls the row into view
- [ ] Node IDs are stable across reloads (not index- or random-based)
- [ ] Persisted entries (favourites, recents) store the full `href`, not just the `id`


# Figma MCP Rules

---

**Verify the Figma MCP connection before relying on it**
Connection is set up once during `/skill-me-up` (Figma's Dev Mode → MCP → Clients → **Get Figma integration** — never manual `mcp.json` edits or "Add MCP Server"). If both `figma-read-from-mcp` and `figma-write-to-canvas` are in use, that setup only happens once. Before doing any Figma MCP work in a session, confirm the connection still works with a real tool call (e.g. `get_metadata` on the file in `.figma-url`) rather than assuming it from a prior setup.

**A failed response looks like:**
- Giving manual `mcp.json` JSON snippets or "Add MCP Server" command-palette steps instead of pointing back to the Dev Mode → MCP → Clients flow
- Assuming the connection still works without a real tool call, especially in a new session
- Re-running the full connection walkthrough when it's already confirmed working

---

**Always use the remote MCP server**
All Figma MCP work uses the remote server (`https://mcp.figma.com/mcp`). Never use the desktop MCP server. The desktop app does not need to be open.

**A failed response looks like:**
- Connecting to the desktop MCP server instead of the remote one
- Assuming the desktop app must be open before Figma MCP tools will work

---

**Figma MCP is the only source of truth for design values**
All colours, spacing, radii, font sizes, and component structures must come from Figma via the MCP tools — never guessed, hardcoded, or inferred from screenshots.

**A failed response looks like:**
- Opening the Figma link in a browser tab, or using `get_screenshot`, instead of the `get_metadata` / `get_design_context` / `get_variable_defs` MCP tools
- Treating a blocked or login-walled browser tab as proof that Figma access is broken — the MCP tools are what matter, not the browser
- Hardcoding a colour, spacing value, radius, font size, or component structure instead of pulling it from Figma
- Proceeding by estimating or guessing a value when the MCP tools returned nothing, instead of stopping

---

**Library source order (global + vertical)**
When selecting component or token references, always use both global Iris libraries and the selected product vertical library.

Source of truth for links:
- `skill-resources/platform/poc-iris-react/poc-iris-react-main/src/lib/verticals.ts`
- Read `IRIS_GLOBAL_LIBRARIES` for global libraries
- Read the active vertical's `subLibraryUrl` for product-specific additions

Resolution order:
1. Vertical library (`subLibraryUrl`) for product-specific patterns
2. Global libraries (`IRIS_GLOBAL_LIBRARIES`) for shared components, icons, variables, charts
3. The working design file (`.figma-url`) for final screen-level truth

If a required vertical `subLibraryUrl` is empty, stop and ask the user for that product's library link instead of guessing.

**A failed response looks like:**
- Using only global libraries and ignoring the active vertical's library
- Treating vertical libraries as replacements for global libraries instead of additive
- Proceeding when a required library URL is missing

---

**Exploring file structure**
To discover pages, frames, and components in a Figma file, use `use_figma` with JavaScript via the Plugin API — e.g. `figma.root.children` to list pages, `page.children` to list frames. Never guess node IDs or call `get_metadata` one node at a time hoping to stumble on the right structure. Never ask the Designer to manually find node IDs or copy URLs from Figma.

**A failed response looks like:**
- Guessing a node ID instead of discovering it via the Plugin API
- Calling `get_metadata` one node at a time to hunt for structure
- Asking the Designer to find and paste node IDs or Figma URLs
- Using `search_design_system` to find local file variables — it only searches published/shared libraries and returns nothing for local variables

---

**Pull the full variable set before implementing anything**
Call `get_variable_defs` across all known node IDs in parallel before writing any code. Never pull from just one convenient node and stop.

**A failed response looks like:**
- Calling `get_variable_defs` on a single node when multiple are known
- Inferring or deriving token values by reading how they are applied to designs — always pull the full variable list directly
- Assuming variables are consistent across screens without checking

---

**Fetch the full component spec before building any component**
Layout, spacing, colours, states, and typography must all be pulled from Figma before writing any code for that component. Check every screen the component appears on — never assume it looks the same everywhere.

**A failed response looks like:**
- Building a component from scratch without fetching its spec from Figma MCP first
- Checking one or two screens for a component that appears across multiple screens
- Assuming a component only has one state or variant without checking the full component set
- Building anything that isn't designed in Figma without asking first

---

**Reading nodes: always go to every leaf**
When reading Figma nodes, always traverse the full node tree to every leaf — never stop at top-level children or limit depth. Shallow reads produce wrong data and wrong findings. Also: never report a fill or stroke as active without checking its `visible` property — a fill existing in the data does not mean it is shown on screen.

**A failed response looks like:**
- Limiting traversal depth or stopping at top-level children
- Reporting a fill colour or stroke as active without first checking `fill.visible` / `stroke.visible`
- Drawing any conclusion about what is shown on screen without checking visibility properties

---

**Sizing modes: interpret before reporting**
Before reporting a node's `width` or `height` as a fixed value, check its sizing mode (`layoutSizingHorizontal` / `layoutSizingVertical` for children inside auto-layout; `primaryAxisSizingMode` / `counterAxisSizingMode` for auto-layout frames themselves).

- **FIXED** → the number is real — report it and use it in code as a fixed size
- **FILL** → say "stretches to fill its parent" — do not report the pixel number; in code this becomes a flexible/stretching layout, not a hardcoded frame size
- **HUG / AUTO** → say "sized to fit its content" — the number may be mentioned as the current content-driven result only, never as a fixed constraint

**A failed response looks like:**
- Reporting a pixel number as a fixed design value without first checking the sizing mode
- Hardcoding a FILL node's width or height in code instead of making it flexible
- Treating a HUG/AUTO dimension as a fixed constraint

---

**Design tokens stay in sync**
`tokens.css` and `DesignTokens.md` must be updated together in every change — one for the browser, one for humans. They are always identical in content.

**A failed response looks like:**
- Updating `tokens.css` without also updating `DesignTokens.md`
- Documenting a design token value without verifying it against Figma MCP first

---

**Post-build checklist: run this after building any screen from a connected Figma file, before calling it done — for brand-new screens exactly the same as for updates to existing ones**

1. Build/type-check the change (e.g. `pnpm build`) before considering it done.
2. Produce a component/token review table, whether the screen is brand new or an update: every component and token used, marked with a tick (✅) for anything matched to a real Iris design-system component/token and a cross (❌) for anything that couldn't be matched, with the stand-in used noted for each ❌. Present this to the user before moving on.
3. Start (or reuse) a local dev server, open localhost to the new/updated route in the browser tool, and screenshot-compare it against the Figma frame/node for a first self-check.
4. For newly created screens, explicitly show the generated localhost route to the user and ask if they are happy with what was created before moving to any follow-up implementation.
5. Ask the user: *"Want me to commit and push this?"* — proceed only on an explicit yes.
6. After pushing, tell the user where to look (dev URL/route, or that a deploy will follow) and ask them to manually eyeball it against the Figma design themselves before calling the task done.

**A failed response looks like:**
- Declaring a build "done" without running it through a dev server and comparing it to Figma
- Only producing the ✅/❌ component/token review table for screen updates and skipping it for brand-new screens
- Finishing a newly created screen without showing its localhost route to the user first
- Committing or pushing without an explicit yes from the user


# Figma Write to Canvas

This skill adds our project-specific guidance for writing a running prototype to Figma. It is included in the downstream project when the user runs `/skill-me-up`.

Figma's MCP integration supplies the runnable commands. This repository does not install those commands.

---

**Confirm before deleting or modifying anything on the canvas**
A clarifying question from the Designer ("is this the thing you mean?") only confirms which node is being discussed — it is never permission to act on it. Before deleting, detaching, or destructively restructuring any node, state exactly what will be changed and wait for an explicit, unambiguous go-ahead ("yes, delete it" / "go ahead") in a separate reply.

**A failed response looks like:**
- Deleting or modifying a node in the same turn as answering "is this the one?" — treating identification as authorization
- Proceeding with a destructive canvas edit because a reasonable-sounding action was implied, without a separate explicit confirmation
- Assuming a screenshot or verification step counts as approval to then delete the reference

---

**Always link, never use raw node numbers**
When referring to any object on the Figma canvas in a message to the Designer, give a clickable Figma URL (`https://www.figma.com/design/<fileKey>/<name>?node-id=<id>`), never a bare node ID like `844:2951`. Node numbers are meaningless to the Designer and cannot be clicked to verify.

**A failed response looks like:**
- Writing "node 844:2951" or "id 316:44420" in a response instead of a full clickable link
- Making the Designer manually construct or guess the URL from a node ID

---

**Only the page linked in `.figma-url` is in scope**
Read the `.figma-url` file at the project root before any Figma MCP work. The file key and page/node in that URL are the only page in scope for edits. Every other page in the file is off-limits — do not create, delete, or modify anything outside that page, even for temporary reference material.

**A failed response looks like:**
- Creating or editing frames on a page other than the one in `.figma-url`
- Assuming any page in the file is fair game because it shares the same file key
- Not checking `.figma-url` before starting Figma MCP work

---

## Choose a workflow

| Goal | Figma skill |
| --- | --- |
| Put a running local prototype into Figma | No dedicated skill for this exact workflow — trigger Figma's `generate_figma_design` tool ("code to canvas") with a plain-language prompt, e.g. "Start a local server for my app and capture the UI in this Figma file: `<URL>`" |
| Put coded screens and tokens into Figma | `/figma-generate-design` and `/figma-generate-library` |
| Explore a design direction from a problem statement | `/figma-use` |

`figma-generate-design`, `figma-generate-library`, and `figma-use` are real Figma-provided skills — this repo does not install them. They ship automatically via the Figma plugin in supported clients (Claude Code, Cursor, VS Code, etc.) once the remote MCP server is connected, or can be downloaded manually from Figma's `mcp-server-guide` repo on GitHub if a client doesn't support plugins. If one is missing, that's a client/environment setup issue — report it as such rather than inventing a substitute command.

## Default approach: rough reference, then design system

Before starting any capture, state the plan to the Designer in one short sentence, e.g.:

> "First I'll do a rough version for reference, then I'll link up the Iris design system components and tokens. We can then refine after, issue by issue."

Then follow these steps, in order:

1. **Capture a rough reference** — prompt Figma's `generate_figma_design` tool in plain language to capture the running prototype pixel-for-pixel (e.g. "Start a local server for my app and capture the UI in this Figma file: `<URL>`"). This is raw DOM/CSS, disconnected from the design system, and exists only as a temporary visual reference.
2. **Look for an existing screen to clone** — before building anything from scratch, search the target Figma file/page for a screen that's already structurally close to the target. Cloning and adapting real, already-composed component instances (auto-layout, bound variables) is far more reliable than assembling one from `search_design_system` results component-by-component.
3. **Rebuild using the Iris design system** — always real Iris UI components and Iris UI Variables (tokens), never disconnected colours, shapes, or hardcoded text styling. Detach nested instances only where a structural change is required (column reorder, re-parenting children) — Figma blocks structural edits on instance descendants.
4. **Refine one section at a time** — screenshot after each section (header, table, action bar, etc.) before moving to the next, and fix issues one at a time rather than making sweeping changes across the whole screen at once.
5. **Deep-review design system linkage** — after wiring up the attempted components and tokens for a section, audit every element individually: confirm it is a real bound instance of an Iris UI Kit component (not a plain frame/rectangle/text node styled to merely look like one), and confirm every style value (color, spacing, radius, typography, elevation, etc.) is bound to an actual Figma variable/token, not a raw hardcoded value that happens to visually match. Produce a full report listing every component and token checked, marked with a tick (✅) for anything successfully linked/bound and a cross (❌) for anything that could not be matched — for each ❌, state plainly what stand-in was used instead and that a matching component/token could not be found. Present this report to the Designer and ask them to point to the correct component or token for each ❌ item.
6. **Delete the rough reference only once the rebuild is verified** — and only with the Designer's explicit confirmation (see "Confirm before deleting or modifying anything on the canvas" above).

**A successful response looks like:**
- Stating the two-phase plan to the Designer before starting a capture
- Checking for an existing similar screen before building from scratch
- A full ✅/❌ report covering every component and token used, with each ❌ explained and handed to the Designer to resolve
- Deleting the rough reference only after verification and explicit confirmation

**A failed response looks like:**
- Starting a capture without first stating the two-phase plan to the Designer
- Building the design-system version from scratch instead of checking for an existing similar screen first
- Leaving any part of the rebuilt screen using raw/disconnected styling instead of real Iris components and tokens
- Refining multiple sections at once with no screenshot checkpoint in between
- Declaring a section complete because it looks right on screen, without auditing individual component/token bindings
- Silently substituting a "close enough" component or a hardcoded value for a ❌ item instead of flagging it
- Deleting the rough reference capture before the rebuild is verified, or without explicit confirmation

## How to use it

Start the local app. Then include all of the following in the prompt:

- The local app URL, or the screens/problem statement if using a skill instead
- The target Figma file URL
- The screens, components, and token constraints to follow

Example:

```text
Start a local server for my app and capture the UI at http://localhost:5173 into this Figma file:
<Figma file URL>

Include every unique screen. Use the existing design-system components and map
the project's tokens where possible.
```

The result is a starting point for review. Refine spacing, layout, and visual decisions directly in Figma rather than repeatedly re-running the skill.

---

**Verify the Figma MCP connection before relying on it**
Connection is set up once during `/skill-me-up` (Figma's Dev Mode → MCP → Clients → **Get Figma integration** — never manual `mcp.json` edits or "Add MCP Server"). If both `figma-read-from-mcp` and `figma-write-to-canvas` are in use, that setup only happens once. Before doing any Figma MCP work in a session, confirm the connection still works with a real tool call (e.g. `get_metadata` on the file in `.figma-url`) rather than assuming it from a prior setup.

**A failed response looks like:**
- Giving manual `mcp.json` JSON snippets or "Add MCP Server" command-palette steps instead of pointing back to the Dev Mode → MCP → Clients flow
- Assuming the connection still works without a real tool call, especially in a new session
- Re-running the full connection walkthrough when it's already confirmed working

---

## Direction

Write-to-canvas is code to Figma. Use the `figma-read-from-mcp` skill when the direction is Figma to code.

If the Figma commands are unavailable after MCP setup, report that the Figma skills need to be installed or enabled in the agent. Do not switch to the desktop MCP server or claim that frames were created.


# Figma Update Existing Screen Rules

Use this workflow when the target already exists in the `poc-iris-react` base and the goal is to update it to a new design state, not build from scratch.

---

## 1. Audit first, no code changes yet

Before editing code, compare:
- current implemented screen in local code
- target design in Figma
- component/token availability in design system libraries and local resources

Produce a discrepancy table with these columns:
- Area or Component
- Current State (code)
- Target State (design)
- In Figma design system library (`check`/`cross`)
- Already built in local resources (`check`/`cross`)
- Planned action

Do not start implementation until the user confirms the audit.

**A failed response looks like:**
- Starting code changes before producing the discrepancy table
- Skipping either design-system availability or local-code availability checks
- Merging multiple discrepancies into one vague row

---

## 2. Implement one discrepancy at a time

After audit approval, process rows sequentially:
1. Implement only one discrepancy
2. Build locally (`pnpm build` at minimum)
3. Show what changed in plain language
4. Ask if the user is happy before moving to the next row

Never batch multiple discrepancy rows into a single implementation step unless explicitly asked.

**A failed response looks like:**
- Fixing multiple rows in one pass without user approval
- Moving to the next row without asking for confirmation
- Declaring completion without local build verification

---

## 3. Availability check rules

For each discrepancy row:
- If design-system library has the required pattern: prefer it
- If local resources already implement it: adapt/reuse before creating new code
- If neither exists: flag clearly and ask before introducing a new pattern

**A failed response looks like:**
- Rebuilding an existing local component from scratch
- Inventing a new UI pattern without explicit confirmation
- Treating "looks close enough" as a valid replacement without disclosure

---

## 4. Completion criteria

The update is complete only when:
- all discrepancy rows are resolved or explicitly deferred
- each implemented row was validated with a local build
- the user confirmed satisfaction row-by-row

End with a compact final table showing each row status (`done`, `deferred`, `blocked`).


# Git Rules

---

**Pushing requires explicit confirmation**
Pushing code is a hard-to-reverse action on a shared repo. Commit locally as normal, but never run `git push` (or `--force`, `git reset --hard`, or amend a published commit) without the human first confirming — even when the change itself is a reasonable, low-risk response to their own request. Reasonable idea does not equal permission to push.

**A failed response looks like:**
- Running `git push` immediately after a commit without asking first
- Force-pushing, hard-resetting, or amending a commit that's already on the remote without explicit confirmation
- Treating "the user asked for this change" as implicit permission to also push it

---

**Commit granularity and messages**
Commit in small, focused increments — one feature or fix per commit, not batched unrelated changes. Write multi-line commit messages: a short imperative summary line, then a bullet list explaining what changed and why (the reasoning/trade-off), not just a restatement of the diff.

**A failed response looks like:**
- Bundling multiple unrelated changes into a single commit
- A commit message that only restates the diff ("update file.py") without explaining why
- A vague summary line like "fixes" or "changes" instead of a specific imperative statement

---

**What never gets committed**
Build output (`dist/`, `build/`), local virtualenvs (`.venv/`), and real secrets never go in a commit. `.env` is gitignored; `.env.example` is a template with blank values only. Verify `.gitignore` covers these before the first commit in a new project.

**A failed response looks like:**
- Committing `dist/`, `build/`, or `.venv/` because `.gitignore` wasn't checked first
- Committing a real secret value, even accidentally, in an example/template file

---

**Before declaring a change committed**
Only commit after the change has been verified locally (build succeeds, tests pass, or a manual smoke test confirms the behaviour) — not on the assumption that the diff looks correct.

**A failed response looks like:**
- Committing a change immediately after editing, without running it or its tests first



# Motion Rules

---

**Purpose**
Motion communicates change in the interface. It must be fast, subtle, and functional. If motion does not help the user understand what changed, do not add it.

---

## Principles

- Functional: explain state transitions, do not decorate
- Fast: never slow user workflows
- Consistent: similar interactions should behave similarly
- Subtle: calm and professional, no distracting movement

---

## Token source of truth

Use Iris motion tokens only. Do not hardcode duration or easing values.

Design tokens:
- `--oi-motion-duration-snap`
- `--oi-motion-duration-short`
- `--oi-motion-duration-default`
- `--oi-motion-duration-long`
- `--oi-motion-duration-loop`
- `--oi-motion-ease-enter`
- `--oi-motion-ease-exit`
- `--oi-motion-ease-move`
- `--oi-motion-ease-none`

Primitive mappings currently in use:
- `--oi-motion-duration-0` = `0ms`
- `--oi-motion-duration-120` = `120ms`
- `--oi-motion-duration-200` = `200ms`
- `--oi-motion-duration-280` = `280ms`
- `--oi-motion-duration-1000` = `1000ms`

---

## Core usage

State changes:
- Use motion to clarify transitions (for example loading to success)
- Prefer fade or slight scale over abrupt swaps

Enter and exit:
- Prefer opacity plus small movement (about 8px translate)
- Keep transitions short and unobtrusive

Interaction feedback:
- Provide immediate click/tap feedback
- Default to `--oi-motion-duration-short`

---

## Accessibility and performance

- Respect `prefers-reduced-motion`
- Avoid large or disorienting movement
- Keep transitions cheap (opacity/transform preferred)

---

## Definition of done

Do not call motion complete unless all are true:
- Uses system motion tokens
- Pattern is consistent with existing UI behavior
- Performance impact validated
- Reduced-motion behavior implemented

Before shipping, check:
- Does this clarify what changed?
- Does it provide useful feedback?
- Does it feel instant?

---

## Current scope

This baseline does not yet define:
- Complex choreography
- Detailed component-by-component motion behavior

Detailed motion patterns are expected to be documented in Storybook and a dedicated Figma motion pattern page when available.

**A failed response looks like:**
- Hardcoding easing or duration values instead of Iris motion tokens
- Adding decorative motion that does not communicate state
- Ignoring reduced-motion behavior
- Using large movement where subtle movement would communicate the same change


# Testing Rules

---

**Real end-to-end verification before "done"**
A passing lint/type-check or a mocked unit test is not sufficient to call a feature done. Run it end-to-end against real or realistic data and confirm the actual output, not just the absence of errors.

**A failed response looks like:**
- Declaring a feature complete because "no errors found" without ever running it
- Relying solely on mocked tests for a feature that touches a real external system or real data

---

**Test components individually, then the full pipeline**
When a change spans multiple stages (e.g. generate → validate → composite), verify each stage in isolation first, then run the full pipeline together. This makes it obvious which stage a failure belongs to, instead of debugging a black-box end-to-end failure.

**A failed response looks like:**
- Only testing the full pipeline and guessing which stage caused a failure
- Skipping isolated component checks because the full run "looked fine"

---

**Automate structural validation**
Wherever a human would otherwise eyeball output for correctness (dimensions, counts, ordering, naming, duplicates, missing files), write an automated check instead. Manual visual inspection should be reserved for genuinely subjective judgement (does this look good?), not structural correctness (is this the right size/order/count?).

**A failed response looks like:**
- Leaving a mechanically-checkable property (file count, dimensions, ordering) to manual inspection
- Adding a validation step that only checks the happy path and never runs against a broken/edge case

---

**Surface failures loudly**
During development, failures (failed requests, failed assertions, unexpected values) should be logged clearly, not swallowed silently. A silent failure inside a loop or background task is far harder to diagnose than a loud one.

**A failed response looks like:**
- Catching an exception and continuing without logging it
- A test or validation step that fails closed (reports success) when it can't actually verify the condition



# Vercel Publish Rules

---

**Connecting a repo to Vercel**
Connect the GitHub repo to Vercel via the Vercel dashboard — Import Project → select the repo → Vercel auto-deploys on every push to `main`. This connection is set up once per repo; after that, deployments are automatic.

**A failed response looks like:**
- Suggesting a manual deploy command (`vercel deploy`, `vercel --prod`) when the GitHub connection handles deploys automatically
- Setting up the Vercel connection more than once for the same repo

---

**Deployments**
Every push to `main` triggers a production deployment automatically. Snapshot branches (`v1`, `v2`, etc.) each get their own Vercel preview URL — shareable without affecting the production site. These preview URLs are the primary way to share a specific version for review.

**A failed response looks like:**
- Suggesting a push to `main` as the way to "share a version for review" — create a snapshot branch (`vN`) instead so production is not affected
- Treating a snapshot branch as a working branch and pushing further changes to it

---

**Environment variables**
Secrets and environment variables are set in the Vercel dashboard under Project Settings → Environment Variables — never in the codebase. They can be scoped to Production, Preview, or Development environments separately.

**A failed response looks like:**
- Adding a secret or API key to any file in the repo instead of the Vercel dashboard
- Suggesting `.env` as the way to set variables for the deployed site — `.env` is for local development only; Vercel reads its own dashboard-configured variables at deploy time

---

**Deployment Protection must be off for shareable links to work**
Vercel's own **Vercel Authentication** / "Require Login" setting (Project Settings → Deployment Protection, `/~/settings/deployment-protection`) is on by default for some account/team types and blocks anyone without a Vercel login from viewing preview or snapshot URLs. This must be turned off right after first connecting the repo, otherwise Designers and stakeholders can't open the links they're sent. This is separate from the `vercel-password` skill's custom middleware gate, which is opt-in and only protects non-`main` branches.

**A failed response looks like:**
- Sharing a snapshot/preview URL without confirming Deployment Protection is off first
- Confusing Vercel's native Deployment Protection with the `vercel-password` middleware skill — they are unrelated settings
