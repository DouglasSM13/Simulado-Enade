// Botão de tema claro/escuro (sol/lua). O tema inicial é aplicado no <head> para não piscar.
export function iniciarTema() {
  const b = document.getElementById("bTema");
  const root = document.documentElement;
  if (!b) return;
  const sync = () => {
    const escuro = root.getAttribute("data-theme") === "dark";
    b.setAttribute("aria-label", escuro ? "Ativar tema claro" : "Ativar tema escuro");
    b.setAttribute("aria-pressed", String(escuro));
  };
  sync();
  b.addEventListener("click", () => {
    const novo = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", novo);
    try { localStorage.setItem("enadeTema", novo); } catch {}
    b.classList.remove("anim");
    void b.offsetWidth; // reinicia a animação
    b.classList.add("anim");
    clearTimeout(b._t);
    b._t = setTimeout(() => b.classList.remove("anim"), 1000);
    sync();
  });
}
