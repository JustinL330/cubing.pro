import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { carouselCopy } from "../src/views/Welcome/carousel-copy.ts";

const locales = ["zh-CN", "zh-TW", "en-US", "ja-JP", "ko-KR", "es-ES"];
const component = readFileSync(new URL("../src/views/Welcome/AdvertisementCarousel.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/views/ExternalLinks/externalLinks.css", import.meta.url), "utf8");

test("all six locales provide meaningful carousel controls and slide names", () => {
  for (const locale of locales) {
    const copy = carouselCopy(locale);
    for (const field of ["carousel", "carouselDescription", "slideDescription", "pause", "resume"]) {
      assert.ok(copy[field].trim(), `${locale}: missing ${field}`);
    }
    assert.notEqual(copy.pause, copy.resume);
    assert.notEqual(copy.slideLabel(1, 2), copy.slideLabel(2, 2));
    assert.notEqual(copy.goToSlide(1, 2), copy.goToSlide(2, 2));
  }
});

test("carousel respects reduced motion and exposes a manual pause/resume button", () => {
  assert.match(component, /prefers-reduced-motion: reduce/);
  assert.match(component, /motionChoice === "auto" && !reducedMotion/);
  assert.match(component, /aria-pressed=\{!playing\}/);
  assert.match(component, /setMotionChoice\(playing \? "pause" : "play"\)/);
  assert.match(component, /!hovered && !focusWithin/);
  assert.match(component, /onFocusCapture/);
  assert.match(component, /onBlurCapture/);
});

test("offscreen slides are inert and controls have keyboard-visible focus", () => {
  assert.match(component, /inert=\{!active\}/);
  assert.match(component, /aria-hidden=\{!active\}/);
  assert.match(component, /aria-current=\{index === current/);
  assert.match(css, /\.ad-carousel-toggle:focus-visible/);
  assert.match(css, /\.ad-carousel-dot:focus-visible/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
