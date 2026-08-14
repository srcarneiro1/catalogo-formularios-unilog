/* =========================================================
   CENTRAL DE FORMULÁRIOS - UNILOG EXPRESS
   ========================================================= */

let formularios = [];
let timeoutAPI = null;


/* =========================================================
   ELEMENTOS
   ========================================================= */

const catalogo = document.getElementById("catalogo");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");


/* =========================================================
   SEGURANÇA / TEXTO
   ========================================================= */

function escaparHTML(valor) {

  if (valor === null || valor === undefined) {
    return "";
  }

  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   VALIDAR URL
   ========================================================= */

function urlValida(url) {

  try {

    const endereco = new URL(url);

    return (
      endereco.protocol === "https:" ||
      endereco.protocol === "http:"
    );

  } catch (erro) {
    return false;
  }
}


/* =========================================================
   ESTADO VAZIO
   ========================================================= */

function mostrarEstadoVazio(
  titulo = "Nenhum formulário cadastrado",
  descricao = "Os formulários disponíveis serão exibidos aqui."
) {

  catalogo.innerHTML = `
    <div class="estado-vazio">

      <div class="icone-vazio">
        <span class="material-symbols-outlined">
          description
        </span>
      </div>

      <strong>
        ${escaparHTML(titulo)}
      </strong>

      <p>
        ${escaparHTML(descricao)}
      </p>

    </div>
  `;
}


/* =========================================================
   REMOVE SCRIPT JSONP
   ========================================================= */

function removerScriptJSONP() {

  const antigo = document.getElementById(
    "script-api-formularios"
  );

  if (antigo && antigo.parentNode) {
    antigo.parentNode.removeChild(antigo);
  }
}


/* =========================================================
   JSONP - RETORNO DO APPS SCRIPT
   ========================================================= */

window.receberFormularios = function (dados) {

  if (timeoutAPI) {
    clearTimeout(timeoutAPI);
    timeoutAPI = null;
  }

  /*
   * Não removemos o <script> enquanto ele ainda está sendo
   * executado. O cleanup é feito no próximo ciclo do navegador,
   * o que melhora a compatibilidade com Safari/WebViews.
   */
  setTimeout(removerScriptJSONP, 0);

  if (!Array.isArray(dados)) {

    console.error(
      "Resposta inválida da API:",
      dados
    );

    mostrarEstadoVazio();
    return;
  }

  formularios = dados;

  if (formularios.length === 0) {
    mostrarEstadoVazio();
    return;
  }

  renderizarCatalogo(formularios);
};


/* =========================================================
   CARREGAR FORMULÁRIOS
   ========================================================= */

function carregarFormularios() {

  catalogo.innerHTML = `
    <div class="estado">
      Carregando formulários...
    </div>
  `;

  if (
    !window.CONFIG ||
    !window.CONFIG.API_URL ||
    window.CONFIG.API_URL.includes("COLE_AQUI")
  ) {

    console.error(
      "A URL da API não foi configurada."
    );

    mostrarEstadoVazio();
    return;
  }

  removerScriptJSONP();

  const apiUrl = window.CONFIG.API_URL;

  const separador =
    apiUrl.includes("?")
      ? "&"
      : "?";

  /*
   * O callback é chamado explicitamente em window para evitar
   * diferenças de resolução de variável global entre navegadores.
   */
  const url =
    apiUrl +
    separador +
    "callback=window.receberFormularios" +
    "&t=" +
    Date.now();

  const script = document.createElement("script");

  script.id = "script-api-formularios";
  script.src = url;
  script.async = true;

  script.onerror = function () {

    if (timeoutAPI) {
      clearTimeout(timeoutAPI);
      timeoutAPI = null;
    }

    console.error(
      "Não foi possível carregar a API de formulários."
    );

    removerScriptJSONP();
    mostrarEstadoVazio();
  };

  /*
   * Evita a tela ficar indefinidamente em 'Carregando' caso
   * algum navegador/WebView interrompa silenciosamente o JSONP.
   */
  timeoutAPI = setTimeout(function () {

    console.error(
      "Tempo limite ao carregar a API de formulários."
    );

    removerScriptJSONP();
    mostrarEstadoVazio();

  }, 12000);

  document.body.appendChild(script);
}


/* =========================================================
   AGRUPAR POR CATEGORIA
   ========================================================= */

function agruparPorCategoria(lista) {

  return lista.reduce(
    function (grupos, formulario) {

      const categoria =
        String(
          formulario.categoria ||
          "Outros"
        ).trim() ||
        "Outros";

      if (!grupos[categoria]) {
        grupos[categoria] = [];
      }

      grupos[categoria].push(formulario);

      return grupos;
    },
    {}
  );
}


/* =========================================================
   ORDENAR
   ========================================================= */

function ordenarFormularios(lista) {

  return lista.slice().sort(
    function (a, b) {

      const ordemA =
        Number(a.ordem) || 999999;

      const ordemB =
        Number(b.ordem) || 999999;

      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }

      return String(a.nome || "")
        .localeCompare(
          String(b.nome || ""),
          "pt-BR"
        );
    }
  );
}


