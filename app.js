let formularios = [];

async function carregarFormularios() {
  const catalogo = document.getElementById("catalogo");

  try {
    catalogo.innerHTML = `<div class="estado">Carregando formulários...</div>`;

    const response = await fetch(CONFIG.API_URL);
    formularios = await response.json();

    renderizarCatalogo(formularios);
  } catch (error) {
    console.error(error);
    catalogo.innerHTML = `<div class="estado">Erro ao carregar formulários.</div>`;
  }
}

function agruparPorCategoria(lista) {
  return lista.reduce((acc, item) => {
    const categoria = item.categoria || "Outros";
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(item);
    return acc;
  }, {});
}

function renderizarCatalogo(lista) {
  const catalogo = document.getElementById("catalogo");

  if (!lista.length) {
    catalogo.innerHTML = `<div class="estado">Nenhum formulário encontrado.</div>`;
    return;
  }

  const grupos = agruparPorCategoria(lista);

  catalogo.innerHTML = Object.keys(grupos)
    .sort()
    .map(categoria => {
      const cards = grupos[categoria]
        .map(item => `
          <a class="card" href="${item.url}" target="_blank" rel="noopener noreferrer">
            <div class="card-icon">
              <span class="material-symbols-outlined">${item.icone || "description"}</span>
            </div>
            <div class="card-content">
              <h3>${item.nome}</h3>
              <p>${item.descricao || ""}</p>
            </div>
          </a>
        `)
        .join("");

      return `
        <section class="categoria">
          <div class="categoria-titulo">${categoria}</div>
          <div class="cards">${cards}</div>
        </section>
      `;
    })
    .join("");
}

function configurarBusca() {
  const input = document.getElementById("searchInput");

  input.addEventListener("input", () => {
    const termo = input.value.trim().toLowerCase();

    const filtrados = formularios.filter(item =>
      (item.nome || "").toLowerCase().includes(termo) ||
      (item.categoria || "").toLowerCase().includes(termo) ||
      (item.descricao || "").toLowerCase().includes(termo)
    );

    renderizarCatalogo(filtrados);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  configurarBusca();
  carregarFormularios();
});
