const formulario = document.getElementById("form-avaliacao");
const mensagem = document.getElementById("mensagem");

// ======================================================
// CARREGAR SELECTS (USUÁRIOS E E-BOOKS)
// ======================================================
async function carregarSelects() {
    const selectUser = document.getElementById("user_id");
    const selectEBook = document.getElementById("ebook_id");

    if (selectUser) {
        try {
            const res = await fetch("/usuarios");
            if (res.ok) {
                const usuarios = await res.json();
                selectUser.innerHTML = '<option value="">Selecione o Usuário...</option>';
                usuarios.forEach(u => selectUser.innerHTML += `<option value="${u.user_id}">${u.nome}</option>`);
            }
        } catch (e) { console.error("Erro ao carregar usuários", e); }
    }

    if (selectEBook) {
        try {
            const res = await fetch("/ebooks");
            if (res.ok) {
                const ebooks = await res.json();
                selectEBook.innerHTML = '<option value="">Selecione o E-Book...</option>';
                ebooks.forEach(eb => selectEBook.innerHTML += `<option value="${eb.ebook_id}">${eb.titulo}</option>`);
            }
        } catch (e) { console.error("Erro ao carregar e-books", e); }
    }
}

// ======================================================
// CADASTRO DE AVALIAÇÃO
// ======================================================
if (formulario) {
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        mensagem.textContent = "";

        const avaliacao = {
            nota: parseInt(document.getElementById("nota").value),
            user_id: parseInt(document.getElementById("user_id").value),
            ebook_id: parseInt(document.getElementById("ebook_id").value)
        };

        try {
            const resposta = await fetch("/avaliacoes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(avaliacao)
            });

            const resultado = await resposta.json();

            if (resposta.ok) {
                mensagem.textContent = "Avaliação cadastrada com sucesso!";
                formulario.reset();
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
            if (campo === "nota") return "Nota inválida.";
            if (campo === "user_id") return "Usuário não selecionado.";
            if (campo === "ebook_id") return "E-Book não selecionado.";
            return erro.msg;
        }).join(" ");
    }
    return resultado.detail;
}

// ======================================================
// LISTAGEM DE AVALIAÇÕES
// ======================================================
let avaliacoes = [];

async function carregarAvaliacoes() {
    const tabela = document.getElementById("listaAvaliacoes");
    if (!tabela) return;

    try {
        const resposta = await fetch("/avaliacoes");
        if (!resposta.ok) throw new Error("Erro ao buscar avaliações.");

        avaliacoes = await resposta.json();
        exibirAvaliacoes(avaliacoes);
    } catch (erro) {
        console.error("Erro ao carregar avaliações:", erro);
        tabela.innerHTML = `<tr><td colspan="5">Erro ao carregar avaliações.</td></tr>`;
    }
}

function exibirAvaliacoes(lista) {
    const tabela = document.getElementById("listaAvaliacoes");
    if (!tabela) return;

    tabela.innerHTML = "";
    lista.forEach(a => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${a.avac_id}</td>
            <td>⭐ ${a.nota}</td>
            <td>${a.user_id}</td>
            <td>${a.ebook_id}</td>
            <td>
                <button type="button" class="btn btn-danger btn-sm" onclick="excluirAvaliacao(${a.avac_id})">🗑️ Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

// ======================================================
// FILTRO
// ======================================================
function filtrarAvaliacoes() {
    const campoElemento = document.getElementById("campoFiltro");
    const textoElemento = document.getElementById("textoFiltro");
    if (!campoElemento || !textoElemento) return;

    const campo = campoElemento.value;
    const texto = textoElemento.value.toLowerCase().trim();

    const filtradas = avaliacoes.filter(a => {
        const valor = a[campo];
        return valor !== null && valor !== undefined && String(valor).toLowerCase().includes(texto);
    });

    exibirAvaliacoes(filtradas);
}

const textoFiltro = document.getElementById("textoFiltro");
if (textoFiltro) textoFiltro.addEventListener("input", filtrarAvaliacoes);

const campoFiltro = document.getElementById("campoFiltro");
if (campoFiltro) campoFiltro.addEventListener("change", filtrarAvaliacoes);

const btnLimparFiltro = document.getElementById("btnLimparFiltro");
if (btnLimparFiltro) {
    btnLimparFiltro.addEventListener("click", () => {
        document.getElementById("textoFiltro").value = "";
        exibirAvaliacoes(avaliacoes);
    });
}

// ======================================================
// EXECUÇÃO E EXCLUSÃO
// ======================================================
carregarSelects().then(() => {
    carregarAvaliacoes();
});

async function excluirAvaliacao(id) {
    if (!confirm("Tem certeza que deseja excluir esta avaliação?")) return;

    try {
        const resposta = await fetch(`/avaliacoes/${id}`, { method: "DELETE" });
        if (resposta.ok) {
            alert("Avaliação excluída com sucesso!");
            carregarAvaliacoes();
        } else {
            const resultado = await resposta.json();
            alert("Erro ao excluir avaliação: " + (resultado.detail || "Erro desconhecido"));
        }
    } catch (erro) {
        console.error("Erro ao excluir avaliação:", erro);
        alert("Não foi possível conectar ao servidor.");
    }
}