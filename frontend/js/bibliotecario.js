const formulario = document.getElementById("form-bibliotecario");
const mensagem = document.getElementById("mensagem");

const parametros = new URLSearchParams(window.location.search);
const biblio_id = parametros.get("biblio_id");

// ======================================================
// CARREGAR SELECT DE USUÁRIOS
// ======================================================
async function carregarSelectUsuarios() {
    const selectUser = document.getElementById("user_id");
    if (!selectUser) return;

    try {
        const resposta = await fetch("/usuarios");
        if (!resposta.ok) return;

        const usuarios = await resposta.json();
        selectUser.innerHTML = '<option value="">Selecione um usuário...</option>';
        usuarios.forEach(u => {
            selectUser.innerHTML += `<option value="${u.user_id}">${u.nome} (ID: ${u.user_id})</option>`;
        });
    } catch (erro) {
        console.error("Erro ao carregar lista de usuários:", erro);
    }
}

// ======================================================
// CADASTRO / EDIÇÃO DE BIBLIOTECÁRIO
// ======================================================
if (formulario) {
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        mensagem.textContent = "";

        const bibliotecario = {
            user_id: parseInt(document.getElementById("user_id").value),
            matricula: document.getElementById("matricula").value
        };

        try {
            let resposta;
            if (biblio_id) {
                resposta = await fetch(`/bibliotecarios/${biblio_id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(bibliotecario)
                });
            } else {
                resposta = await fetch("/bibliotecarios", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(bibliotecario)
                });
            }

            const resultado = await resposta.json();

            if (resposta.ok) {
                if (biblio_id) {
                    mensagem.textContent = "Bibliotecário alterado com sucesso!";
                } else {
                    mensagem.textContent = "Bibliotecário cadastrado com sucesso!";
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
            if (campo === "user_id") return "Usuário inválido ou não selecionado.";
            if (campo === "matricula") return "Matrícula inválida.";
            return erro.msg;
        }).join(" ");
    }
    return resultado.detail;
}

// ======================================================
// LISTAGEM DE BIBLIOTECÁRIOS
// ======================================================
let bibliotecarios = [];

async function carregarBibliotecarios() {
    const tabela = document.getElementById("listaBibliotecarios");
    if (!tabela) return;

    try {
        const resposta = await fetch("/bibliotecarios");
        if (!resposta.ok) throw new Error("Erro ao buscar bibliotecários.");

        bibliotecarios = await resposta.json();
        exibirBibliotecarios(bibliotecarios);
    } catch (erro) {
        console.error("Erro ao carregar bibliotecários:", erro);
        tabela.innerHTML = `<tr><td colspan="4">Erro ao carregar bibliotecários.</td></tr>`;
    }
}

function exibirBibliotecarios(lista) {
    const tabela = document.getElementById("listaBibliotecarios");
    if (!tabela) return;

    tabela.innerHTML = "";
    lista.forEach(b => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${b.biblio_id}</td>
            <td>${b.user_id}</td>
            <td>${b.matricula}</td>
            <td>
                <button type="button" class="btn btn-warning btn-sm" onclick="alterarBibliotecario(${b.biblio_id})">✏️ Alterar</button>
                <button type="button" class="btn btn-danger btn-sm" onclick="excluirBibliotecario(${b.biblio_id})">🗑️ Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

// ======================================================
// FILTRO
// ======================================================
function filtrarBibliotecarios() {
    const campoElemento = document.getElementById("campoFiltro");
    const textoElemento = document.getElementById("textoFiltro");
    if (!campoElemento || !textoElemento) return;

    const campo = campoElemento.value;
    const texto = textoElemento.value.toLowerCase().trim();

    const filtrados = bibliotecarios.filter(b => {
        const valor = b[campo];
        return valor !== null && valor !== undefined && String(valor).toLowerCase().includes(texto);
    });

    exibirBibliotecarios(filtrados);
}

const textoFiltro = document.getElementById("textoFiltro");
if (textoFiltro) textoFiltro.addEventListener("input", filtrarBibliotecarios);

const campoFiltro = document.getElementById("campoFiltro");
if (campoFiltro) campoFiltro.addEventListener("change", filtrarBibliotecarios);

const btnLimparFiltro = document.getElementById("btnLimparFiltro");
if (btnLimparFiltro) {
    btnLimparFiltro.addEventListener("click", () => {
        document.getElementById("textoFiltro").value = "";
        exibirBibliotecarios(bibliotecarios);
    });
}

// ======================================================
// CARREGAR DADOS DE EDIÇÃO E EXCLUSÃO
// ======================================================
carregarSelectUsuarios().then(() => {
    carregarBibliotecarios();
    carregarBibliotecarioParaAlteracao();
});

function alterarBibliotecario(id) {
    window.location.href = `/frontend/cadastro_bibliotecario.html?biblio_id=${id}`;
}

async function carregarBibliotecarioParaAlteracao() {
    if (!biblio_id || !formulario) return;

    try {
        const resposta = await fetch("/bibliotecarios");
        if (!resposta.ok) throw new Error("Erro ao buscar bibliotecários.");

        const lista = await resposta.json();
        const b = lista.find(item => item.biblio_id == biblio_id);

        if (!b) {
            mensagem.textContent = "Bibliotecário não encontrado.";
            return;
        }

        document.getElementById("user_id").value = b.user_id;
        document.getElementById("matricula").value = b.matricula;

        const titulo = document.getElementById("tituloFormulario");
        if (titulo) titulo.textContent = "Alterar Bibliotecário";
        const btn = document.getElementById("btnSalvar");
        if (btn) btn.textContent = "Salvar alterações";

    } catch (erro) {
        console.error("Erro ao carregar bibliotecário:", erro);
        mensagem.textContent = "Não foi possível carregar os dados do bibliotecário.";
    }
}

async function excluirBibliotecario(id) {
    if (!confirm("Tem certeza que deseja excluir este bibliotecário?")) return;

    try {
        const resposta = await fetch(`/bibliotecarios/${id}`, { method: "DELETE" });
        if (resposta.ok) {
            alert("Bibliotecário excluído com sucesso!");
            carregarBibliotecarios();
        } else {
            const resultado = await resposta.json();
            alert("Erro ao excluir bibliotecário: " + (resultado.detail || "Erro desconhecido"));
        }
    } catch (erro) {
        console.error("Erro ao excluir bibliotecário:", erro);
        alert("Não foi possível conectar ao servidor.");
    }
}