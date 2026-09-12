# Demo script

A short path through the running app. Setup: [getting-started.md](./getting-started.md).

The demonstration is deliberately simple: **raw scan looks unfinished, reconstruct looks understood, ask lights up objects.**

## Before you present

- Backend on 8000, Vite on 5173, browser fullscreen if you can.
- No OpenAI key required. Heuristics cover the three suggestion chips.
- Start on a fresh load so the status pill reads **Raw mesh**.

## Step 1 — Raw capture

Show the wireframe room, unlabelled boxes, and the teal sweep. Left panel: *Unlabelled scan*, object rows all `unknown`.

Talking point: this is what a cheap LiDAR mesh feels like — structure without meaning.

## Step 2 — Reconstruct

Press **✨ AI Reconstruct**.

The HUD plays computer-vision-style steps, for example:

```text
Unknown surface  →  Wall
Unknown surface  →  Floor
Unknown object   →  Table
Unknown object   →  Chair × 4
Unknown opening  →  Door
Unknown opening  →  Window
Unknown object   →  Display
Unknown object   →  Shelf
```

Talking point: InteLiDar is classifying the graph, not hallucinating a new room.

## Step 3 — Semantic twin

Lighting, materials, and labels appear. Status: **Semantic twin**. Object list shows types.

## Step 4 — Ask

Use a chip or type:

```text
Show me all the chairs.
```

Four chairs glow. Reply mentions the count.

Then:

```text
Where is the door?
```

```text
What objects could obstruct movement through this room?
```

Talking point: the assistant returns ids; the viewer only paints those ids. The model is not picking pixels.

## Step 5 — Edit (optional but strong)

Toggle **Edit**. Drag a chair. Show that the door does not move. Ask chairs again if you want to show highlights following the new pose (twin-graph ask uses current positions in the JSON, even though heuristics do not mention coordinates in the reply).

## If something fails

| Symptom | Fix |
| --- | --- |
| Backend unavailable | Start `npm run backend`, reload |
| Reconstruct does nothing | Wait for ingest (`graph` loaded; button enabled) |
| Ask disabled | You are still in raw / analysing |
| Generic ask reply | Expected without a key, unless the question hits a keyword |

## One-line pitch

**InteLiDar transforms a LiDAR scan into an AI-enhanced semantic digital twin.** Scan a room. Recover its structure. Let AI name what is there. Then work with the physical world through its digital copy.
