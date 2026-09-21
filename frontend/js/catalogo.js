const formulario = document.getElementById("form-catalogo");
const mensagem = document.getElementById("mensagem");

const parametros = new URLSearchParams(window.location.search);
const id_catag = parametros.get("id_catag");

let ebooksGlobais = [];

// ======================================================
// CARREGAR SELECT DE E-BOOKS
// ======================================================
async function carregarSelectEBooks() {
    const selectEBook = document.getElementById("ebooks_ids");
    if (!selectEBook) return;

    try {
        const resposta = await fetch("/ebooks");
        if (!resposta.ok) return;

        ebooksGlobais = await resposta.json();
        selectEBook.innerHTML = "";
        
        ebooksGlobais.forEach(eb => {
            selectEBook.innerHTML += `<option value="${eb.ebook_id}">${eb.titulo}</option>`;
        });
    } catch (erro) {
        console.error("Erro ao carregar e-books:", erro);
    }
}

// ======================================================
// CADASTRO E EDIÇÃO DE CATÁLOGO
// ======================================================
if (formulario) {
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        mensagem.textContent = "";

        const selectEBooks = document.getElementById("ebooks_ids");
        const ebooksSelecionados = Array.from(selectEBooks.selectedOptions).map(opt => parseInt(opt.value));

        if (ebooksSelecionados.length === 0) {
            mensagem.textContent = "Erro: Selecione pelo menos um e-book para o catálogo.";
            return;
        }

        const catalogo = {
            nome: document.getElementById("nome").value,
            descricao: document.getElementById("descricao").value || null,
            ebooks_ids: ebooksSelecionados
        };

        try {
            let resposta;
            if (id_catag) {
                resposta = await fetch(`/catalogos/${id_catag}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(catalogo)
                });
            } else {
                resposta = await fetch("/catalogos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(catalogo)
                });
            }

            const resultado = await resposta.json();

            if (resposta.ok) {
                if (id_catag) {
                    mensagem.textContent = "Catálogo atualizado com sucesso!";
                } else {
                    mensagem.textContent = "Catálogo cadastrado com sucesso!";
                    formulario.reset();
                }
            } else {
                mensagem.textContent = "Erro: " + obterMensagemErro(resultado);
                console.error("Erro da API:", resultado);
            }
        } catch (erro) {
            mensagem.textContent = "Não foi possível conectar ao servidor.";
            console.error("Erro de conexão:", erro);
        }
    });
}

function obterMensagemErro(resultado) {
    if (!resultado.detail) return "Dados inválidos.";
    if (Array.isArray(resultado.detail)) {
        return resultado.detail.map(erro => {
            const campo = erro.loc?.[1];
            if (campo === "nome") return "Nome do catálogo inválido.";
            if (campo === "ebooks_ids") return "Selecione ao menos um e-book válido.";
            return erro.msg;
        }).join(" ");
    }
    return resultado.detail;
}

// ======================================================
// LISTAGEM DE CATÁLOGOS
// ======================================================
let catalogos = [];

async function carregarCatalogos() {
    const tabela = document.getElementById("listaCatalogos");
    if (!tabela) return;

    try {
        const resposta = await fetch("/catalogos");
        if (!resposta.ok) throw new Error("Erro ao buscar catálogos.");

        catalogos = await resposta.json();
        exibirCatalogos(catalogos);
    } catch (erro) {
        console.error("Erro ao carregar catálogos:", erro);
        tabela.innerHTML = `<tr><td colspan="5">Erro ao carregar os catálogos.</td></tr>`;
    }
}

function exibirCatalogos(lista) {
    const tabela = document.getElementById("listaCatalogos");
    if (!tabela) return;

    tabela.innerHTML = "";
    lista.forEach(c => {
        const quantidadeEbooks = c.ebooks_ids ? c.ebooks_ids.length : 0;
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${c.id_catag}</td>
            <td>${c.nome}</td>
            <td>${c.descricao || "-"}</td>
            <td>${quantidadeEbooks} e-book(s) (IDs: ${c.ebooks_ids ? c.ebooks_ids.join(", ") : "-"})</td>
            <td>
                <button type="button" class="btn btn-warning btn-sm" onclick="alterarCatalogo(${c.id_catag})">✏️ Alterar</button>
                <button type="button" class="btn btn-danger btn-sm" onclick="excluirCatalogo(${c.id_catag})">🗑️ Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

function alterarCatalogo(id) {
    window.location.href = `/frontend/cadastro_catalogo.html?id_catag=${id}`;
}

async function carregarCatalogoParaAlteracao() {
    if (!id_catag || !formulario) return;

    try {
        // Busca a lista completa de catálogos
        const resposta = await fetch("/catalogos");
        if (!resposta.ok) {
            mensagem.textContent = "Erro ao conectar com o servidor.";
            return;
        }

        const lista = await resposta.json();

        // Faz a busca convertendo ambos os lados para Number/String para garantir
        const c = lista.find(item => {
            const idItem = item.id_catag ?? item.ID_Catag ?? item.id;
            return String(idItem) === String(id_catag);
        });

        if (!c) {
            mensagem.textContent = "Erro: Catálogo não encontrado no sistema.";
            return;
        }

        // Preenche os campos do formulário
        document.getElementById("nome").value = c.nome || c.Nome || "";
        document.getElementById("descricao").value = c.descricao || c.Descricao || "";

        // Seleciona os e-books vinculados no select múltiplo
        const selectEBooks = document.getElementById("ebooks_ids");
        const listaEbooks = c.ebooks_ids || c.ebooks || [];
        
        if (selectEBooks && listaEbooks.length > 0) {
            Array.from(selectEBooks.options).forEach(opt => {
                // Converte para Number para comparar com os IDs do select
                opt.selected = listaEbooks.map(Number).includes(Number(opt.value));
            });
        }

        // Atualiza interface do formulário para modo Edição
        const titulo = document.getElementById("tituloFormulario");
        if (titulo) titulo.textContent = "Alterar Catálogo";
        
        const btn = document.getElementById("btnSalvar");
        if (btn) btn.textContent = "Salvar alterações";

    } catch (erro) {
        console.error("Erro ao carregar catálogo para alteração:", erro);
        mensagem.textContent = "Não foi possível carregar os dados do catálogo.";
    }
}

// ======================================================
// FILTRO ATUALIZADO
// ======================================================
function filtrarCatalogos() {
    const campoElemento = document.getElementById("campoFiltro");
    const textoElemento = document.getElementById("textoFiltro");
    if (!campoElemento || !textoElemento) return;

    const campo = campoElemento.value;
    const texto = textoElemento.value.toLowerCase().trim();

    const filtrados = catalogos.filter(c => {
        if (campo === "ebooks_ids") {
            // Se estiver filtrando por ID de E-Book, verifica se o ID pesquisado está no array
            return c.ebooks_ids && c.ebooks_ids.some(id => String(id).includes(texto));
        }

        const valor = c[campo];
        return valor !== null && valor !== undefined && String(valor).toLowerCase().includes(texto);
    });

    exibirCatalogos(filtrados);
}
const textoFiltro = document.getElementById("textoFiltro");
if (textoFiltro) textoFiltro.addEventListener("input", filtrarCatalogos);

const campoFiltro = document.getElementById("campoFiltro");
if (campoFiltro) campoFiltro.addEventListener("change", filtrarCatalogos);

const btnLimparFiltro = document.getElementById("btnLimparFiltro");
if (btnLimparFiltro) {
    btnLimparFiltro.addEventListener("click", () => {
        document.getElementById("textoFiltro").value = "";
        exibirCatalogos(catalogos);
    });
}

// ======================================================
// INICIALIZAÇÃO E EXCLUSÃO
// ======================================================
carregarSelectEBooks().then(() => {
    carregarCatalogos();
    carregarCatalogoParaAlteracao();
});

async function excluirCatalogo(id) {
    if (!confirm("Tem certeza que deseja excluir este catálogo?")) return;

    try {
        const resposta = await fetch(`/catalogos/${id}`, { method: "DELETE" });
        if (resposta.ok) {
            alert("Catálogo excluído com sucesso!");
            carregarCatalogos();
        } else {
            const resultado = await resposta.json();
            alert("Erro ao excluir catálogo: " + (resultado.detail || "Erro desconhecido"));
        }
    } catch (erro) {
        console.error("Erro ao excluir catálogo:", erro);
        alert("Não foi possível conectar ao servidor.");
    }
}