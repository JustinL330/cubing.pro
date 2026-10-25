"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { getAdList } from "@/views/Advertisement/config";
import { carouselCopy } from "./carousel-copy";
import "@/views/ExternalLinks/externalLinks.css";

const CAROUSEL_HEIGHT = 450;

export function AdvertisementCarousel() {
  const adList = getAdList();
  const { locale } = useI18n();
  const copy = carouselCopy(locale);
  const [current, setCurrent] = useState(0);
  // "auto" respects the visitor's motion preference; "play" is an explicit opt-in.
  const [motionChoice, setMotionChoice] = useState<"auto" | "play" | "pause">("auto");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const playing =
    motionChoice === "play" || (motionChoice === "auto" && !reducedMotion);
  const shouldAdvance = adList.length > 1 && playing && !hovered && !focusWithin;

  useEffect(() => {
    if (!shouldAdvance) return;
    const duration = adList[current]?.duration ?? 10;
    const timer = window.setTimeout(() => {
      setCurrent((index) => (index + 1) % adList.length);
    }, duration * 1000);
    return () => window.clearTimeout(timer);
  }, [current, adList, shouldAdvance]);

  if (adList.length === 0) return null;

  return (
    <section
      className="ad-carousel-wrapper"
      aria-label={copy.carousel}
      aria-roledescription={copy.carouselDescription}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocusWithin(false);
        }
      }}
    >
      <div style={{ height: CAROUSEL_HEIGHT }} className="ad-carousel-container">
        <div
          className="ad-carousel-track"
          style={{ transform: `translateX(-${current * 100}%)` }}
          aria-live={shouldAdvance ? "off" : "polite"}
        >
          {adList.map((ad, index) => {
            const Thumbnail = ad.Thumbnail;
            const active = index === current;
            return (
              <div
                key={ad.key}
                className="ad-carousel-slide"
                role="group"
                aria-roledescription={copy.slideDescription}
                aria-label={copy.slideLabel(index + 1, adList.length)}
                aria-hidden={!active}
                inert={!active}
              >
                <div className="ad-carousel-thumbnail-wrap">
                  <Thumbnail />
                </div>
              </div>
            );
          })}
        </div>
        {adList.length > 1 && (
          <div className="ad-carousel-controls">
            <button
              type="button"
              className="ad-carousel-toggle"
              aria-label={playing ? copy.pause : copy.resume}
              aria-pressed={!playing}
              onClick={() => setMotionChoice(playing ? "pause" : "play")}
            >
              <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>
            </button>
            <div className="ad-carousel-dots">
              {adList.map((ad, index) => (
                <button
                  key={ad.key}
                  type="button"
                  className={`ad-carousel-dot${index === current ? " ad-carousel-dot--active" : ""}`}
                  aria-label={copy.goToSlide(index + 1, adList.length)}
                  aria-current={index === current ? "true" : undefined}
                  onClick={() => {
                    setCurrent(index);
                    setMotionChoice("pause");
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
