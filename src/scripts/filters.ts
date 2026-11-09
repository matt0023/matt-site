export function initFilters(): void {
  const form = document.querySelector<HTMLFormElement>("#filters");
  const party = form?.querySelector<HTMLSelectElement>('[name="party"]');
  const state = form?.querySelector<HTMLSelectElement>('[name="state"]');
  const query = form?.querySelector<HTMLInputElement>('[name="q"]');
  const count = document.querySelector<HTMLElement>("#count");
  const empty = document.querySelector<HTMLElement>("#empty");
  const share = document.querySelector<HTMLAnchorElement>("a[data-share]");
  const cards = [...document.querySelectorAll<HTMLElement>(".card")];
  if (!form || !party || !state || !query || !count || !empty) return;

  const partyValues = new Set([...party.options].map((option) => option.value));
  const stateValues = new Set([...state.options].map((option) => option.value));

  const normalizeParty = (value: string) => {
    if (value.toLowerCase() === "other") return "other";
    return value.toUpperCase();
  };

  const readFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const partyValue = normalizeParty(params.get("party") ?? "");
    const stateValue = (params.get("state") ?? "").toUpperCase();
    party.value = partyValues.has(partyValue) ? partyValue : "";
    state.value = stateValues.has(stateValue) ? stateValue : "";
    query.value = params.get("q") ?? "";
  };

  const apply = (push: boolean) => {
    const q = query.value.trim().toLowerCase();
    let visible = 0;
    for (const card of cards) {
      const name = (card.dataset.name ?? "").toLowerCase();
      const match =
        (party.value === "" || card.dataset.party === party.value) &&
        (state.value === "" || card.dataset.state === state.value) &&
        (q === "" || name.includes(q));
      card.hidden = !match;
      if (match) visible += 1;
    }
    count.textContent = `Showing ${visible} of ${cards.length}`;
    empty.hidden = visible !== 0;

    const params = new URLSearchParams();
    if (party.value) params.set("party", party.value);
    if (state.value) params.set("state", state.value);
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

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    apply(true);
  });
  form.addEventListener("input", () => apply(false));
  window.addEventListener("popstate", () => {
    readFromUrl();
    apply(false);
  });

  readFromUrl();
  apply(false);
}
