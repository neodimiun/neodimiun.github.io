import { CHAPTERS } from "./chapters"

export type MenuLink = {
  id: string
  href: string
  label: string
  num?: string
}

export type MenuSection = MenuLink & {
  children: MenuLink[]
}

export const PATH_TOC: MenuLink[] = CHAPTERS.map((c) => ({
  id: c.id,
  href: `#${c.id}`,
  label: c.label,
  num: c.num,
}))

export const LAB_TOC: MenuLink[] = [
  { id: "lab-0", href: "#lab-0", label: "Aerospace", num: "M1" },
  { id: "lab-1", href: "#lab-1", label: "Process", num: "M2" },
  { id: "lab-2", href: "#lab-2", label: "Quality", num: "M3" },
  { id: "lab-3", href: "#lab-3", label: "Pharma QC", num: "M4" },
  { id: "lab-archive", href: "#lab-archive", label: "Methods archive", num: "M5" },
]

export const MENU: MenuSection[] = [
  { id: "path", href: "#path", label: "Path & Work", children: PATH_TOC },
  { id: "lab", href: "#lab", label: "Lab Methods", children: LAB_TOC },
  { id: "credentials", href: "#credentials", label: "Credentials", children: [] },
  { id: "contact", href: "#contact", label: "Contact", children: [] },
]

export const LAB_DISCIPLINES: { label: string; ids: string[] }[] = [
  { label: "Methods", ids: ["lab-0", "lab-1", "lab-2", "lab-3", "lab-archive"] },
]

export const SECTION_IDS = ["path", "lab", "credentials", "contact"] as const
