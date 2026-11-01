"use strict";

const $ = (selector) => document.querySelector(selector);
const all = (node, selector) => [...(node?.querySelectorAll(selector) || [])];
const value = (node, fallback = "—") => node?.textContent?.trim() || fallback;
const sum = (items) => items.reduce((total, item) => total + item, 0);
const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
const policyName = { none: "monitoramento", quarantine: "quarentena", reject: "rejeição" };
const MAX_FILES = 100;
const MAX_BATCH_SIZE = 50 * 1024 * 1024;
let reports = [];
let duplicateTotal = 0;
let rejectedTotal = 0;
let overlapTotal = 0;

const dropZone = $("#dropZone");
const fileInput = $("#fileInput");
const errorMessage = $("#errorMessage");
dropZone.addEventListener("dragover", (event) => { event.preventDefault(); dropZone.classList.add("drag"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag"));
dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("drag");
  processFiles([...event.dataTransfer.files]);
});
fileInput.addEventListener("change", () => processFiles([...fileInput.files]));
$("#newAnalysis").addEventListener("click", resetAnalysis);
$("#clearFilters").addEventListener("click", () => {
  $("#domainFilter").value = "";
  $("#providerFilter").value = "";
  $("#statusFilter").value = "";
  applyFilters();
});
["#domainFilter", "#providerFilter", "#statusFilter"].forEach((selector) => $(selector).addEventListener("change", applyFilters));
$("#dnsCheck").addEventListener("click", checkCurrentDns);

async function processFiles(files) {
  hideError();
  if (!files.length) return;
  if (files.length > MAX_FILES) return showError(`Selecione no máximo ${MAX_FILES} arquivos por lote.`);
  const batchSize = sum(files.map((file) => file.size));
  if (batchSize > MAX_BATCH_SIZE) return showError("O lote ultrapassa o limite total de 50 MB.");

  const uploadTitle = dropZone.querySelector("h2");
  const originalTitle = uploadTitle.textContent;
  uploadTitle.textContent = `Processando ${files.length} ${files.length === 1 ? "arquivo" : "arquivos"}…`;
  const results = await Promise.allSettled(files.map(readReportFile));
  uploadTitle.textContent = originalTitle;

  const valid = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
  rejectedTotal = results.length - valid.length;
  const unique = new Map();
  duplicateTotal = 0;
  valid.forEach((report) => {
    const key = [report.domain, report.org, report.id, report.begin, report.end].join("|");
    if (unique.has(key)) duplicateTotal++;
    else unique.set(key, report);
  });
  reports = [...unique.values()].sort((a, b) => a.begin - b.begin);
  overlapTotal = countOverlaps(reports);
  if (!reports.length) {
    const firstError = results.find((result) => result.status === "rejected")?.reason?.message;
    return showError(firstError || "Nenhum relatório DMARC válido foi encontrado.");
  }
  renderDashboard();
  if (rejectedTotal) showError(`${rejectedTotal} ${rejectedTotal === 1 ? "arquivo não pôde" : "arquivos não puderam"} ser processado. Os demais foram analisados.`);
}

async function readReportFile(file) {
  const name = file.name.toLowerCase();
  let source;
  if (name.endsWith(".gz")) source = await decompress(file, "gzip");
  else if (name.endsWith(".zip")) source = await readZip(file);
  else if (name.endsWith(".xml")) source = await file.text();
  else throw new Error(`${file.name}: formato não suportado.`);
  const xml = new DOMParser().parseFromString(source, "application/xml");
  if (xml.querySelector("parsererror") || !xml.querySelector("feedback")) throw new Error(`${file.name}: relatório DMARC inválido.`);
  return parseReport(xml, file);
}

async function decompress(blob, format) {
  if (!window.DecompressionStream) throw new Error("Atualize o navegador para descompactar os arquivos localmente.");
  return new Response(blob.stream().pipeThrough(new DecompressionStream(format))).text();
}

async function readZip(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  let eocd = -1;
  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65557); index--) {
    if (view.getUint32(index, true) === 0x06054b50) { eocd = index; break; }
  }
  if (eocd < 0) throw new Error(`${file.name}: ZIP inválido ou incompleto.`);
  const entries = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  for (let index = 0; index < entries && offset + 46 <= bytes.length; index++) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    if (name.toLowerCase().endsWith(".xml")) {
      if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error(`${file.name}: estrutura ZIP inválida.`);
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const data = bytes.slice(start, start + compressedSize);
      if (method === 0) return new TextDecoder().decode(data);
      if (method === 8) return decompress(new Blob([data]), "deflate-raw");
      throw new Error(`${file.name}: método de compactação não suportado.`);
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`${file.name}: nenhum XML foi encontrado no ZIP.`);
}

