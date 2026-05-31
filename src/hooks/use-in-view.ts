"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Intersection Observer hook — пометить элемент как «visible» при скролле в viewport.
 *
 * Используется для scroll-reveal эффектов на landing-секциях.
 * Один раз срабатывает (once=true по умолчанию) — не отменяет visible state
 * при выходе из viewport, чтобы избежать дёрганья при быстром скролле.
 *
 * Возвращает `[ref, isVisible]`. Применяй на корневой DOM-элемент секции:
 *
 *   const [ref, visible] = useInView<HTMLDivElement>();
 *   return (
 *     <section ref={ref} className={`reveal-up ${visible ? "reveal-up--visible" : ""}`}>
 *       ...
 *     </section>
 *   );
 */
export function useInView<T extends HTMLElement>(options?: {
  /** Доля элемента, видимая в viewport, чтобы триггернуть. 0.15 по умолчанию. */
  threshold?: number;
  /** Маржа корневого элемента наблюдателя. Отрицательная — раньше срабатывает. */
  rootMargin?: string;
  /** Отключить «раз и навсегда» поведение. По умолчанию true (стабильнее на mobile). */
  once?: boolean;
}): [React.RefObject<T | null>, boolean] {
  const { threshold = 0.15, rootMargin = "0px 0px -10% 0px", once = true } =
    options ?? {};
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // SSR / older browsers safety
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, visible];
}
