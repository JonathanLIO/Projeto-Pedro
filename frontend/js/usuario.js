const formulario = document.getElementById("form-usuario");
const mensagem = document.getElementById("mensagem");

const parametros = new URLSearchParams(window.location.search);
const user_id = parametros.get("user_id");

// ======================================================
// CADASTRO / EDIÇÃO DE USUÁRIO
// ======================================================
if (formulario) {
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        mensagem.textContent = "";

        const usuario = {
            nome: document.getElementById("nome").value,
            email: document.getElementById("email").value,
            senha: document.getElementById("senha").value,
            cpf: document.getElementById("cpf").value,
            data_nasc: document.getElementById("data_nasc").value
        };

        try {
            let resposta;
            if (user_id) {
                resposta = await fetch(`/usuarios/${user_id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(usuario)
                });
            } else {
                resposta = await fetch("/usuarios", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(usuario)
                });
            }

            const resultado = await resposta.json();

            if (resposta.ok) {
                if (user_id) {
                    mensagem.textContent = "Usuário alterado com sucesso!";
                } else {
                    mensagem.textContent = "Usuário cadastrado com sucesso!";
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
            if (campo === "email") return "E-mail inválido.";
            if (campo === "nome") return "Nome inválido.";
            if (campo === "senha") return "Senha inválida.";
            if (campo === "cpf") return "CPF inválido.";
            if (campo === "data_nasc") return "Data de nascimento inválida.";
            return erro.msg;
        }).join(" ");
    }
    return resultado.detail;
}

// ======================================================
// LISTAGEM DE USUÁRIOS
// ======================================================
let usuarios = [];

async function carregarUsuarios() {
    const tabela = document.getElementById("listaUsuarios");
    if (!tabela) return;

    try {
        const resposta = await fetch("/usuarios");
        if (!resposta.ok) throw new Error("Erro ao buscar usuários.");

        usuarios = await resposta.json();
        exibirUsuarios(usuarios);
    } catch (erro) {
        console.error("Erro ao carregar usuários:", erro);
        tabela.innerHTML = `<tr><td colspan="6">Erro ao carregar os usuários.</td></tr>`;
    }
}

function exibirUsuarios(listaUsuarios) {
    const tabela = document.getElementById("listaUsuarios");
    if (!tabela) return;

    tabela.innerHTML = "";
    listaUsuarios.forEach(u => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${u.user_id}</td>
            <td>${u.nome}</td>
            <td>${u.email}</td>
            <td>${u.cpf}</td>
            <td>${u.data_nasc}</td>
            <td>
                <button type="button" class="btn btn-warning btn-sm" onclick="alterarUsuario(${u.user_id})">✏️ Alterar</button>
                <button type="button" class="btn btn-danger btn-sm" onclick="excluirUsuario(${u.user_id})">🗑️ Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

// ======================================================
// FILTRO
// ======================================================
function filtrarUsuarios() {
    const campoElemento = document.getElementById("campoFiltro");
    const textoElemento = document.getElementById("textoFiltro");
    if (!campoElemento || !textoElemento) return;

    const campo = campoElemento.value;
    const texto = textoElemento.value.toLowerCase().trim();

    const filtrados = usuarios.filter(u => {
        const valor = u[campo];
        return valor !== null && valor !== undefined && String(valor).toLowerCase().includes(texto);
    });

    exibirUsuarios(filtrados);
}

const textoFiltro = document.getElementById("textoFiltro");
if (textoFiltro) textoFiltro.addEventListener("input", filtrarUsuarios);

const campoFiltro = document.getElementById("campoFiltro");
if (campoFiltro) campoFiltro.addEventListener("change", filtrarUsuarios);

const btnLimparFiltro = document.getElementById("btnLimparFiltro");
if (btnLimparFiltro) {
    btnLimparFiltro.addEventListener("click", () => {
        document.getElementById("textoFiltro").value = "";
        exibirUsuarios(usuarios);
    });
}

// ======================================================
// CARREGAR DADOS DE EDIÇÃO E EXCLUSÃO
// ======================================================
carregarUsuarios();
carregarUsuarioParaAlteracao();

function alterarUsuario(id) {
    window.location.href = `/frontend/cadastro_usuario.html?user_id=${id}`;
}

async function carregarUsuarioParaAlteracao() {
    if (!user_id || !formulario) return;

    try {
        const resposta = await fetch("/usuarios");
        if (!resposta.ok) throw new Error("Erro ao buscar usuários.");

        const lista = await resposta.json();
        const u = lista.find(item => item.user_id == user_id);

        if (!u) {
            mensagem.textContent = "Usuário não encontrado.";
            return;
        }

        document.getElementById("nome").value = u.nome;
        document.getElementById("email").value = u.email;
        document.getElementById("cpf").value = u.cpf;
        document.getElementById("data_nasc").value = u.data_nasc;

        const titulo = document.getElementById("tituloFormulario");
        if (titulo) titulo.textContent = "Alterar Usuário";
        const btn = document.getElementById("btnSalvar");
        if (btn) btn.textContent = "Salvar alterações";

    } catch (erro) {
        console.error("Erro ao carregar usuário:", erro);
        mensagem.textContent = "Não foi possível carregar os dados do usuário.";
    }
}

async function excluirUsuario(id) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
        const resposta = await fetch(`/usuarios/${id}`, { method: "DELETE" });
        if (resposta.ok) {
            alert("Usuário excluído com sucesso!");
            carregarUsuarios();
        } else {
            const resultado = await resposta.json();
            alert("Erro ao excluir o usuário: " + (resultado.detail || "Erro desconhecido"));
        }
    } catch (erro) {
        console.error("Erro ao excluir usuário:", erro);
        alert("Não foi possível conectar ao servidor.");
    }
}