function parseReport(xml, file) {
  const query = (node, selector) => node?.querySelector(selector);
  const metadata = query(xml, "report_metadata");
  const published = query(xml, "policy_published");
  const records = all(xml, "feedback > record").map((record) => {
    const evaluated = query(record, "policy_evaluated");
    return {
      ip: value(query(record, "source_ip")),
      count: Number(value(query(record, "row > count"), "0")),
      dkim: value(query(evaluated, "dkim"), "fail").toLowerCase(),
      spf: value(query(evaluated, "spf"), "fail").toLowerCase(),
      disposition: value(query(evaluated, "disposition"), "none").toLowerCase(),
      dkimAuth: all(record, "auth_results > dkim").map((item) => ({
        domain: value(query(item, "domain"), ""),
        selector: value(query(item, "selector"), ""),
        result: value(query(item, "result"), "").toLowerCase()
      })).filter((item) => item.domain && item.selector)
    };
  });
  return {
    filename: file.name, size: file.size,
    domain: value(query(published, "domain")), org: value(query(metadata, "org_name")),
    email: value(query(metadata, "email")), id: value(query(metadata, "report_id")),
    begin: Number(value(query(metadata, "date_range > begin"), "0")),
    end: Number(value(query(metadata, "date_range > end"), "0")),
    policy: value(query(published, "p"), "none").toLowerCase(),
    percentage: Number(value(query(published, "pct"), "100")),
    adkim: value(query(published, "adkim"), "r"), aspf: value(query(published, "aspf"), "r"),
    records
  };
}

