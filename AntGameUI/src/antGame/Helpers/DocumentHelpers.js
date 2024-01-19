export function SetPageDescription(description) {
  document.querySelector('meta[name="description"]').setAttribute("content", description);
}

export function SetPageCanonical() {
  const link = !!document.querySelector("link[rel='canonical']")
    ? document.querySelector("link[rel='canonical']")
    : document.createElement("link");
  link.setAttribute("rel", "canonical");
  link.setAttribute("href", document.location.protocol + "//" + document.location.host + document.location.pathname);
  document.head.appendChild(link);
}

export function SetPageTitle(title) {
  document.title = title;
}
