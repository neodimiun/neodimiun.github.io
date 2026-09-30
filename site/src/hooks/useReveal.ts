import { useEffect } from "react"

/**
 * Adds `is-in` to every `.reveal` element inside `root` (or the document)
 * the first time it enters the viewport. Pure progressive enhancement:
 * without JS the CSS never hides anything because the class is only
 * meaningful once this hook has run.
 */
export function useReveal(rootId?: string) {
  useEffect(() => {
    const root = rootId ? document.getElementById(rootId) : document
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>(".reveal"))
    if (els.length === 0) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in")
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [rootId])
}
