// ======================================================
// CONFIGURAÇÕES E ELEMENTOS GLOBAIS
// ======================================================
const formulario = document.getElementById("form-progresso");
const mensagem = document.getElementById("mensagem");

const parametros = new URLSearchParams(window.location.search);
const progresso_id = parametros.get("progresso_id");

let listaEbooksGlobal = [];
let listaProgressosGlobal = [];

// ======================================================
// CARREGAR SELECTS (USUÁRIOS E E-BOOKS)
// ======================================================
async function carregarSelects() {
    const selectUser = document.getElementById("user_id");
    const selectEBook = document.getElementById("ebook_id");
    const campoPaginas = document.getElementById("pagina_lidas");
    const campoAtualizacao = document.getElementById("atualizacao");

    // Buscar a lista global de progressos existentes para fazer a filtragem
    try {
        const resProg = await fetch("/progressos");
        if (resProg.ok) {
            listaProgressosGlobal = await resProg.json();
        }
    } catch (e) {
        console.error("Erro ao carregar lista de progressos:", e);
    }

    // Se estiver no fluxo de novo cadastro, bloqueia os campos subsequentes
    if (!progresso_id && selectEBook && campoPaginas && campoAtualizacao) {
        selectEBook.disabled = true;
        campoPaginas.disabled = true;
        campoAtualizacao.disabled = true;
    }

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
                listaEbooksGlobal = await res.json();
                selectEBook.innerHTML = '<option value="">Selecione primeiro o Usuário...</option>';
            }
        } catch (e) { console.error("Erro ao carregar e-books", e); }
    }
}

// ======================================================
// EVENTO: SELEÇÃO DE USUÁRIO (FILTRA OS E-BOOKS DISPONÍVEIS)
// ======================================================
const selectUser = document.getElementById("user_id");
if (selectUser) {
    selectUser.addEventListener("change", function () {
        const userId = parseInt(this.value);
        const selectEBook = document.getElementById("ebook_id");
        const campoPaginas = document.getElementById("pagina_lidas");
        const campoAtualizacao = document.getElementById("atualizacao");

        if (!selectEBook) return;

        if (!userId) {
            selectEBook.innerHTML = '<option value="">Selecione primeiro o Usuário...</option>';
            selectEBook.disabled = true;
            if (campoPaginas) { campoPaginas.value = ""; campoPaginas.disabled = true; }
            if (campoAtualizacao) { campoAtualizacao.value = ""; campoAtualizacao.disabled = true; }
            return;
        }

        // Descobre quais e-books o usuário selecionado já possui progresso cadastrado
        const ebooksJaCadastrados = listaProgressosGlobal
            .filter(p => p.user_id === userId && p.progresso_id != progresso_id)
            .map(p => p.ebook_id);

        // Filtra para exibir apenas os e-books não cadastrados
        const ebooksDisponiveis = listaEbooksGlobal.filter(eb => !ebooksJaCadastrados.includes(eb.ebook_id));

        selectEBook.innerHTML = '<option value="">Selecione o E-Book...</option>';
        if (ebooksDisponiveis.length === 0) {
            selectEBook.innerHTML = '<option value="">Todos os e-books já possuem progresso!</option>';
            selectEBook.disabled = true;
        } else {
            ebooksDisponiveis.forEach(eb => {
                selectEBook.innerHTML += `<option value="${eb.ebook_id}">${eb.titulo}</option>`;
            });
            selectEBook.disabled = false;
        }

        // Reseta os campos subsequentes caso altere o usuário
        if (campoPaginas) { campoPaginas.value = ""; campoPaginas.disabled = true; }
        if (campoAtualizacao) { campoAtualizacao.value = ""; campoAtualizacao.disabled = true; }
    });
}

