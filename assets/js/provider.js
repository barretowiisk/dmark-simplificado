"use strict";

const providerCatalog = [
  { match: /google|gmail/i, name: "Google", icon: "google.svg" },
  { match: /zoho/i, name: "Zoho Mail", icon: "zoho.svg" },
  { match: /microsoft|outlook|hotmail|protection\.outlook/i, name: "Microsoft" },
  { match: /yahoo/i, name: "Yahoo" },
  { match: /cloudflare/i, name: "Cloudflare", icon: "cloudflare.svg" },
  { match: /fastmail/i, name: "Fastmail" },
  { match: /proton/i, name: "Proton Mail", icon: "protonmail.svg" },
  { match: /amazon|amazonses|aws/i, name: "Amazon Web Services" },
  { match: /apple|icloud/i, name: "Apple", icon: "apple.svg" },
  { match: /mail\.ru|mailru/i, name: "Mail.ru", icon: "maildotru.svg" }
];

function getProviderInfo(org) {
  const known = providerCatalog.find((item) => item.match.test(org || ""));
  const name = known?.name || org || "Provedor não informado";
  return { name, org, icon: known?.icon, initial: (name.match(/[A-ZÀ-Ý0-9]/i)?.[0] || "?").toUpperCase() };
}

function createProviderLogo(org, compact = false) {
  const provider = getProviderInfo(org);
  const logo = document.createElement("span");
  logo.className = `provider-logo${compact ? " compact" : ""}`;
  const fallback = document.createElement("span");
  fallback.textContent = provider.initial;
  logo.append(fallback);
  if (provider.icon) {
    const image = document.createElement("img");
    image.alt = `Logo ${provider.name}`;
    image.addEventListener("load", () => { fallback.hidden = true; });
    image.addEventListener("error", () => image.remove());
    image.src = `assets/images/providers/${provider.icon}`;
    logo.append(image);
  }
  return logo;
}
