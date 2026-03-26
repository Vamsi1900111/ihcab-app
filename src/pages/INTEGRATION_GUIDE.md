# 🧩 PuzzlePage Integration Guide

## Files to add / change

### 1. Add the new page
Copy `PuzzlePage.tsx` into your project:
```
src/pages/PuzzlePage.tsx
```

---

### 2. Register the route in `src/App.tsx`

Find your router section (it will look like the block below) and add the `/puzzle` route **before** the catch-all `*` route:

```tsx
// src/App.tsx  –  add these two lines

import PuzzlePage from "./pages/PuzzlePage";

// inside <Routes> … </Routes>
<Route path="/puzzle" element={<PuzzlePage />} />
```

Full example after editing:
```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index       from "./pages/Index";
import Chat        from "./pages/Chat";          // your existing chat page
import PuzzlePage  from "./pages/PuzzlePage";    // ← new

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<Index />} />
        <Route path="/puzzle" element={<PuzzlePage />} />
        <Route path="/chat"   element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

### 3. Redirect to `/puzzle` after a correct code

In whichever component handles the access-code form (likely `src/pages/Index.tsx`), change the navigation target from `/chat` to `/puzzle`:

```tsx
// Before  (probably something like this)
navigate("/chat");

// After
navigate("/puzzle");
```

The puzzle page itself will navigate to `/chat` after the user solves it and clicks **Verify & Continue**.

---

### 4. (Optional) Change the puzzle image

The image is embedded as a base64 data-URL in the `PUZZLE_IMAGE_BASE64` constant at the top of `PuzzlePage.tsx`. To swap it:

1. Convert your own image to a square JPEG and base64-encode it.
2. Replace the long string assigned to `PUZZLE_IMAGE_BASE64`.

Quick bash one-liner:
```bash
python3 -c "
from PIL import Image; import base64, io
img = Image.open('your_image.jpg')
s = min(img.size)
img = img.crop(((img.width-s)//2,(img.height-s)//2,(img.width+s)//2,(img.height+s)//2))
img = img.resize((400,400))
buf = io.BytesIO(); img.save(buf,'JPEG',quality=80)
print('data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode())
"
```

---

## How the puzzle works

| Feature | Detail |
|---|---|
| Grid | 4 × 4 (16 pieces) |
| Interaction | Drag-and-drop (desktop) · Tap-to-swap (mobile) |
| Hint | Toggle button shows faded reference image |
| Verify | Checks if every tile is in the correct slot |
| Success | Navigates to `/chat` |
| Failure | Toast asking user to retry |
| Reset | Reshuffles board and resets move counter |

---

## Dependencies (already in your project)
- `react-router-dom` — for `useNavigate`
- `@/components/ui/button` — shadcn Button (used optionally)
- `@/hooks/use-toast` — shadcn toast hook
