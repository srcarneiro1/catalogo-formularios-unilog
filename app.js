/* =========================================================
   CENTRAL DE ATALHOS - UNILOG EXPRESS
   Dados carregados de forms.json no próprio GitHub Pages
   ========================================================= */

var formularios = [];


/* =========================================================
   ELEMENTOS
   ========================================================= */

var catalogo = document.getElementById("catalogo");
var searchInput = document.getElementById("searchInput");
var clearSearch = document.getElementById("clearSearch");


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
    var endereco = new URL(url);

    return (
      endereco.protocol === "https:" ||
      endereco.protocol === "http:"
    );
  } catch (erro) {
    return false;
  }
}


/* =========================================================
   ESTADOS DA INTERFACE
   ========================================================= */

function mostrarCarregando() {
  catalogo.innerHTML =
    '<div class="estado">Carregando atalhos...</div>';
}


function mostrarEstadoVazio(
  titulo,
  descricao
) {
  titulo = titulo || "Nenhum atalho cadastrado";
  descricao = descricao || "Os atalhos disponíveis serão exibidos aqui.";

  catalogo.innerHTML =
    '<div class="estado-vazio">' +
      '<div class="icone-vazio">' +
        '<span class="material-symbols-outlined">link</span>' +
      '</div>' +
      '<strong>' + escaparHTML(titulo) + '</strong>' +
      '<p>' + escaparHTML(descricao) + '</p>' +
    '</div>';
}


/* =========================================================
   CARREGAR forms.json
   ========================================================= */

function carregarFormularios() {
  mostrarCarregando();

  var xhr = new XMLHttpRequest();
  var url = "forms.json?t=" + new Date().getTime();

  xhr.open("GET", url, true);
  xhr.timeout = 12000;

  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) {
      return;
    }

    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        var dados = JSON.parse(xhr.responseText);

        if (!Array.isArray(dados)) {
          throw new Error("forms.json não contém uma lista válida.");
        }

        formularios = dados.filter(function (item) {
          return item && item.ativo !== false;
        });

        if (formularios.length === 0) {
          mostrarEstadoVazio();
          return;
        }

        renderizarCatalogo(formularios);
      } catch (erro) {
        console.error("Erro ao processar forms.json:", erro);
        mostrarEstadoVazio();
      }

      return;
    }

    console.error(
      "Erro ao carregar forms.json. HTTP:",
      xhr.status
    );

    mostrarEstadoVazio();
  };

  xhr.onerror = function () {
    console.error("Falha de rede ao carregar forms.json.");
    mostrarEstadoVazio();
  };

  xhr.ontimeout = function () {
    console.error("Tempo limite ao carregar forms.json.");
    mostrarEstadoVazio();
  };

  xhr.send();
}


/* =========================================================
   AGRUPAR POR CATEGORIA
   ========================================================= */

function agruparPorCategoria(lista) {
  return lista.reduce(
    function (grupos, formulario) {
      var categoria = String(
        formulario.categoria || "Outros"
      ).trim() || "Outros";

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
      var ordemA = Number(a.ordem) || 999999;
      var ordemB = Number(b.ordem) || 999999;

      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }

      return String(a.nome || "").localeCompare(
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
  var nome = escaparHTML(
    formulario.nome || "Atalho"
  );

  var descricao = escaparHTML(
    formulario.descricao || ""
  );

  var icone = escaparHTML(
    formulario.icone || "link"
  );

  var url = String(
    formulario.url || ""
  ).trim();

  if (!urlValida(url)) {
    return (
      '<div class="card">' +
        '<div class="card-icon">' +
          '<span class="material-symbols-outlined">' + icone + '</span>' +
        '</div>' +
        '<div class="card-content">' +
          '<h3>' + nome + '</h3>' +
          (descricao ? '<p>' + descricao + '</p>' : '') +
        '</div>' +
      '</div>'
    );
  }

  return (
    '<a class="card" href="' + escaparHTML(url) + '" rel="noopener noreferrer">' +
      '<div class="card-icon">' +
        '<span class="material-symbols-outlined">' + icone + '</span>' +
      '</div>' +
      '<div class="card-content">' +
        '<h3>' + nome + '</h3>' +
        (descricao ? '<p>' + descricao + '</p>' : '') +
      '</div>' +
      '<div class="card-arrow">' +
        '<span class="material-symbols-outlined">chevron_right</span>' +
      '</div>' +
    '</a>'
  );
}


/* =========================================================
   RENDERIZAR
   ========================================================= */

function renderizarCatalogo(lista) {
  if (!lista || lista.length === 0) {
    mostrarEstadoVazio();
    return;
  }

  var grupos = agruparPorCategoria(lista);

  var categorias = Object.keys(grupos)
    .sort(function (a, b) {
      return a.localeCompare(b, "pt-BR");
    });

  var html = categorias
    .map(function (categoria) {
      var itens = ordenarFormularios(
        grupos[categoria]
      );

      var cards = itens
        .map(criarCard)
        .join("");

      return (
        '<section class="categoria">' +
          '<div class="categoria-titulo">' + escaparHTML(categoria) + '</div>' +
          '<div class="cards">' + cards + '</div>' +
        '</section>'
      );
    })
    .join("");

  catalogo.innerHTML = html;
}


/* =========================================================
   NORMALIZAR BUSCA
   ========================================================= */

function normalizarTexto(valor) {
  var texto = String(valor || "").toLowerCase().trim();

  if (texto.normalize) {
    texto = texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  return texto;
}


/* =========================================================
   PESQUISA
   ========================================================= */

function filtrarFormularios() {
  var termo = normalizarTexto(
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

  var filtrados = formularios.filter(
    function (formulario) {
      var nome = normalizarTexto(
        formulario.nome
      );

      var categoria = normalizarTexto(
        formulario.categoria
      );

      var descricao = normalizarTexto(
        formulario.descricao
      );

      return (
        nome.indexOf(termo) !== -1 ||
        categoria.indexOf(termo) !== -1 ||
        descricao.indexOf(termo) !== -1
      );
    }
  );

  if (filtrados.length === 0) {
    mostrarEstadoVazio(
      "Nenhum atalho encontrado",
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
