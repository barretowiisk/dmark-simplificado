"use strict";

const providerCatalog = [
  { match: /google|gmail/i, name: "Google", icon: "google" },
  { match: /zoho/i, name: "Zoho Mail", icon: "zoho" },
  { match: /microsoft|outlook|hotmail|protection\.outlook/i, name: "Microsoft", icon: "microsoftoutlook" },
  { match: /yahoo/i, name: "Yahoo", icon: "yahoo" },
  { match: /cloudflare/i, name: "Cloudflare", icon: "cloudflare" },
  { match: /fastmail/i, name: "Fastmail", icon: "fastmail" },
  { match: /proton/i, name: "Proton Mail", icon: "protonmail" },
  { match: /amazon|amazonses|aws/i, name: "Amazon Web Services", icon: "amazonwebservices" },
  { match: /apple|icloud/i, name: "Apple", icon: "apple" },
  { match: /mail\.ru|mailru/i, name: "Mail.ru", icon: "maildotru" }
];

function showProvider(org) {
  if (!org) return;
  const provider = providerCatalog.find((item) => item.match.test(org));
  const name = provider?.name || org;
  const initial = (name.match(/[A-ZÀ-Ý0-9]/i)?.[0] || "?").toUpperCase();
  let identity = document.querySelector("#providerIdentity");
  if (!identity) {
    identity = document.createElement("div");
    identity.id = "providerIdentity";
    identity.className = "provider-identity";
    document.querySelector("#reportMeta").before(identity);
  }
  identity.replaceChildren();
  const logo = document.createElement("span");
  logo.className = "provider-logo";
  const fallback = document.createElement("span");
  fallback.textContent = initial;
  logo.append(fallback);
  if (provider) {
    const image = document.createElement("img");
    image.src = `https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/${provider.icon}.svg`;
    image.alt = `Logo ${name}`;
    image.addEventListener("error", () => image.remove());
    logo.append(image);
  }
  const copy = document.createElement("span");
  const label = document.createElement("small");
  label.textContent = "Relatório emitido por";
  const title = document.createElement("strong");
  title.textContent = name;
  const original = document.createElement("em");
  original.textContent = org;
  copy.append(label, title, original);
  identity.append(logo, copy);
}

const reportMeta = document.querySelector("#reportMeta");
new MutationObserver(() => showProvider(reportMeta.querySelector("dd")?.textContent.trim()))
  .observe(reportMeta, { childList: true });
