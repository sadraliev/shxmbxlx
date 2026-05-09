import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "shxmbxlx",
  description: "Notes on building, learning, and turning ideas into value",
  appearance: true,
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Articles", link: "/articles/" },
    ],
    outline: false,
    sidebar: {
      "/articles/": [
        {
          text: "Articles",
          items: [
            { text: "All articles", link: "/articles/" },
            { text: "How to Write Here", link: "/articles/how-to-write-here" },
          ],
        },
      ],
    },
  },
});