function renderDashboard() {
  const domains = [...new Set(reports.map((report) => report.domain))];
  const providers = [...new Set(reports.map((report) => report.org))];
  const begin = Math.min(...reports.map((report) => report.begin).filter(Boolean));
  const end = Math.max(...reports.map((report) => report.end).filter(Boolean));
  const records = reports.flatMap((report) => report.records.map((record) => ({ ...record, report })));
  const total = sum(records.map((record) => record.count));
  const passed = sum(records.filter(isPassed).map((record) => record.count));
  const attention = records.filter((record) => !isPassed(record));
  const passRate = total ? Math.round((passed / total) * 1000) / 10 : 0;
  const policyScore = total ? sum(records.map((record) => record.count * policyStrength(record.report.policy))) / total : 0;
  const status = passRate === 100 ? "good" : passRate >= 80 ? "warn" : "bad";
  const policies = [...new Set(reports.map((report) => policyName[report.policy] || report.policy))];

  $("#reportCount").textContent = reports.length;
  const batchNotes = [];
  batchNotes.push(duplicateTotal ? `${duplicateTotal} duplicado${duplicateTotal > 1 ? "s" : ""} ignorado${duplicateTotal > 1 ? "s" : ""}` : "nenhum duplicado");
  if (overlapTotal) batchNotes.push(`${overlapTotal} período${overlapTotal > 1 ? "s" : ""} sobreposto${overlapTotal > 1 ? "s" : ""}`);
  $("#duplicateCount").textContent = batchNotes.join(" · ");
  $("#batchPeriod").textContent = `${formatDate(begin)} — ${formatDate(end)}`;
  $("#domainCount").textContent = domains.length;
  $("#domainNames").textContent = shortList(domains);
  $("#providerCount").textContent = providers.length;
  $("#providerNames").textContent = shortList(providers.map((org) => getProviderInfo(org).name));
  $("#authValue").textContent = passRate.toLocaleString("pt-BR");
  $("#authRing").style.setProperty("--score", passRate);
  $("#policyLevel").textContent = policyLabel(reports);
  $("#policyBar").style.width = `${policyScore}%`;
  $("#policyHint").textContent = policyExplanation(reports);
  $("#statusBadge").className = `badge ${status}`;
  $("#statusBadge").textContent = status === "good" ? "TUDO EM ORDEM" : status === "warn" ? "REQUER ATENÇÃO" : "AÇÃO RECOMENDADA";
  $("#summaryTitle").textContent = status === "good" ? "O lote está totalmente autenticado" : status === "warn" ? "A maioria das mensagens está autenticada" : "Há envios que precisam ser verificados";
  $("#summaryText").textContent = status === "good" ? `Todas as ${total.toLocaleString("pt-BR")} mensagens passaram por ao menos um mecanismo alinhado.` : `${(total - passed).toLocaleString("pt-BR")} de ${total.toLocaleString("pt-BR")} mensagens não passaram por DKIM nem SPF alinhados.`;
  $("#domainValue").textContent = domains.length === 1 ? domains[0] : `${domains.length} domínios`;
  $("#periodValue").textContent = `${reports.length} relatórios · ${formatDate(begin)} a ${formatDate(end)}`;
  $("#totalMessages").textContent = total.toLocaleString("pt-BR");
  $("#passRate").textContent = `${passRate.toLocaleString("pt-BR")}%`;
  $("#attentionSources").textContent = attention.length;
  $("#policyValue").textContent = policies.join(", ");
  $("#policyPercent").textContent = policies.length === 1 ? "política consistente no lote" : "houve mudança de política";
  renderActions(attention, passRate, domains, providers);
  renderProviderSummary(providers);
  $("#reportMeta").innerHTML = [["Arquivos válidos", reports.length], ["Duplicados ignorados", duplicateTotal], ["Arquivos com erro", rejectedTotal], ["Volume selecionado", formatBytes(sum(reports.map((report) => report.size)))]].map(([label, item]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(item)}</dd>`).join("");
  fillFilters(domains, providers);
  fillDnsDomains(domains);
  renderSourceRows(records);
  renderReportList(reports);
  $("#results").hidden = false;
  $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderActions(attention, passRate, domains, providers) {
  const items = [];
  items.push(passRate === 100 ? ["Nenhuma ação urgente", "Todos os envios do lote passaram por autenticação alinhada.", false] : ["Investigue falhas recorrentes", `${attention.length} combinações de origem apresentaram falha de alinhamento. Use os filtros para localizá-las.`, true]);
  if (domains.length > 1) items.push(["Analise cada domínio separadamente", `O lote contém ${domains.length} domínios. Compare os resultados sem misturar suas configurações.`, true]);
  if (providers.length > 1) items.push(["Compare a visão dos destinatários", `${providers.length} provedores reportaram tráfego. Diferenças entre eles podem revelar problemas específicos de entrega.`, false]);
  if (duplicateTotal) items.push(["Duplicados removidos", `${duplicateTotal} arquivo(s) repetido(s) não entrou(aram) nas métricas.`, false]);
  if (overlapTotal) items.push(["Revise períodos sobrepostos", `${overlapTotal} combinação(ões) de relatórios do mesmo domínio e provedor cobrem datas coincidentes e podem contar mensagens repetidas.`, true]);
  $("#actionTitle").textContent = attention.length ? "Há pontos para conferir" : "Apenas continue monitorando";
  $("#actionsList").innerHTML = items.map(([title, description, warning]) => `<div class="action ${warning ? "warn" : ""}"><i>${warning ? "!" : "✓"}</i><div><b>${escapeHtml(title)}</b><p>${escapeHtml(description)}</p></div></div>`).join("");
}

function renderProviderSummary(providers) {
  const container = $("#providerSummary");
  container.replaceChildren();
  providers.forEach((org) => {
    const item = document.createElement("span");
    item.className = "provider-chip";
    item.append(createProviderLogo(org, true));
    const name = document.createElement("b");
    name.textContent = getProviderInfo(org).name;
    item.append(name);
    container.append(item);
  });
}

function fillFilters(domains, providers) {
  setOptions($("#domainFilter"), domains.map((domain) => [domain, domain]));
  setOptions($("#providerFilter"), providers.map((org) => [org, getProviderInfo(org).name]));
  $("#statusFilter").value = "";
}

function fillDnsDomains(domains) {
  $("#dnsDomainSelect").innerHTML = domains.map((domain) => `<option value="${escapeHtml(domain)}">${escapeHtml(domain)}</option>`).join("");
  $("#dnsStatus").textContent = "";
  $("#dnsResults").hidden = true;
}

async function checkCurrentDns() {
  const domain = $("#dnsDomainSelect").value;
  if (!isDnsName(domain)) return;
  const button = $("#dnsCheck");
  button.disabled = true;
  button.textContent = "Consultando DNS…";
  $("#dnsResults").hidden = true;
  $("#dnsStatus").className = "dns-status loading";
  $("#dnsStatus").textContent = `Consultando os registros atuais de ${domain}…`;
  try {
    const domainReports = reports.filter((report) => report.domain === domain);
    const latest = [...domainReports].sort((a, b) => b.end - a.end)[0];
    const selectors = uniqueDkimSelectors(domainReports);
    const [dmarcResponse, spfResponse, dkimResponses] = await Promise.all([
      queryDnsSafe(`_dmarc.${domain}`, "TXT"),
      queryDnsSafe(domain, "TXT"),
      Promise.all(selectors.map(async (item) => ({ ...item, response: await queryDnsSafe(`${item.selector}._domainkey.${item.domain}`, "TXT") })))
    ]);
    const successfulQueries = [dmarcResponse, spfResponse, ...dkimResponses.map((item) => item.response)].filter((response) => !response.error);
    if (!successfulQueries.length) {
      const details = dmarcResponse.error || spfResponse.error || "conexão recusada";
      throw new Error(details);
    }
    renderDnsComparison(domain, latest, dmarcResponse, spfResponse, dkimResponses);
    $("#dnsResults").hidden = false;
    $("#dnsStatus").className = "dns-status success";
    const resolvers = [...new Set(successfulQueries.map((response) => response.resolver).filter(Boolean))];
    const failedCount = [dmarcResponse, spfResponse, ...dkimResponses.map((item) => item.response)].filter((response) => response.error).length;
    $("#dnsStatus").textContent = `Consulta concluída via ${resolvers.join(" e ")} em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date())}${failedCount ? `; ${failedCount} consulta(s) individual(is) falharam` : ""}.`;
  } catch (error) {
    console.error("Falha na consulta DNS:", error);
    $("#dnsStatus").className = "dns-status error";
    $("#dnsStatus").textContent = navigator.onLine
      ? `Os resolvedores DNS não responderam ou a conexão foi bloqueada. Detalhe: ${error.message || "erro de rede"}.`
      : "Você está offline. O relatório continua disponível, mas a comparação DNS requer internet.";
  } finally {
    button.disabled = false;
    button.textContent = "Verificar configuração DNS atual";
  }
}

async function queryDns(name, type) {
  if (!isDnsName(name)) throw new Error("Nome DNS inválido");
  const resolvers = [
    ...(location.protocol === "http:" || location.protocol === "https:" ? [{ name: "Proxy DNS do site", url: "/api/dns", headers: {} }] : []),
    { name: "Google Public DNS", url: "https://dns.google/resolve", headers: {} },
    { name: "Cloudflare DNS", url: "https://cloudflare-dns.com/dns-query", headers: { accept: "application/dns-json" } }
  ];
  let lastError;
  for (const resolver of resolvers) {
    try {
      const url = new URL(resolver.url, window.location.href);
      url.searchParams.set("name", name);
      url.searchParams.set("type", type);
      url.searchParams.set("cd", "false");
      url.searchParams.set("do", "false");
      const response = await fetchWithTimeout(url, { headers: resolver.headers, mode: "cors", cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" }, 10000);
      if (!response.ok) throw new Error(`${resolver.name}: HTTP ${response.status}`);
      const payload = await response.json();
      return { resolver: payload.resolver || resolver.name, status: payload.Status, answers: (payload.Answer || []).filter((answer) => answer.type === 16).map((answer) => normalizeTxt(answer.data)) };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Nenhum resolvedor DNS respondeu");
}

async function queryDnsSafe(name, type) {
  try { return await queryDns(name, type); }
  catch (error) {
    console.warn(`Consulta DNS indisponível para ${name}:`, error);
    return { status: null, answers: [], error: error.message || "erro de rede" };
  }
}

async function fetchWithTimeout(url, options, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

function renderDnsComparison(domain, latest, dmarcResponse, spfResponse, dkimResponses) {
  const dmarc = dmarcResponse.answers.find((record) => /^v=DMARC1\b/i.test(record));
  const spf = spfResponse.answers.find((record) => /^v=spf1\b/i.test(record));
  const currentPolicy = dmarc ? readDnsTag(dmarc, "p") : "";
  const currentPercent = dmarc ? readDnsTag(dmarc, "pct") || "100" : "";
  const samePolicy = dmarc && latest && currentPolicy === latest.policy && Number(currentPercent) === latest.percentage;

  setDnsCard("#dnsDmarcTitle", "#dnsDmarcText", "#dnsDmarcRecord", dmarc
    ? [samePolicy ? "Sem alteração desde o relatório" : "Configuração diferente do relatório", latest ? `Atual: ${policyName[currentPolicy] || currentPolicy} em ${currentPercent}%. Relatório mais recente: ${policyName[latest.policy] || latest.policy} em ${latest.percentage}%.` : "Registro DMARC encontrado.", dmarc, samePolicy ? "ok" : "warn"]
    : dmarcResponse.error
      ? ["Consulta DMARC indisponível", dmarcResponse.error, "", "error"]
      : ["Registro DMARC não encontrado", `Não foi localizado um TXT válido em _dmarc.${domain}.`, "", "error"]);

  setDnsCard("#dnsSpfTitle", "#dnsSpfText", "#dnsSpfRecord", spf
    ? ["Registro SPF publicado", "O domínio possui uma política SPF atual. A existência do registro não garante que todas as fontes estejam autorizadas.", spf, "ok"]
    : spfResponse.error
      ? ["Consulta SPF indisponível", spfResponse.error, "", "error"]
      : ["Registro SPF não encontrado", "Não foi localizado um TXT iniciado por v=spf1 no domínio.", "", "warn"]);

  const validDkim = dkimResponses.filter((item) => item.response.answers.some((record) => /\bv=DKIM1\b|\bp=/i.test(record)));
  $("#dnsDkimTitle").textContent = dkimResponses.length ? `${validDkim.length} de ${dkimResponses.length} seletores encontrados` : "Nenhum seletor disponível";
  $("#dnsDkimText").textContent = dkimResponses.length ? "A consulta usa os seletores observados nos relatórios enviados." : "Os relatórios não informaram seletores DKIM que pudessem ser consultados.";
  const list = $("#dnsDkimRecords");
  list.innerHTML = dkimResponses.map((item) => {
    const found = item.response.answers.some((record) => /\bv=DKIM1\b|\bp=/i.test(record));
    const label = item.response.error ? "consulta indisponível" : found ? "chave publicada" : "não encontrado";
    return `<span class="dns-selector ${found ? "ok" : "missing"}"><b>${escapeHtml(item.selector)}</b><small>${label}</small></span>`;
  }).join("");
  list.closest("article").className = `dns-dkim-card ${!dkimResponses.length ? "neutral" : validDkim.length === dkimResponses.length ? "dns-ok" : "dns-warn"}`;
}

function setDnsCard(titleSelector, textSelector, recordSelector, [title, text, record, state]) {
  $(titleSelector).textContent = title;
  $(textSelector).textContent = text;
  $(recordSelector).textContent = record;
  $(recordSelector).hidden = !record;
  $(titleSelector).closest("article").className = `dns-${state}`;
}

function uniqueDkimSelectors(items) {
  const unique = new Map();
  items.flatMap((report) => report.records.flatMap((record) => record.dkimAuth || [])).forEach((item) => {
    const key = `${item.selector}._domainkey.${item.domain}`.toLowerCase();
    if (isDnsName(key)) unique.set(key, item);
  });
  return [...unique.values()].slice(0, 20);
}

function normalizeTxt(text) { return String(text || "").replace(/^"|"$/g, "").replace(/"\s*"/g, ""); }
function readDnsTag(record, tag) { return record.split(";").map((part) => part.trim()).find((part) => part.toLowerCase().startsWith(`${tag.toLowerCase()}=`))?.split("=").slice(1).join("=").trim().toLowerCase() || ""; }
function isDnsName(name) { return /^(?=.{1,253}\.?$)(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.)*[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.?$/i.test(name); }

function setOptions(select, options) {
  select.innerHTML = '<option value="">Todos</option>' + options.map(([itemValue, label]) => `<option value="${escapeHtml(itemValue)}">${escapeHtml(label)}</option>`).join("");
}

function applyFilters() {
  const domain = $("#domainFilter").value;
  const provider = $("#providerFilter").value;
  const status = $("#statusFilter").value;
  const filteredReports = reports.filter((report) => (!domain || report.domain === domain) && (!provider || report.org === provider));
  const filteredRecords = filteredReports.flatMap((report) => report.records.map((record) => ({ ...record, report }))).filter((record) => !status || (status === "pass" ? isPassed(record) : !isPassed(record)));
  renderSourceRows(filteredRecords);
  renderReportList(filteredReports.filter((report) => !status || report.records.some((record) => status === "pass" ? isPassed(record) : !isPassed(record))));
}

function renderSourceRows(records) {
  $("#sourceCount").textContent = `${records.length} ${records.length === 1 ? "fonte" : "fontes"}`;
  $("#emptyFilter").hidden = records.length > 0;
  $("#sourceRows").innerHTML = records.map((record) => {
    const provider = getProviderInfo(record.report.org);
    return `<tr><td><span class="provider-cell" data-provider="${escapeHtml(record.report.org)}"><b>${escapeHtml(provider.name)}</b></span></td><td>${escapeHtml(record.report.domain)}</td><td><b>${escapeHtml(record.ip)}</b></td><td>${record.count.toLocaleString("pt-BR")}</td><td><span class="tag ${record.dkim === "pass" ? "pass" : "fail"}">${record.dkim === "pass" ? "Aprovado" : "Falhou"}</span></td><td><span class="tag ${record.spf === "pass" ? "pass" : "fail"}">${record.spf === "pass" ? "Aprovado" : "Falhou"}</span></td><td><span class="tag neutral">${escapeHtml(policyName[record.disposition] || record.disposition)}</span></td><td>${isPassed(record) ? "Autenticado" : "Verificar origem"}</td></tr>`;
  }).join("");
  all(document, ".provider-cell").forEach((cell) => {
    if (!cell.querySelector(".provider-logo")) cell.prepend(createProviderLogo(cell.dataset.provider, true));
  });
}

function renderReportList(items) {
  $("#visibleReportCount").textContent = `${items.length} ${items.length === 1 ? "relatório" : "relatórios"}`;
  const container = $("#reportList");
  container.replaceChildren();
  items.forEach((report) => {
    const total = sum(report.records.map((record) => record.count));
    const passed = sum(report.records.filter(isPassed).map((record) => record.count));
    const rate = total ? Math.round((passed / total) * 1000) / 10 : 0;
    const provider = getProviderInfo(report.org);
    const details = document.createElement("details");
    details.className = "report-item";
    details.innerHTML = `<summary><span class="report-provider"></span><span class="report-main"><b>${escapeHtml(provider.name)}</b><small>${escapeHtml(report.domain)} · ${formatDate(report.begin)} a ${formatDate(report.end)}</small></span><span class="report-rate ${rate === 100 ? "good" : rate >= 80 ? "warn" : "bad"}">${rate.toLocaleString("pt-BR")}%</span><span class="report-volume">${total.toLocaleString("pt-BR")} msg.</span><span class="report-arrow">⌄</span></summary><div class="report-detail"><span><small>Arquivo</small><b>${escapeHtml(report.filename)}</b></span><span><small>Política</small><b>${escapeHtml(policyName[report.policy] || report.policy)} (${report.percentage}%)</b></span><span><small>Registros</small><b>${report.records.length}</b></span><span><small>ID</small><b>${escapeHtml(report.id)}</b></span></div>`;
    details.querySelector(".report-provider").append(createProviderLogo(report.org, true));
    container.append(details);
  });
}

function isPassed(record) { return record.dkim === "pass" || record.spf === "pass"; }
function policyStrength(policy) { return policy === "reject" ? 100 : policy === "quarantine" ? 85 : 65; }
function policyLabel(items) {
  const found = [...new Set(items.map((report) => report.policy))];
  if (found.length > 1) return "Políticas diferentes";
  return found[0] === "reject" ? "Rejeição — proteção máxima" : found[0] === "quarantine" ? "Quarentena — proteção alta" : "Monitoramento — sem bloqueio";
}
function policyExplanation(items) {
  const found = [...new Set(items.map((report) => report.policy))];
  if (found.length > 1) return "O lote registra mudanças ou diferenças de política; examine cada relatório.";
  if (found[0] === "reject") return "Mensagens sem alinhamento devem ser rejeitadas pelo destinatário.";
  if (found[0] === "quarantine") return "Falhas devem ir para spam ou quarentena. Avance com cautela após validar todos os remetentes.";
  return "As falhas são apenas observadas. Use os relatórios para validar as fontes antes de proteger o domínio.";
}
function countOverlaps(items) {
  let overlaps = 0;
  for (let left = 0; left < items.length; left++) {
    for (let right = left + 1; right < items.length; right++) {
      const a = items[left], b = items[right];
      if (a.domain === b.domain && a.org === b.org && a.begin < b.end && b.begin < a.end) overlaps++;
    }
  }
  return overlaps;
}
function shortList(items) { return items.length > 3 ? `${items.slice(0, 3).join(", ")} +${items.length - 3}` : items.join(", "); }
function formatDate(timestamp) { return timestamp ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(timestamp * 1000)) : "não informado"; }
function formatBytes(bytes) { return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`; }
function showError(message) { errorMessage.textContent = message; errorMessage.classList.add("show"); }
function hideError() { errorMessage.textContent = ""; errorMessage.classList.remove("show"); }
function resetAnalysis() { reports = []; duplicateTotal = 0; rejectedTotal = 0; overlapTotal = 0; fileInput.value = ""; $("#results").hidden = true; hideError(); $("#inicio").scrollIntoView({ behavior: "smooth" }); }