// ======================================================
// EVENTO: SELEÇÃO DE E-BOOK (HABILITA PÁGINAS E DATA)
// ======================================================
const selectEBook = document.getElementById("ebook_id");
if (selectEBook) {
    selectEBook.addEventListener("change", function () {
        const ebookId = parseInt(this.value);
        const campoPaginas = document.getElementById("pagina_lidas");
        const campoAtualizacao = document.getElementById("atualizacao");

        if (!campoPaginas || !campoAtualizacao) return;

        if (!ebookId) {
            campoPaginas.disabled = true;
            campoAtualizacao.disabled = true;
            campoPaginas.value = "";
            return;
        }

        const ebookSelecionado = listaEbooksGlobal.find(e => e.ebook_id === ebookId);

        campoPaginas.disabled = false;
        campoAtualizacao.disabled = false;

        if (ebookSelecionado && ebookSelecionado.paginas) {
            campoPaginas.max = ebookSelecionado.paginas;
            campoPaginas.placeholder = `Máximo: ${ebookSelecionado.paginas} págs`;
        } else {
            campoPaginas.removeAttribute("max");
            campoPaginas.placeholder = "Páginas lidas";
        }
    });
}

// ======================================================
// CADASTRO / EDIÇÃO DE PROGRESSO COM VALIDAÇÃO
// ======================================================
if (formulario) {
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        mensagem.textContent = "";

        const ebookId = parseInt(document.getElementById("ebook_id").value);
        const paginasVal = document.getElementById("pagina_lidas")?.value;
        const paginasLidas = paginasVal ? parseInt(paginasVal) : 0;

        if (!ebookId) {
            mensagem.textContent = "Erro: Por favor, selecione um e-book.";
            return;
        }

        const ebookSelecionado = listaEbooksGlobal.find(e => e.ebook_id === ebookId);

        if (ebookSelecionado) {
            const maxPaginas = ebookSelecionado.paginas;

            if (paginasLidas < 0) {
                mensagem.textContent = "Erro: A quantidade de páginas lidas não pode ser negativa.";
                return;
            }

            if (paginasLidas > maxPaginas) {
                mensagem.textContent = `Erro: O e-book "${ebookSelecionado.titulo}" possui apenas ${maxPaginas} páginas. Você não pode cadastrar ${paginasLidas} páginas.`;
                return;
            }
        }

        const progresso = {
            pagina_lidas: paginasLidas,
            atualizacao: document.getElementById("atualizacao").value,
            user_id: parseInt(document.getElementById("user_id").value),
            ebook_id: ebookId
        };

        try {
            let resposta;
            if (progresso_id) {
                resposta = await fetch(`/progressos/${progresso_id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(progresso)
                });
            } else {
                resposta = await fetch("/progressos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(progresso)
                });
            }

            const resultado = await resposta.json();

            if (resposta.ok) {
                if (progresso_id) {
                    mensagem.textContent = "Progresso alterado com sucesso!";
                } else {
                    mensagem.textContent = "Progresso registrado com sucesso!";
                    formulario.reset();
                    // Atualiza a lista e reabilita o fluxo
                    carregarSelects();
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
            if (campo === "pagina_lidas") return "Quantidade de páginas lidas inválida.";
            if (campo === "atualizacao") return "Data de atualização inválida.";
            if (campo === "user_id") return "Usuário não selecionado.";
            if (campo === "ebook_id") return "E-Book não selecionado.";
            return erro.msg;
        }).join(" ");
    }
    return resultado.detail;
}

// ======================================================
// LISTAGEM DE PROGRESSOS
// ======================================================
let progressos = [];

async function carregarProgressos() {
    const tabela = document.getElementById("listaProgressos");
    if (!tabela) return;

    try {
        const resposta = await fetch("/progressos");
        if (!resposta.ok) throw new Error("Erro ao buscar progressos.");

        progressos = await resposta.json();
        exibirProgressos(progressos);
    } catch (erro) {
        console.error("Erro ao carregar progressos:", erro);
        tabela.innerHTML = `<tr><td colspan="6" class="text-center">Erro ao carregar os progressos.</td></tr>`;
    }
}

function exibirProgressos(lista) {
    const tabela = document.getElementById("listaProgressos");
    if (!tabela) return;

    tabela.innerHTML = "";
    lista.forEach(p => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${p.progresso_id}</td>
            <td>${p.pagina_lidas} págs (${p.prcnt_leitura}%)</td>
            <td>${p.atualizacao}</td>
            <td>${p.user_id}</td>
            <td>${p.ebook_id}</td>
            <td>
                <button type="button" class="btn btn-warning btn-sm" onclick="alterarProgresso(${p.progresso_id})">
                    ✏️ Alterar
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="excluirProgresso(${p.progresso_id})">
                    🗑️ Excluir
                </button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

// ======================================================
// FILTRO
// ======================================================
function filtrarProgressos() {
    const campoElemento = document.getElementById("campoFiltro");
    const textoElemento = document.getElementById("textoFiltro");
    if (!campoElemento || !textoElemento) return;

    const campo = campoElemento.value;
    const texto = textoElemento.value.toLowerCase().trim();

    const filtrados = progressos.filter(p => {
        const valor = p[campo];
        return valor !== null && valor !== undefined && String(valor).toLowerCase().includes(texto);
    });

    exibirProgressos(filtrados);
}

const textoFiltro = document.getElementById("textoFiltro");
if (textoFiltro) textoFiltro.addEventListener("input", filtrarProgressos);

const campoFiltro = document.getElementById("campoFiltro");
if (campoFiltro) campoFiltro.addEventListener("change", filtrarProgressos);

const btnLimparFiltro = document.getElementById("btnLimparFiltro");
if (btnLimparFiltro) {
    btnLimparFiltro.addEventListener("click", () => {
        document.getElementById("textoFiltro").value = "";
        exibirProgressos(progressos);
    });
}

// ======================================================
// INICIALIZAÇÃO
// ======================================================
carregarSelects().then(() => {
    carregarProgressos();
    carregarProgressoParaAlteracao();
});

function alterarProgresso(id) {
    window.location.href = `/frontend/cadastro_progresso.html?progresso_id=${id}`;
}

async function carregarProgressoParaAlteracao() {
    if (!progresso_id || !formulario) return;

    try {
        const resposta = await fetch("/progressos");
        if (!resposta.ok) throw new Error("Erro ao buscar progressos.");

        const lista = await resposta.json();
        const p = lista.find(item => item.progresso_id == progresso_id);

        if (!p) {
            mensagem.textContent = "Progresso não encontrado.";
            return;
        }

        // Habilita todos os campos para edição
        document.getElementById("user_id").value = p.user_id;
        
        // Dispara o evento de seleção de usuário para carregar e-books permitidos
        document.getElementById("user_id").dispatchEvent(new Event("change"));

        document.getElementById("ebook_id").value = p.ebook_id;
        document.getElementById("ebook_id").dispatchEvent(new Event("change"));

        document.getElementById("pagina_lidas").value = p.pagina_lidas;
        document.getElementById("atualizacao").value = p.atualizacao;

        const titulo = document.getElementById("tituloFormulario");
        if (titulo) titulo.textContent = "Alterar Progresso";
        const btn = document.getElementById("btnSalvar");
        if (btn) btn.textContent = "Salvar alterações";

    } catch (erro) {
        console.error("Erro ao carregar progresso:", erro);
        mensagem.textContent = "Não foi possível carregar os dados do progresso.";
    }
}

// ======================================================
// EXCLUSÃO DE PROGRESSO
// ======================================================
async function excluirProgresso(progressoId) {
    // Pede confirmação antes de apagar
    const confirmar = confirm("Tem certeza que deseja excluir este registro de progresso?");
    
    if (!confirmar) {
        return; // Cancela a exclusão
    }

    try {
        const resposta = await fetch(`/progressos/${progressoId}`, {
            method: "DELETE"
        });

        if (resposta.ok) {
            alert("Progresso excluído com sucesso!");
            // Recarrega os selects e a tabela para atualizar as opções disponíveis e a lista
            carregarSelects();
            carregarProgressos();
        } else {
            const resultado = await resposta.json();
            alert("Erro ao excluir o progresso: " + (resultado.detail || "Erro desconhecido"));
        }
    } catch (erro) {
        console.error("Erro ao excluir progresso:", erro);
        alert("Não foi possível conectar ao servidor para excluir o progresso.");
    }
}