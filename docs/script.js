const menu = document.querySelector(".menu")
const sidebar = document.querySelector(".sidebar")
const sidebarLinks = document.querySelectorAll(".sidebar a")

const closeSidebar = () => {
  sidebar.classList.remove("open")
  menu.setAttribute("aria-expanded", "false")
}

menu.addEventListener("click", () => {
  const open = sidebar.classList.toggle("open")
  menu.setAttribute("aria-expanded", String(open))
})

sidebarLinks.forEach((link) => link.addEventListener("click", closeSidebar))

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebar.classList.contains("open")) {
    closeSidebar()
    menu.focus()
  }
})

const linkById = new Map()
sidebarLinks.forEach((link) => {
  const href = link.getAttribute("href")
  if (href && href.startsWith("#")) linkById.set(href.slice(1), link)
})

const sections = document.querySelectorAll("main section[id]")

if ("IntersectionObserver" in window && sections.length) {
  const setActive = (id) => {
    sidebarLinks.forEach((link) => {
      link.classList.toggle("is-active", link === linkById.get(id))
    })
  }

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
    if (visible.length) setActive(visible[0].target.id)
  }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 })

  sections.forEach((section) => observer.observe(section))
}

document.querySelectorAll("pre").forEach((pre) => {
  const wrap = document.createElement("div")
  wrap.className = "code-wrap"
  pre.parentNode.insertBefore(wrap, pre)
  wrap.appendChild(pre)

  const button = document.createElement("button")
  button.type = "button"
  button.className = "copy"
  button.textContent = "Copy"
  wrap.appendChild(button)

  button.addEventListener("click", async () => {
    const code = pre.querySelector("code")
    const text = code ? code.textContent : pre.textContent
    try {
      await navigator.clipboard.writeText(text)
      button.textContent = "Copied"
      button.classList.add("done")
      setTimeout(() => {
        button.textContent = "Copy"
        button.classList.remove("done")
      }, 1600)
    } catch (error) {
      button.textContent = "Gagal"
    }
  })
})

const finePointer = matchMedia("(pointer: fine)").matches
const isMobile = matchMedia("(max-width: 720px)").matches || matchMedia("(pointer: coarse)").matches

if (window.CursAnimation && finePointer && !isMobile) {
  CursAnimation.init({
    cursor: "ring",
    color: "#f2efe7",
    color2: "#ffd84d",
    size: 30,
    movement: "elastic",
    magnetic: { enabled: true, radius: 80, strength: 0.3 },
    swarm: { enabled: true, count: 8, radius: 140, speed: 0.9, avoid: 48, hideCursor: true },
    trail: { enabled: false },
    clickEffects: { enabled: true, ripple: true, particles: false },
    hoverEffects: true
  })
}

if (window.CursAnimation) {
  CursAnimation.rebuild({
    selector: ".demo-reveal",
    revealClass: "visible",
    threshold: 0.2,
    duration: isMobile ? 300 : 420,
    agents: isMobile ? 1 : 2,
    color: "auto",
    autoDark: "#111111",
    autoLight: "#f2efe7",
    colors: ["#f2efe7", "#ffd84d", "#5cc8ff", "#8b7cff", "#ff9ec4"],
    label: false,
    stagger: 50,
    maxConcurrent: 1,
    typeText: true,
    typeSelector: "h3,p",
    charDelay: isMobile ? 4 : 7,
    maxTypeDuration: isMobile ? 420 : 700,
    pen: true
  })
}
