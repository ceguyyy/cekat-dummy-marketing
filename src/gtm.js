const containerId = import.meta.env.VITE_GTM_ID?.trim();

window.dataLayer = window.dataLayer || [];

if (!containerId) {
  console.warn("Google Tag Manager is disabled. Set VITE_GTM_ID in your .env file.");
} else if (!/^GTM-[A-Z0-9]+$/i.test(containerId)) {
  console.error("Invalid VITE_GTM_ID. Use the GTM container ID format, such as GTM-ABC1234.");
} else {
  window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

  const firstScript = document.getElementsByTagName("script")[0];
  const gtmScript = document.createElement("script");
  gtmScript.async = true;
  gtmScript.src = "https://www.googletagmanager.com/gtm.js?id=" + containerId;
  firstScript.parentNode.insertBefore(gtmScript, firstScript);
}

window.dataLayer.push({
  event: "page_view",
  page_type: "campaign_landing",
  page_name: "cekat_growth_sprint"
});
