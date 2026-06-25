/* ========================================
   LANGUAGE — Holt Zirkel
   Default: DE.
   ======================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "zirkel.lang";
  const DEFAULT_LANG = "de";
  const SUPPORTED = ["de", "en"];
  const OG_LOCALES = { de: "de_DE", en: "en_US" };

  const state = { dict: null, lang: null };

  function getInitialLang() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("lang");
    if (fromUrl && SUPPORTED.includes(fromUrl)) return fromUrl;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    return DEFAULT_LANG;
  }

  async function loadDict(lang) {
    const res = await fetch(`/lang/${lang}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Missing ${lang}.json`);
    return res.json();
  }

  function resolve(dict, key) {
    return key.split(".").reduce((acc, part) => {
      if (acc && Object.prototype.hasOwnProperty.call(acc, part)) return acc[part];
      return undefined;
    }, dict);
  }

  function applyTranslations(dict) {
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      const value = resolve(dict, key);
      if (typeof value === "string") node.innerHTML = value;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((node) => {
      const pairs = node.getAttribute("data-i18n-attr").split(",");
      pairs.forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        const value = resolve(dict, key);
        if (typeof value === "string") node.setAttribute(attr, value);
      });
    });
  }

  function updateLangButtons() {
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      const code = btn.getAttribute("data-lang-btn");
      btn.setAttribute("aria-pressed", code === state.lang ? "true" : "false");
    });
  }

  function updateDocumentLang() {
    document.documentElement.lang = state.lang;
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale && OG_LOCALES[state.lang]) {
      ogLocale.setAttribute("content", OG_LOCALES[state.lang]);
    }
  }

  async function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    state.lang = lang;
    try {
      state.dict = await loadDict(lang);
      applyTranslations(state.dict);
    } catch (e) {
      // fallback to inline HTML content
      console.warn("Lang dict missing, using inline content:", e);
    }
    localStorage.setItem(STORAGE_KEY, lang);
    updateLangButtons();
    updateDocumentLang();
  }

  function bindButtons() {
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-lang-btn");
        if (code !== state.lang) setLang(code);
      });
    });
  }

  window.Zirkel = window.Zirkel || {};
  window.Zirkel.setLang = setLang;
  window.Zirkel.getLang = () => state.lang;

  document.addEventListener("DOMContentLoaded", () => {
    bindButtons();
    setLang(getInitialLang());
  });
})();
