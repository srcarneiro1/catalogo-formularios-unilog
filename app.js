/* =========================================================
   CENTRAL DE FORMULÁRIOS - UNILOG EXPRESS
   ========================================================= */

let formularios = [];


/* =========================================================
   ELEMENTOS
   ========================================================= */

const catalogo =
  document.getElementById("catalogo");

const searchInput =
  document.getElementById("searchInput");

const clearSearch =
  document.getElementById("clearSearch");


/* =========================================================
   SEGURANÇA / TRATAMENTO DE TEXTO
   ========================================================= */

function escaparHTML(valor) {

  if (valor === null || valor === undefined) {
    return "";
  }

  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

  } catch {

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
   CARREGAMENTO
   ========================================================= */

async function carregarFormularios() {

  catalogo.innerHTML = `
    <div class="estado">
      Carregando formulários...
    </div>
  `;

  try {

    if (
      !window.CONFIG ||
      !CONFIG.API_URL ||
      CONFIG.API_URL.includes("COLE_AQUI")
    ) {

      throw new Error(
        "A URL da API ainda não foi configurada em config.js."
      );

    }


    /*
     * timestamp evita que o navegador utilize uma
     * resposta antiga armazenada em cache.
     */

    const separador =
      CONFIG.API_URL.includes("?")
        ? "&"
        : "?";

    const url =
      `${CONFIG.API_URL}${separador}t=${Date.now()}`;


    const response = await fetch(url, {
      method: "GET",
      cache: "no-store"
    });


    if (!response.ok) {

      throw new Error(
        `Erro HTTP ${response.status}`
      );

    }


    const dados = await response.json();


    if (!Array.isArray(dados)) {

      throw new Error(
        "A API não retornou uma lista válida de formulários."
      );

    }


    formularios = dados;


    if (formularios.length === 0) {

      mostrarEstadoVazio();

      return;
    }


    renderizarCatalogo(formularios);

  } catch (error) {

    /*
     * O usuário do coletor não precisa visualizar
     * informações técnicas.
     *
     * O erro continua disponível no console para
     * diagnóstico.
     */

    console.error(
      "Erro ao carregar formulários:",
      error
    );


    mostrarEstadoVazio(
      "Nenhum formulário cadastrado",
      "Os formulários disponíveis serão exibidos aqui."
    );

  }

}


/* =========================================================
   AGRUPAMENTO
   ========================================================= */

function agruparPorCategoria(lista) {

  return lista.reduce(
    (grupos, formulario) => {

      const categoria =
        formulario.categoria?.trim() ||
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
   ORDENAÇÃO
   ========================================================= */

function ordenarFormularios(lista) {

  return [...lista].sort(
    (a, b) => {

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
   CRIAÇÃO DO CARD
   ========================================================= */

function criarCard(formulario) {

  const nome =
    escaparHTML(
      formulario.nome ||
      "Formulário"
    );


  const descricao =
    escaparHTML(
      formulario.descricao ||
      ""
    );


  const icone =
    escaparHTML(
      formulario.icone ||
      "description"
    );


  const url =
    String(
      formulario.url ||
      ""
    ).trim();


  /*
   * Caso o endereço seja inválido, não criamos
   * um link clicável.
   */

  if (!urlValida(url)) {

    return `
      <div class="card">

        <div class="card-icon">

          <span class="material-symbols-outlined">
            ${icone}
          </span>

        </div>


        <div class="card-content">

          <h3>
            ${nome}
          </h3>

          ${
            descricao
              ? `<p>${descricao}</p>`
              : ""
          }

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

        <h3>
          ${nome}
        </h3>

        ${
          descricao
            ? `<p>${descricao}</p>`
            : ""
        }

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
   RENDERIZAÇÃO
   ========================================================= */

function renderizarCatalogo(lista) {

  if (!lista || lista.length === 0) {

    mostrarEstadoVazio();

    return;

  }


  const grupos =
    agruparPorCategoria(lista);


  const categorias =
    Object.keys(grupos)
      .sort(
        (a, b) =>
          a.localeCompare(
            b,
            "pt-BR"
          )
      );


  const html =
    categorias
      .map(
        categoria => {

          const formulariosDaCategoria =
            ordenarFormularios(
              grupos[categoria]
            );


          const cards =
            formulariosDaCategoria
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

        }
      )
      .join("");


  catalogo.innerHTML = html;

}


/* =========================================================
   NORMALIZAÇÃO DE TEXTO
   ========================================================= */

function normalizarTexto(valor) {

  return String(valor || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();

}


/* =========================================================
   PESQUISA
   ========================================================= */

function filtrarFormularios() {

  const termo =
    normalizarTexto(
      searchInput.value
    );


  clearSearch.classList.toggle(
    "visible",
    termo.length > 0
  );


  if (!termo) {

    renderizarCatalogo(
      formularios
    );

    return;

  }


  const filtrados =
    formularios.filter(
      formulario => {

        const nome =
          normalizarTexto(
            formulario.nome
          );

        const categoria =
          normalizarTexto(
            formulario.categoria
          );

        const descricao =
          normalizarTexto(
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


  renderizarCatalogo(
    filtrados
  );

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
    () => {

      searchInput.value = "";

      clearSearch.classList.remove(
        "visible"
      );

      renderizarCatalogo(
        formularios
      );

      searchInput.focus();

    }
  );

}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    configurarEventos();

    carregarFormularios();

  }
);
