const smartWakeLanguages = {
  "zh-Hans": "简体中文",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ru: "Русский",
  ug: "ئۇيغۇرچە",
};

const smartWakeRegionFallbacks = {
  CN: "zh-Hans", SG: "zh-Hans",
  ES: "es", MX: "es", AR: "es", BO: "es", CL: "es", CO: "es", CR: "es",
  CU: "es", DO: "es", EC: "es", GT: "es", HN: "es", NI: "es", PA: "es",
  PE: "es", PR: "es", PY: "es", SV: "es", UY: "es", VE: "es",
  FR: "fr", BE: "fr", MC: "fr", LU: "fr", SN: "fr", CI: "fr", CM: "fr",
  DE: "de", AT: "de", CH: "de", LI: "de",
  RU: "ru", BY: "ru", KZ: "ru", KG: "ru",
};

function smartWakeSupportedLanguage(identifier) {
  const normalized = identifier.replaceAll("_", "-").toLowerCase();
  if (normalized.startsWith("zh")) return "zh-Hans";
  return Object.keys(smartWakeLanguages).find(
    (language) => normalized === language.toLowerCase()
      || normalized.startsWith(`${language.toLowerCase()}-`)
  );
}

function smartWakeResolvedLanguage() {
  const queryLanguage = new URLSearchParams(location.search).get("lang");
  const savedLanguage = localStorage.getItem("smartwake.language");
  const explicitLanguage = queryLanguage && smartWakeSupportedLanguage(queryLanguage)
    || savedLanguage && smartWakeSupportedLanguage(savedLanguage);
  if (explicitLanguage) return explicitLanguage;

  for (const language of navigator.languages || [navigator.language]) {
    const supported = smartWakeSupportedLanguage(language);
    if (supported) return supported;
  }

  const region = (navigator.language || "").replaceAll("_", "-").split("-")[1]?.toUpperCase();
  return smartWakeRegionFallbacks[region] || "en";
}

function smartWakeReplaceText(root, translations) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.parentElement?.closest(".language-picker")) continue;
    const value = node.nodeValue.trim();
    const translated = translations[value];
    if (!translated) continue;
    const leading = node.nodeValue.match(/^\s*/)?.[0] || "";
    const trailing = node.nodeValue.match(/\s*$/)?.[0] || "";
    node.nodeValue = `${leading}${translated}${trailing}`;
  }
}

async function smartWakeApplyLanguage(language) {
  const response = await fetch("site-translations.json", { cache: "no-cache" });
  const allTranslations = await response.json();
  const translations = allTranslations[language] || allTranslations.en;

  document.documentElement.lang = language;
  document.documentElement.dir = language === "ug" ? "rtl" : "ltr";
  document.title = translations[document.title] || document.title;
  smartWakeReplaceText(document.body, translations);
  document.querySelectorAll("[aria-label]").forEach((element) => {
    const value = element.getAttribute("aria-label");
    if (translations[value]) element.setAttribute("aria-label", translations[value]);
  });
  document.querySelector(".language-picker select").value = language;
}

function smartWakeInstallLanguagePicker() {
  const picker = document.createElement("label");
  picker.className = "language-picker";
  picker.setAttribute("aria-label", "Language");
  const select = document.createElement("select");
  for (const [identifier, label] of Object.entries(smartWakeLanguages)) {
    const option = document.createElement("option");
    option.value = identifier;
    option.textContent = label;
    select.append(option);
  }
  select.addEventListener("change", () => {
    localStorage.setItem("smartwake.language", select.value);
    location.reload();
  });
  picker.append(select);
  document.querySelector("header nav").append(picker);
}

smartWakeInstallLanguagePicker();
smartWakeApplyLanguage(smartWakeResolvedLanguage());
