// Lets the trailer pause the page-background scene while it plays, so only one
// heavy WebGL scene runs at a time on weaker devices.
let backgroundActive = true;

export function setBackgroundActive(active) {
  backgroundActive = Boolean(active);
}

export function isBackgroundActive() {
  return backgroundActive;
}