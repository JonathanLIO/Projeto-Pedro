const formulario = document.getElementById("form-ebook");
const mensagem = document.getElementById("mensagem");

const parametros = new URLSearchParams(window.location.search);
const ebook_id = parametros.get("ebook_id");

// ======================================================
// CARREGAR SELECTS (AUTORES E CATEGORIAS)
// ======================================================
async function carregarSelects() {
    const selectAutor = document.getElementById("autor_id");
    const selectCtego = document.getElementById("ctego_id");

    if (selectAutor) {
        try {
            const res = await fetch("/autores");
            if (res.ok) {
                const autores = await res.json();
                selectAutor.innerHTML = '<option value="">Selecione um Autor...</option>';
                autores.forEach(a => selectAutor.innerHTML += `<option value="${a.autor_id}">${a.nome}</option>`);
            }
        } catch (e) { console.error("Erro ao carregar autores", e); }
    }

    if (selectCtego) {
        try {
            const res = await fetch("/categorias");
            if (res.ok) {
                const categorias = await res.json();
                selectCtego.innerHTML = '<option value="">Selecione uma Categoria...</option>';
                categorias.forEach(c => selectCtego.innerHTML += `<option value="${c.ctego_id}">${c.nome}</option>`);
            }
        } catch (e) { console.error("Erro ao carregar categorias", e); }
    }
}

// ======================================================
// CADASTRO / EDIÇÃO DE E-BOOK
// ======================================================
if (formulario) {
    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        mensagem.textContent = "";

        const anoVal = document.getElementById("ano").value;
        const paginasVal = document.getElementById("paginas").value;

        const ebook = {
            titulo: document.getElementById("titulo").value,
            autor_id: parseInt(document.getElementById("autor_id").value),
            ctego_id: parseInt(document.getElementById("ctego_id").value),
            ano: anoVal ? parseInt(anoVal) : null,
            paginas: paginasVal ? parseInt(paginasVal) : null,
            descricao: document.getElementById("descricao").value || null,
            capa: document.getElementById("capa").value || null
        };

        try {
            let resposta;
            if (ebook_id) {
                resposta = await fetch(`/ebooks/${ebook_id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(ebook)
                });
            } else {
                resposta = await fetch("/ebooks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(ebook)
                });
            }

            const resultado = await resposta.json();

            if (resposta.ok) {
                if (ebook_id) {
                    mensagem.textContent = "E-Book alterado com sucesso!";
                } else {
                    mensagem.textContent = "E-Book cadastrado com sucesso!";
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
            if (campo === "titulo") return "Título inválido.";
            if (campo === "autor_id") return "Autor não selecionado.";
            if (campo === "ctego_id") return "Categoria não selecionada.";
            return erro.msg;
        }).join(" ");
    }
    return resultado.detail;
}

// ======================================================
// LISTAGEM DE E-BOOKS
// ======================================================
let ebooks = [];

async function carregarEBooks() {
    const tabela = document.getElementById("listaEBooks");
    if (!tabela) return;

    try {
        const resposta = await fetch("/ebooks");
        if (!resposta.ok) throw new Error("Erro ao buscar e-books.");

        ebooks = await resposta.json();
        exibirEBooks(ebooks);
    } catch (erro) {
        console.error("Erro ao carregar e-books:", erro);
        tabela.innerHTML = `<tr><td colspan="8">Erro ao carregar os e-books.</td></tr>`;
    }
}

function exibirEBooks(lista) {
    const tabela = document.getElementById("listaEBooks");
    if (!tabela) return;

    tabela.innerHTML = "";
    lista.forEach(e => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${e.ebook_id}</td>
            <td>${e.titulo}</td>
            <td>${e.autor_id}</td>
            <td>${e.ctego_id}</td>
            <td>${e.ano || "-"}</td>
            <td>${e.paginas || "-"}</td>
            <td>${e.descricao || "-"}</td>
            <td>
                <button type="button" class="btn btn-warning btn-sm" onclick="alterarEBook(${e.ebook_id})">✏️ Alterar</button>
                <button type="button" class="btn btn-danger btn-sm" onclick="excluirEBook(${e.ebook_id})">🗑️ Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });
}

// ======================================================
// FILTRO
// ======================================================
function filtrarEBooks() {
    const campoElemento = document.getElementById("campoFiltro");
    const textoElemento = document.getElementById("textoFiltro");
    if (!campoElemento || !textoElemento) return;

    const campo = campoElemento.value;
    const texto = textoElemento.value.toLowerCase().trim();

    const filtrados = ebooks.filter(e => {
        const valor = e[campo];
        return valor !== null && valor !== undefined && String(valor).toLowerCase().includes(texto);
    });

    exibirEBooks(filtrados);
}

const textoFiltro = document.getElementById("textoFiltro");
if (textoFiltro) textoFiltro.addEventListener("input", filtrarEBooks);

const campoFiltro = document.getElementById("campoFiltro");
if (campoFiltro) campoFiltro.addEventListener("change", filtrarEBooks);

const btnLimparFiltro = document.getElementById("btnLimparFiltro");
if (btnLimparFiltro) {
    btnLimparFiltro.addEventListener("click", () => {
        document.getElementById("textoFiltro").value = "";
        exibirEBooks(ebooks);
    });
}

// ======================================================
// CARREGAR DADOS DE EDIÇÃO E EXCLUSÃO
// ======================================================
carregarSelects().then(() => {
    carregarEBooks();
    carregarEBookParaAlteracao();
});

function alterarEBook(id) {
    window.location.href = `/frontend/cadastro_ebook.html?ebook_id=${id}`;
}

async function carregarEBookParaAlteracao() {
    if (!ebook_id || !formulario) return;

    try {
        const resposta = await fetch("/ebooks");
        if (!resposta.ok) throw new Error("Erro ao buscar e-books.");

        const lista = await resposta.json();
        const e = lista.find(item => item.ebook_id == ebook_id);

        if (!e) {
            mensagem.textContent = "E-Book não encontrado.";
            return;
        }

        document.getElementById("titulo").value = e.titulo;
        document.getElementById("autor_id").value = e.autor_id;
        document.getElementById("ctego_id").value = e.ctego_id;
        document.getElementById("ano").value = e.ano || "";
        document.getElementById("paginas").value = e.paginas || "";
        document.getElementById("descricao").value = e.descricao || "";
        document.getElementById("capa").value = e.capa || "";

        const tituloForm = document.getElementById("tituloFormulario");
        if (tituloForm) tituloForm.textContent = "Alterar E-Book";
        const btn = document.getElementById("btnSalvar");
        if (btn) btn.textContent = "Salvar alterações";

    } catch (erro) {
        console.error("Erro ao carregar e-book:", erro);
        mensagem.textContent = "Não foi possível carregar os dados do e-book.";
    }
}

async function excluirEBook(id) {
    if (!confirm("Tem certeza que deseja excluir este e-book?")) return;

    try {
        const resposta = await fetch(`/ebooks/${id}`, { method: "DELETE" });
        if (resposta.ok) {
            alert("E-Book excluído com sucesso!");
            carregarEBooks();
        } else {
            const resultado = await resposta.json();
            alert("Erro ao excluir e-book: " + (resultado.detail || "Erro desconhecido"));
        }
    } catch (erro) {
        console.error("Erro ao excluir e-book:", erro);
        alert("Não foi possível conectar ao servidor.");
    }
}