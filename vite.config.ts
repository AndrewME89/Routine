import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this repo at https://AndrewME89.github.io/Routine/
// so every asset URL needs that repo-name prefix. Change BASE_PATH here
// (and only here) if the repo is ever renamed.
const BASE_PATH = "/Routine/";

export default defineConfig({
  plugins: [react()],
  base: BASE_PATH,
});
