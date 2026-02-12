import { useEffect, useRef, useCallback } from "react";
import { $headerVisible } from "../stores/uiStore";

// ============================================
// useAutoHideHeader Hook
// Detects scroll direction on a container ref
// and toggles header visibility via nanostore
//
// Uses requestAnimationFrame for performance
// Debounces with scroll threshold to avoid jitter
// ============================================

const SCROLL_THRESHOLD = 8; // px — minimum scroll delta to trigger change

export function useAutoHideHeader<T extends HTMLElement>() {
  const scrollRef = useRef<T>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (ticking.current) return;

    ticking.current = true;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) {
        ticking.current = false;
        return;
      }

      const currentY = el.scrollTop;
      const delta = currentY - lastScrollY.current;

      // Only react to meaningful scroll deltas (prevents jitter)
      if (Math.abs(delta) > SCROLL_THRESHOLD) {
        if (delta > 0 && currentY > 60) {
          // Scrolling DOWN + past initial threshold → hide
          $headerVisible.set(false);
        } else if (delta < 0) {
          // Scrolling UP → show
          $headerVisible.set(true);
        }
        lastScrollY.current = currentY;
      }

      // Always show header when near top
      if (currentY <= 10) {
        $headerVisible.set(true);
      }

      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Reset header visibility when ref changes (tab switch)
  useEffect(() => {
    $headerVisible.set(true);
    lastScrollY.current = 0;
  }, []);

  return scrollRef;
}
