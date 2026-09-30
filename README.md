# seam-render

Three.js inside a React component. Vite + React Three Fiber.
Personal house lab. Not work. Not Olympus canon.

Layered split:

- `src/math` — matrices, shears, κ₂. No React, no Three. This is what the tests cover.
- `src/lab` — transform-lab hook (stage + editor state).
- `src/scene` — R3F viewport.
- `src/ui` — dock windows.

```bash
git clone git@github.com:Kighway/seam-render.git
cd seam-render
npm install
npm test
npm run dev
```

Open the URL Vite prints. Drag to orbit the plate.
