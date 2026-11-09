const CHAMBERS = new Set(["senate", "house", "other"]);

export function initFilters(): void {
  const form = document.querySelector<HTMLFormElement>("#filters");
  const chamber = form?.querySelector<HTMLSelectElement>('[name="chamber"]');
  const party = form?.querySelector<HTMLSelectElement>('[name="party"]');
  const state = form?.querySelector<HTMLSelectElement>('[name="state"]');
  const query = form?.querySelector<HTMLInputElement>('[name="q"]');
  const count = document.querySelector<HTMLElement>("#count");
  const empty = document.querySelector<HTMLElement>("#empty");
  const share = document.querySelector<HTMLAnchorElement>("a[data-share]");
  const cards = [...document.querySelectorAll<HTMLElement>(".card")];
  const sections = [...document.querySelectorAll<HTMLElement>("[data-chamber-section]")];
  if (!form || !chamber || !party || !state || !query || !count || !empty) return;

  const chamberValues = new Set([...chamber.options].map((option) => option.value));
  const partyValues = new Set([...party.options].map((option) => option.value));
  const stateValues = new Set([...state.options].map((option) => option.value));
  let chamberFilter = "";
  let partyFilter = "";
  let stateFilter = "";

  const normalizeParty = (value: string) => {
    if (value.toLowerCase() === "other") return "other";
    return value.toUpperCase();
  };

  const readFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const requestedChamber = (params.get("chamber") ?? "").toLowerCase();
    chamberFilter = CHAMBERS.has(requestedChamber) ? requestedChamber : "";
    partyFilter = normalizeParty(params.get("party") ?? "");
    stateFilter = (params.get("state") ?? "").toUpperCase();
    chamber.value = chamberValues.has(chamberFilter) ? chamberFilter : "";
    party.value = partyValues.has(partyFilter) ? partyFilter : "";
    state.value = stateValues.has(stateFilter) ? stateFilter : "";
    query.value = params.get("q") ?? "";
  };

  const apply = (push: boolean) => {
    const q = query.value.trim().toLowerCase();
    let visible = 0;
    for (const card of cards) {
      const name = (card.dataset.name ?? "").toLowerCase();
      const match =
        (chamberFilter === "" || card.dataset.chamber === chamberFilter) &&
        (partyFilter === "" || card.dataset.party === partyFilter) &&
        (stateFilter === "" || card.dataset.state === stateFilter) &&
        (q === "" || name.includes(q));
      card.hidden = !match;
      if (match) visible += 1;
    }

    let sectionPlaceholder = false;
    for (const section of sections) {
      const id = section.dataset.chamberSection ?? "";
      const showSection = chamberFilter === "" || chamberFilter === id;
      section.hidden = !showSection;
      const placeholder = section.querySelector<HTMLElement>("[data-placeholder]");
      if (!showSection || !placeholder) continue;
      const visibleInSection = [...section.querySelectorAll<HTMLElement>(".card")].filter(
        (card) => !card.hidden,
      ).length;
      placeholder.hidden = visibleInSection !== 0;
      if (placeholder.hidden === false) sectionPlaceholder = true;
    }

    count.textContent = `Showing ${visible} of ${cards.length}`;
    empty.hidden = visible !== 0 || sectionPlaceholder || chamberFilter === "" || chamberFilter === "senate" || chamberFilter === "house";

    const params = new URLSearchParams();
    if (chamberFilter) params.set("chamber", chamberFilter);
    if (partyFilter) params.set("party", partyFilter);
    if (stateFilter) params.set("state", stateFilter);
    const trimmed = query.value.trim();
    if (trimmed) params.set("q", trimmed);
    const qs = params.toString();
    const path = `${location.pathname}${qs ? `?${qs}` : ""}`;
    if (`${location.pathname}${location.search}` !== path) {
      if (push) history.pushState(null, "", path);
      else history.replaceState(null, "", path);
    }
    if (share) {
      const url = new URL(share.href);
      url.searchParams.set("url", location.href);
      share.href = url.href;
    }
  };

  const fromControls = () => {
    chamberFilter = chamber.value;
    partyFilter = party.value;
    stateFilter = state.value;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    fromControls();
    apply(true);
  });
  form.addEventListener("input", () => {
    fromControls();
    apply(false);
  });
  window.addEventListener("popstate", () => {
    readFromUrl();
    apply(false);
  });

  readFromUrl();
  apply(false);
}
