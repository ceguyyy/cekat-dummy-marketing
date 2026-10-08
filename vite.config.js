import { loadEnv } from "vite";

export default {
  plugins: [
    (() => {
      let containerId = "";

      return {
        name: "gtm-noscript",
        configResolved(config) {
          const env = loadEnv(config.mode, config.envDir, "VITE_");
          containerId = env.VITE_GTM_ID?.trim() || "";
        },
        transformIndexHtml(html) {
          const isValidContainerId = /^GTM-[A-Z0-9]+$/i.test(containerId);
          const fallback = isValidContainerId
            ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${containerId}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>`
            : "";

          return html.replace("<!-- GTM_NOSCRIPT -->", fallback);
        }
      }
    })()
  ]
};
