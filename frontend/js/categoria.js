const formulario = document.getElementById("form-categoria");
const mensagem = document.getElementById("mensagem");

const parametros = new URLSearchParams(window.location.search);
const ctego_id = parametros.get("ctego_id");

// ======================================================
// CADASTRO / EDIÇÃO DE CATEGORIA
// ======================================================
if (formulario) {
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        mensagem.textContent = "";

        const categoria = {
            nome: document.getElementById("nome").value
        };

        try {
            let resposta;
            if (ctego_id) {
                resposta = await fetch(`/categorias/${ctego_id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(categoria)
                });
            } else {
                resposta = await fetch("/categorias", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(categoria)
                });
            }

            const resultado = await resposta.json();

            if (resposta.ok) {
                if (ctego_id) {
                    mensagem.textContent = "Categoria alterada com sucesso!";
                } else {
                    mensagem.textContent = "Categoria cadastrada com sucesso!";
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
            if (campo === "nome") return "Nome inválido.";
            return erro.msg;
        }).join(" ");
    }
    return resultado.detail;
}

// ======================================================
// LISTAGEM DE CATEGORIAS
// ======================================================
let categorias = [];

async function carregarCategorias() {
    const tabela = document.getElementById("listaCategorias");
    if (!tabela) return;

    try {
        const resposta = await fetch("/categorias");
        if (!resposta.ok) throw new Error("Erro ao buscar categorias.");

        categorias = await resposta.json();
        exibirCategorias(categorias);
    } catch (erro) {
        console.error("Erro ao carregar categorias:", erro);
        tabela.innerHTML = `<tr><td colspan="3">Erro ao carregar as categorias.</td></tr>`;
    }
}

function exibirCategorias(listaCategorias) {
    const tabela = document.getElementById("listaCategorias");
    if (!tabela) return;

    tabela.innerHTML = "";
    listaCategorias.forEach(cat => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${cat.ctego_id}</td>
            <td>${cat.nome}</td>
            <td>
                <button type="button" class="btn btn-warning btn-sm" onclick="alterarCategoria(${cat.ctego_id})">✏️ Alterar</button>
                <button type="button" class="btn btn-danger btn-sm" onclick="excluirCategoria(${cat.ctego_id})">🗑️ Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

// ======================================================
// FILTRO
// ======================================================
function filtrarCategorias() {
    const campoElemento = document.getElementById("campoFiltro");
    const textoElemento = document.getElementById("textoFiltro");
    if (!campoElemento || !textoElemento) return;

    const campo = campoElemento.value;
    const texto = textoElemento.value.toLowerCase().trim();

    const filtradas = categorias.filter(cat => {
        const valor = cat[campo];
        return valor !== null && valor !== undefined && String(valor).toLowerCase().includes(texto);
    });

    exibirCategorias(filtradas);
}

const textoFiltro = document.getElementById("textoFiltro");
if (textoFiltro) textoFiltro.addEventListener("input", filtrarCategorias);

const campoFiltro = document.getElementById("campoFiltro");
if (campoFiltro) campoFiltro.addEventListener("change", filtrarCategorias);

const btnLimparFiltro = document.getElementById("btnLimparFiltro");
if (btnLimparFiltro) {
    btnLimparFiltro.addEventListener("click", () => {
        document.getElementById("textoFiltro").value = "";
        exibirCategorias(categorias);
    });
}

// ======================================================
// CARREGAR DADOS DE EDIÇÃO E EXCLUSÃO
// ======================================================
carregarCategorias();
carregarCategoriaParaAlteracao();

function alterarCategoria(id) {
    window.location.href = `/frontend/cadastro_categoria.html?ctego_id=${id}`;
}

async function carregarCategoriaParaAlteracao() {
    if (!ctego_id || !formulario) return;

    try {
        const resposta = await fetch("/categorias");
        if (!resposta.ok) throw new Error("Erro ao buscar categorias.");

        const lista = await resposta.json();
        const cat = lista.find(c => c.ctego_id == ctego_id);

        if (!cat) {
            mensagem.textContent = "Categoria não encontrada.";
            return;
        }

        document.getElementById("nome").value = cat.nome;

        const titulo = document.getElementById("tituloFormulario");
        if (titulo) titulo.textContent = "Alterar Categoria";
        const btn = document.getElementById("btnSalvar");
        if (btn) btn.textContent = "Salvar alterações";

    } catch (erro) {
        console.error("Erro ao carregar categoria:", erro);
        mensagem.textContent = "Não foi possível carregar os dados da categoria.";
    }
}

async function excluirCategoria(id) {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
        const resposta = await fetch(`/categorias/${id}`, { method: "DELETE" });
        if (resposta.ok) {
            alert("Categoria excluída com sucesso!");
            carregarCategorias();
        } else {
            const resultado = await resposta.json();
            alert("Erro ao excluir a categoria: " + (resultado.detail || "Erro desconhecido"));
        }
    } catch (erro) {
        console.error("Erro ao excluir categoria:", erro);
        alert("Não foi possível conectar ao servidor.");
    }
}