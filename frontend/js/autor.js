const formulario = document.getElementById("form-autor");
const mensagem = document.getElementById("mensagem");

const parametros = new URLSearchParams(window.location.search);
const autor_id = parametros.get("autor_id");

// ======================================================
// CADASTRO / EDIÇÃO DE AUTOR
// ======================================================
if (formulario) {
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        mensagem.textContent = "";

        const autor = {
            nome: document.getElementById("nome").value
        };

        try {
            let resposta;
            if (autor_id) {
                resposta = await fetch(`/autores/${autor_id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(autor)
                });
            } else {
                resposta = await fetch("/autores", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(autor)
                });
            }

            const resultado = await resposta.json();

            if (resposta.ok) {
                if (autor_id) {
                    mensagem.textContent = "Autor alterado com sucesso!";
                } else {
                    mensagem.textContent = "Autor cadastrado com sucesso!";
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
// LISTAGEM DE AUTORES
// ======================================================
let autores = [];

async function carregarAutores() {
    const tabela = document.getElementById("listaAutores");
    if (!tabela) return;

    try {
        const resposta = await fetch("/autores");
        if (!resposta.ok) throw new Error("Erro ao buscar autores.");

        autores = await resposta.json();
        exibirAutores(autores);
    } catch (erro) {
        console.error("Erro ao carregar autores:", erro);
        tabela.innerHTML = `<tr><td colspan="3">Erro ao carregar os autores.</td></tr>`;
    }
}

function exibirAutores(listaAutores) {
    const tabela = document.getElementById("listaAutores");
    if (!tabela) return;

    tabela.innerHTML = "";
    listaAutores.forEach(autor => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${autor.autor_id}</td>
            <td>${autor.nome}</td>
            <td>
                <button type="button" class="btn btn-warning btn-sm" onclick="alterarAutor(${autor.autor_id})">✏️ Alterar</button>
                <button type="button" class="btn btn-danger btn-sm" onclick="excluirAutor(${autor.autor_id})">🗑️ Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

// ======================================================
// FILTRO
// ======================================================
function filtrarAutores() {
    const campoElemento = document.getElementById("campoFiltro");
    const textoElemento = document.getElementById("textoFiltro");
    if (!campoElemento || !textoElemento) return;

    const campo = campoElemento.value;
    const texto = textoElemento.value.toLowerCase().trim();

    const filtrados = autores.filter(autor => {
        const valor = autor[campo];
        return valor !== null && valor !== undefined && String(valor).toLowerCase().includes(texto);
    });

    exibirAutores(filtrados);
}

const textoFiltro = document.getElementById("textoFiltro");
if (textoFiltro) textoFiltro.addEventListener("input", filtrarAutores);

const campoFiltro = document.getElementById("campoFiltro");
if (campoFiltro) campoFiltro.addEventListener("change", filtrarAutores);

const btnLimparFiltro = document.getElementById("btnLimparFiltro");
if (btnLimparFiltro) {
    btnLimparFiltro.addEventListener("click", () => {
        document.getElementById("textoFiltro").value = "";
        exibirAutores(autores);
    });
}

// ======================================================
// CARREGAR DADOS DE EDIÇÃO E EXCLUSÃO
// ======================================================
carregarAutores();
carregarAutorParaAlteracao();

function alterarAutor(id) {
    window.location.href = `/frontend/cadastro_autor.html?autor_id=${id}`;
}

async function carregarAutorParaAlteracao() {
    if (!autor_id || !formulario) return;

    try {
        const resposta = await fetch("/autores");
        if (!resposta.ok) throw new Error("Erro ao buscar autores.");

        const lista = await resposta.json();
        const autor = lista.find(a => a.autor_id == autor_id);

        if (!autor) {
            mensagem.textContent = "Autor não encontrado.";
            return;
        }

        document.getElementById("nome").value = autor.nome;

        const titulo = document.getElementById("tituloFormulario");
        if (titulo) titulo.textContent = "Alterar Autor";
        const btn = document.getElementById("btnSalvar");
        if (btn) btn.textContent = "Salvar alterações";

    } catch (erro) {
        console.error("Erro ao carregar autor:", erro);
        mensagem.textContent = "Não foi possível carregar os dados do autor.";
    }
}

async function excluirAutor(id) {
    if (!confirm("Tem certeza que deseja excluir este autor?")) return;

    try {
        const resposta = await fetch(`/autores/${id}`, { method: "DELETE" });
        if (resposta.ok) {
            alert("Autor excluído com sucesso!");
            carregarAutores();
        } else {
            const resultado = await resposta.json();
            alert("Erro ao excluir o autor: " + (resultado.detail || "Erro desconhecido"));
        }
    } catch (erro) {
        console.error("Erro ao excluir autor:", erro);
        alert("Não foi possível conectar ao servidor.");
    }
}