/* =========================================================
   CARD
   ========================================================= */

function criarCard(formulario) {

  const nome = escaparHTML(
    formulario.nome || "Formulário"
  );

  const descricao = escaparHTML(
    formulario.descricao || ""
  );

  const icone = escaparHTML(
    formulario.icone || "description"
  );

  const url = String(
    formulario.url || ""
  ).trim();

  if (!urlValida(url)) {

    return `
      <div class="card">

        <div class="card-icon">
          <span class="material-symbols-outlined">
            ${icone}
          </span>
        </div>

        <div class="card-content">
          <h3>${nome}</h3>
          ${descricao ? `<p>${descricao}</p>` : ""}
        </div>

      </div>
    `;
  }

  return `
    <a
      class="card"
      href="${escaparHTML(url)}"
      rel="noopener noreferrer"
    >

      <div class="card-icon">
        <span class="material-symbols-outlined">
          ${icone}
        </span>
      </div>

      <div class="card-content">
        <h3>${nome}</h3>
        ${descricao ? `<p>${descricao}</p>` : ""}
      </div>

      <div class="card-arrow">
        <span class="material-symbols-outlined">
          chevron_right
        </span>
      </div>

    </a>
  `;
}


/* =========================================================
   RENDERIZAR
   ========================================================= */

function renderizarCatalogo(lista) {

  if (!lista || lista.length === 0) {
    mostrarEstadoVazio();
    return;
  }

  const grupos = agruparPorCategoria(lista);

  const categorias = Object.keys(grupos)
    .sort(function (a, b) {
      return a.localeCompare(b, "pt-BR");
    });

  const html = categorias
    .map(function (categoria) {

      const itens = ordenarFormularios(
        grupos[categoria]
      );

      const cards = itens
        .map(criarCard)
        .join("");

      return `
        <section class="categoria">

          <div class="categoria-titulo">
            ${escaparHTML(categoria)}
          </div>

          <div class="cards">
            ${cards}
          </div>

        </section>
      `;
    })
    .join("");

  catalogo.innerHTML = html;
}


/* =========================================================
   NORMALIZAR BUSCA
   ========================================================= */

function normalizarTexto(valor) {

  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}


/* =========================================================
   PESQUISA
   ========================================================= */

function filtrarFormularios() {

  const termo = normalizarTexto(
    searchInput.value
  );

  clearSearch.classList.toggle(
    "visible",
    termo.length > 0
  );

  if (!termo) {
    renderizarCatalogo(formularios);
    return;
  }

  const filtrados = formularios.filter(
    function (formulario) {

      const nome = normalizarTexto(
        formulario.nome
      );

      const categoria = normalizarTexto(
        formulario.categoria
      );

      const descricao = normalizarTexto(
        formulario.descricao
      );

      return (
        nome.includes(termo) ||
        categoria.includes(termo) ||
        descricao.includes(termo)
      );
    }
  );

  if (filtrados.length === 0) {

    mostrarEstadoVazio(
      "Nenhum formulário encontrado",
      "Tente pesquisar utilizando outro termo."
    );

    return;
  }

  renderizarCatalogo(filtrados);
}


/* =========================================================
   EVENTOS
   ========================================================= */

function configurarEventos() {

  searchInput.addEventListener(
    "input",
    filtrarFormularios
  );

  clearSearch.addEventListener(
    "click",
    function () {

      searchInput.value = "";

      clearSearch.classList.remove(
        "visible"
      );

      renderizarCatalogo(formularios);

      searchInput.focus();
    }
  );
}


/* =========================================================
   INICIAR
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    configurarEventos();
    carregarFormularios();
  }
);
