from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from mysql.connector import IntegrityError

from backend.database import criar_conexao
from backend.schemas import (
    AutorCreate, AutorResponse,
    CategoriaCreate, CategoriaResponse,
    UsuarioCreate, UsuarioResponse,
    BibliotecarioCreate, BibliotecarioResponse,
    EBookCreate, EBookResponse,
    AvaliacaoCreate, AvaliacaoResponse,
    ProgressoLivroCreate, ProgressoLivroResponse,
    CatalogoCreate, CatalogoResponse, CatalogoUpdate
)

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")


@app.get("/", include_in_schema=False)
def pagina_inicial():
    return FileResponse(FRONTEND_DIR / "index.html")


# ==========================================
# AUTORES
# ==========================================
@app.get("/autores", response_model=list[AutorResponse])
def listar_autores():
    conexao = criar_conexao()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT Autor_ID as autor_id, Nome as nome FROM Autor")
    autores = cursor.fetchall()
    cursor.close()
    conexao.close()
    return autores


@app.post("/autores", response_model=AutorResponse)
def cadastrar_autor(autor: AutorCreate):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = "INSERT INTO Autor (Nome) VALUES (%s)"
    try:
        cursor.execute(sql, (autor.nome,))
        conexao.commit()
        id_autor = cursor.lastrowid
        return {"autor_id": id_autor, "nome": autor.nome}
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=500, detail="Erro ao cadastrar autor no banco de dados.")
    finally:
        cursor.close()
        conexao.close()


@app.put("/autores/{autor_id}", response_model=AutorResponse)
def alterar_autor(autor_id: int, autor: AutorCreate):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = "UPDATE Autor SET Nome = %s WHERE Autor_ID = %s"
    try:
        cursor.execute(sql, (autor.nome, autor_id))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Autor não encontrado.")
        conexao.commit()
        return {"autor_id": autor_id, "nome": autor.nome}
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=500, detail="Erro de integridade no banco de dados.")
    finally:
        cursor.close()
        conexao.close()


@app.delete("/autores/{autor_id}")
def excluir_autor(autor_id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = "DELETE FROM Autor WHERE Autor_ID = %s"
    try:
        cursor.execute(sql, (autor_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Autor não encontrado.")
        conexao.commit()
        return {"mensagem": "Autor excluído com sucesso."}
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=409, detail="Não foi possível excluir o autor pois ele possui e-books vinculados.")
    finally:
        cursor.close()
        conexao.close()


# ==========================================
# CATEGORIAS
# ==========================================
@app.get("/categorias", response_model=list[CategoriaResponse])
def listar_categorias():
    conexao = criar_conexao()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT Ctego_ID as ctego_id, Nome as nome FROM Categoria")
    categorias = cursor.fetchall()
    cursor.close()
    conexao.close()
    return categorias


@app.post("/categorias", response_model=CategoriaResponse)
def cadastrar_categoria(categoria: CategoriaCreate):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = "INSERT INTO Categoria (Nome) VALUES (%s)"
    try:
        cursor.execute(sql, (categoria.nome,))
        conexao.commit()
        id_ctego = cursor.lastrowid
        return {"ctego_id": id_ctego, "nome": categoria.nome}
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=500, detail="Erro ao cadastrar categoria no banco de dados.")
    finally:
        cursor.close()
        conexao.close()


@app.put("/categorias/{ctego_id}", response_model=CategoriaResponse)
def alterar_categoria(ctego_id: int, categoria: CategoriaCreate):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = "UPDATE Categoria SET Nome = %s WHERE Ctego_ID = %s"
    try:
        cursor.execute(sql, (categoria.nome, ctego_id))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Categoria não encontrada.")
        conexao.commit()
        return {"ctego_id": ctego_id, "nome": categoria.nome}
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=500, detail="Erro de integridade no banco de dados.")
    finally:
        cursor.close()
        conexao.close()


@app.delete("/categorias/{ctego_id}")
def excluir_categoria(ctego_id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = "DELETE FROM Categoria WHERE Ctego_ID = %s"
    try:
        cursor.execute(sql, (ctego_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Categoria não encontrada.")
        conexao.commit()
        return {"mensagem": "Categoria excluída com sucesso."}
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=409, detail="Não foi possível excluir a categoria pois ela possui e-books vinculados.")
    finally:
        cursor.close()
        conexao.close()


# ==========================================
# USUÁRIOS
# ==========================================
@app.get("/usuarios", response_model=list[UsuarioResponse])
def listar_usuarios():
    conexao = criar_conexao()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("""
        SELECT User_ID as user_id, Nome as nome, Email as email, CPF as cpf, Data_nasc as data_nasc
        FROM Usuario
    """)
    usuarios = cursor.fetchall()
    cursor.close()
    conexao.close()
    return usuarios


@app.post("/usuarios", response_model=UsuarioResponse)
def cadastrar_usuario(usuario: UsuarioCreate):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = """
        INSERT INTO Usuario (Nome, Email, Senha, CPF, Data_nasc)
        VALUES (%s, %s, %s, %s, %s)
    """
    valores = (usuario.nome, usuario.email, usuario.senha, usuario.cpf, usuario.data_nasc)
    try:
        cursor.execute(sql, valores)
        conexao.commit()
        id_usuario = cursor.lastrowid
        return {
            "user_id": id_usuario,
            "nome": usuario.nome,
            "email": usuario.email,
            "cpf": usuario.cpf,
            "data_nasc": usuario.data_nasc
        }
    except IntegrityError as erro:
        conexao.rollback()
        if erro.errno == 1062:
            raise HTTPException(status_code=409, detail="E-mail ou CPF já cadastrado.")
        raise HTTPException(status_code=500, detail="Erro de integridade no banco de dados.")
    finally:
        cursor.close()
        conexao.close()


@app.put("/usuarios/{user_id}", response_model=UsuarioResponse)
def alterar_usuario(user_id: int, usuario: UsuarioCreate):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = """
        UPDATE Usuario
        SET Nome = %s, Email = %s, Senha = %s, CPF = %s, Data_nasc = %s
        WHERE User_ID = %s
    """
    valores = (usuario.nome, usuario.email, usuario.senha, usuario.cpf, usuario.data_nasc, user_id)
    try:
        cursor.execute(sql, valores)
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        conexao.commit()
        return {
            "user_id": user_id,
            "nome": usuario.nome,
            "email": usuario.email,
            "cpf": usuario.cpf,
            "data_nasc": usuario.data_nasc
        }
    except IntegrityError as erro:
        conexao.rollback()
        if erro.errno == 1062:
            raise HTTPException(status_code=409, detail="E-mail ou CPF já cadastrado.")
        raise HTTPException(status_code=500, detail="Erro de integridade no banco de dados.")
    finally:
        cursor.close()
        conexao.close()


@app.delete("/usuarios/{user_id}")
def excluir_usuario(user_id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = "DELETE FROM Usuario WHERE User_ID = %s"
    try:
        cursor.execute(sql, (user_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        conexao.commit()
        return {"mensagem": "Usuário excluído com sucesso."}
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=500, detail="Não foi possível excluir o usuário.")
    finally:
        cursor.close()
        conexao.close()


# ==========================================
# BIBLIOTECÁRIOS
# ==========================================
@app.get("/bibliotecarios", response_model=list[BibliotecarioResponse])
def listar_bibliotecarios():
    conexao = criar_conexao()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("""
        SELECT Biblio_ID as biblio_id, User_ID as user_id, Matricula as matricula
        FROM Bibliotecario
    """)
    bibliotecarios = cursor.fetchall()
    cursor.close()
    conexao.close()
    return bibliotecarios


@app.post("/bibliotecarios", response_model=BibliotecarioResponse)
def cadastrar_bibliotecario(bibliotecario: BibliotecarioCreate):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = "INSERT INTO Bibliotecario (User_ID, Matricula) VALUES (%s, %s)"
    try:
        cursor.execute(sql, (bibliotecario.user_id, bibliotecario.matricula))
        conexao.commit()
        id_biblio = cursor.lastrowid
        return {
            "biblio_id": id_biblio,
            "user_id": bibliotecario.user_id,
            "matricula": bibliotecario.matricula
        }
    except IntegrityError as erro:
        conexao.rollback()
        if erro.errno == 1062:
            raise HTTPException(status_code=409, detail="Usuário já vinculado como bibliotecário ou Matrícula em uso.")
        raise HTTPException(status_code=500, detail="Erro de integridade no banco de dados.")
    finally:
        cursor.close()
        conexao.close()


@app.put("/bibliotecarios/{biblio_id}", response_model=BibliotecarioResponse)
def alterar_bibliotecario(biblio_id: int, bibliotecario: BibliotecarioCreate):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = "UPDATE Bibliotecario SET User_ID = %s, Matricula = %s WHERE Biblio_ID = %s"
    try:
        cursor.execute(sql, (bibliotecario.user_id, bibliotecario.matricula, biblio_id))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Bibliotecário não encontrado.")
        conexao.commit()
        return {
            "biblio_id": biblio_id,
            "user_id": bibliotecario.user_id,
            "matricula": bibliotecario.matricula
        }
    except IntegrityError as erro:
        conexao.rollback()
        if erro.errno == 1062:
            raise HTTPException(status_code=409, detail="Usuário já vinculado como bibliotecário ou Matrícula em uso.")
        raise HTTPException(status_code=500, detail="Erro de integridade no banco de dados.")
    finally:
        cursor.close()
        conexao.close()


@app.delete("/bibliotecarios/{biblio_id}")
def excluir_bibliotecario(biblio_id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = "DELETE FROM Bibliotecario WHERE Biblio_ID = %s"
    try:
        cursor.execute(sql, (biblio_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Bibliotecário não encontrado.")
        conexao.commit()
        return {"mensagem": "Bibliotecário excluído com sucesso."}
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=500, detail="Não foi possível excluir o bibliotecário.")
    finally:
        cursor.close()
        conexao.close()


# ==========================================
# E-BOOKS
# ==========================================
@app.get("/ebooks", response_model=list[EBookResponse])
def listar_ebooks():
    conexao = criar_conexao()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("""
        SELECT EBook_ID as ebook_id, Titulo as titulo, Autor_ID as autor_id, Ctego_ID as ctego_id,
               Ano as ano, Paginas as paginas, Descricao as descricao, Capa as capa
        FROM EBook
    """)
    ebooks = cursor.fetchall()
    cursor.close()
    conexao.close()
    return ebooks


@app.post("/ebooks", response_model=EBookResponse)
def cadastrar_ebook(ebook: EBookCreate):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = """
        INSERT INTO EBook (Titulo, Autor_ID, Ctego_ID, Ano, Paginas, Descricao, Capa)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    valores = (ebook.titulo, ebook.autor_id, ebook.ctego_id, ebook.ano, ebook.paginas, ebook.descricao, ebook.capa)
    try:
        cursor.execute(sql, valores)
        conexao.commit()
        id_ebook = cursor.lastrowid
        return {"ebook_id": id_ebook, **ebook.model_dump()}
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=400, detail="Autor ou Categoria inexistente.")
    finally:
        cursor.close()
        conexao.close()


@app.put("/ebooks/{ebook_id}", response_model=EBookResponse)
def alterar_ebook(ebook_id: int, ebook: EBookCreate):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = """
        UPDATE EBook
        SET Titulo = %s, Autor_ID = %s, Ctego_ID = %s, Ano = %s, Paginas = %s, Descricao = %s, Capa = %s
        WHERE EBook_ID = %s
    """
    valores = (ebook.titulo, ebook.autor_id, ebook.ctego_id, ebook.ano, ebook.paginas, ebook.descricao, ebook.capa, ebook_id)
    try:
        cursor.execute(sql, valores)
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="E-Book não encontrado.")
        conexao.commit()
        return {"ebook_id": ebook_id, **ebook.model_dump()}
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=400, detail="Autor ou Categoria não encontrados no banco.")
    finally:
        cursor.close()
        conexao.close()


@app.delete("/ebooks/{ebook_id}")
def excluir_ebook(ebook_id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = "DELETE FROM EBook WHERE EBook_ID = %s"
    try:
        cursor.execute(sql, (ebook_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="E-Book não encontrado.")
        conexao.commit()
        return {"mensagem": "E-Book excluído com sucesso."}
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=500, detail="Não foi possível excluir o E-Book.")
    finally:
        cursor.close()
        conexao.close()


# ==========================================
# AVALIAÇÕES
# ==========================================
@app.get("/avaliacoes", response_model=list[AvaliacaoResponse])
def listar_avaliacoes():
    conexao = criar_conexao()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("""
        SELECT Avac_ID as avac_id, Nota as nota, User_ID as user_id, EBook_ID as ebook_id
        FROM Avaliacao
    """)
    avaliacoes = cursor.fetchall()
    cursor.close()
    conexao.close()
    return avaliacoes

@app.post("/avaliacoes", response_model=AvaliacaoResponse)
def cadastrar_avaliacao(avaliacao: AvaliacaoCreate):
    conexao = criar_conexao()
    cursor = conexao.cursor(dictionary=True)
    try:
        # 1. Verifica se este utilizador já avaliou este e-book
        sql_verifica = "SELECT Avac_ID FROM Avaliacao WHERE User_ID = %s AND EBook_ID = %s"
        cursor.execute(sql_verifica, (avaliacao.user_id, avaliacao.ebook_id))
        ja_avaliou = cursor.fetchone()

        if ja_avaliou:
            raise HTTPException(
                status_code=400, 
                detail="Você já avaliou este e-book"
            )

        # 2. Se não avaliou, insere a nova avaliação
        sql_insert = "INSERT INTO Avaliacao (Nota, User_ID, EBook_ID) VALUES (%s, %s, %s)"
        cursor.execute(sql_insert, (avaliacao.nota, avaliacao.user_id, avaliacao.ebook_id))
        conexao.commit()
        id_avac = cursor.lastrowid

        return {"avac_id": id_avac, **avaliacao.model_dump()}

    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=400, detail="Usuário ou E-Book inválido.")
    finally:
        cursor.close()
        conexao.close()

@app.delete("/avaliacoes/{avac_id}")
def excluir_avaliacao(avac_id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = "DELETE FROM Avaliacao WHERE Avac_ID = %s"
    try:
        cursor.execute(sql, (avac_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Avaliação não encontrada.")
        conexao.commit()
        return {"mensagem": "Avaliação excluída com sucesso."}
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=500, detail="Não foi possível excluir a avaliação.")
    finally:
        cursor.close()
        conexao.close()


# ==========================================
# PROGRESSO DO LIVRO
# ==========================================
@app.get("/progressos", response_model=list[ProgressoLivroResponse])
def listar_progressos():
    conexao = criar_conexao()
    cursor = conexao.cursor(dictionary=True)
    
    # Chamamos a função Progresso_Leitura_Porcent diretamente na query
    query = """
        SELECT 
            Progresso_ID as progresso_id,
            Pagina_Lidas as pagina_lidas,
            Progresso_Leitura_Porcent(User_ID, EBook_ID) as prcnt_leitura,
            Atualizacao as atualizacao,
            User_ID as user_id,
            EBook_ID as ebook_id
        FROM Progresso_Livro
    """
    cursor.execute(query)
    progressos = cursor.fetchall()
    
    cursor.close()
    conexao.close()
    return progressos


@app.post("/progressos", response_model=ProgressoLivroResponse)
def cadastrar_progresso(progresso: ProgressoLivroCreate):
    conexao = criar_conexao()
    cursor = conexao.cursor(dictionary=True)
    
    try:
        # 1. Verifica se já existe um progresso cadastrado para o mesmo usuário e e-book
        cursor.execute(
            "SELECT progresso_id FROM Progresso_Livro WHERE User_ID = %s AND EBook_ID = %s",
            (progresso.user_id, progresso.ebook_id)
        )
        existente = cursor.fetchone()
        
        if existente:
            raise HTTPException(
                status_code=400, 
                detail="Este usuário já possui um progresso registrado para este e-book."
            )

        # 2. Executa a inserção normal caso não exista duplicidade
        sql = """
            INSERT INTO Progresso_Livro (Pagina_Lidas, Atualizacao, User_ID, EBook_ID)
            VALUES (%s, %s, %s, %s)
        """
        valores = (progresso.pagina_lidas, progresso.atualizacao, progresso.user_id, progresso.ebook_id)
        
        cursor.execute(sql, valores)
        conexao.commit()
        id_progresso = cursor.lastrowid

        # Busca a porcentagem calculada pela função MySQL
        cursor.execute(
            "SELECT Progresso_Leitura_Porcent(%s, %s) as prcnt_leitura", 
            (progresso.user_id, progresso.ebook_id)
        )
        resultado = cursor.fetchone()
        prcnt_calculada = resultado["prcnt_leitura"] if resultado else 0

        return {
            "progresso_id": id_progresso,
            "prcnt_leitura": prcnt_calculada,
            **progresso.model_dump()
        }

    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=400, detail="Usuário ou E-Book inválido.")
    finally:
        cursor.close()
        conexao.close()


@app.put("/progressos/{progresso_id}", response_model=ProgressoLivroResponse)
def alterar_progresso(progresso_id: int, progresso: ProgressoLivroCreate):
    conexao = criar_conexao()
    cursor = conexao.cursor(dictionary=True)
    
    sql = """
        UPDATE Progresso_Livro
        SET Pagina_Lidas = %s, Atualizacao = %s, User_ID = %s, EBook_ID = %s
        WHERE Progresso_ID = %s
    """
    valores = (progresso.pagina_lidas, progresso.atualizacao, progresso.user_id, progresso.ebook_id, progresso_id)
    
    try:
        cursor.execute(sql, valores)
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Registro de progresso não encontrado.")
        conexao.commit()

        # Busca a porcentagem recalculada
        cursor.execute(
            "SELECT Progresso_Leitura_Porcent(%s, %s) as prcnt_leitura", 
            (progresso.user_id, progresso.ebook_id)
        )
        resultado = cursor.fetchone()
        prcnt_calculada = resultado["prcnt_leitura"] if resultado else 0

        return {
            "progresso_id": progresso_id,
            "prcnt_leitura": prcnt_calculada,
            **progresso.model_dump()
        }
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=400, detail="Erro de integridade com o usuário ou E-Book.")
    finally:
        cursor.close()
        conexao.close()

@app.delete("/progressos/{progresso_id}")
def excluir_progresso(progresso_id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = "DELETE FROM Progresso_Livro WHERE Progresso_ID = %s"
    
    try:
        cursor.execute(sql, (progresso_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Progresso não encontrado.")
        
        conexao.commit()
        return {"mensagem": "Progresso excluído com sucesso!"}
        
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(
            status_code=500, 
            detail="Não foi possível excluir o progresso devido a restrições no banco de dados."
        )
    finally:
        cursor.close()
        conexao.close()


# ==========================================
# CATÁLOGOS
# ==========================================
from fastapi import HTTPException
from mysql.connector import IntegrityError

# ======================================================
# LISTAR CATÁLOGOS
# ======================================================
@app.get("/catalogos", response_model=list[CatalogoResponse])
def listar_catalogos():
    conexao = criar_conexao()
    cursor = conexao.cursor(dictionary=True)
    
    # 1. Busca todos os catálogos
    cursor.execute("""
        SELECT ID_Catag as id_catag, Nome as nome, Descricao as descricao
        FROM Catalogo
    """)
    catalogos = cursor.fetchall()
    
    # 2. Busca os e-books vinculados a cada catálogo
    for cat in catalogos:
        cursor.execute(
            "SELECT ID_EBook FROM Catalogo_EBook WHERE ID_Catag = %s",
            (cat["id_catag"],)
        )
        ebooks = cursor.fetchall()
        cat["ebooks_ids"] = [e["ID_EBook"] for e in ebooks]
        
    cursor.close()
    conexao.close()
    return catalogos


# ======================================================
# CADASTRAR CATÁLOGO COM MÚLTIPLOS E-BOOKS
# ======================================================
@app.post("/catalogos", response_model=CatalogoResponse)
def cadastrar_catalogo(catalogo: CatalogoCreate):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    
    try:
        # Insere o catálogo
        sql_cat = "INSERT INTO Catalogo (Nome, Descricao) VALUES (%s, %s)"
        cursor.execute(sql_cat, (catalogo.nome, catalogo.descricao))
        id_catag = cursor.lastrowid
        
        # Insere os vínculos com os e-books na tabela intermediária
        if catalogo.ebooks_ids:
            sql_item = "INSERT INTO Catalogo_EBook (ID_Catag, ID_EBook) VALUES (%s, %s)"
            valores = [(id_catag, ebook_id) for ebook_id in catalogo.ebooks_ids]
            cursor.executemany(sql_item, valores)
            
        conexao.commit()
        return {"id_catag": id_catag, **catalogo.model_dump()}
        
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Um ou mais E-Books informados não existem no sistema."
        )
    finally:
        cursor.close()
        conexao.close()


# ======================================================
# EDITAR CATÁLOGO E SEUS E-BOOKS
# ======================================================
@app.put("/catalogos/{id_catag}", response_model=CatalogoResponse)
def editar_catalogo(id_catag: int, catalogo: CatalogoUpdate):
    conexao = criar_conexao()
    cursor = conexao.cursor(dictionary=True) # dictionary=True ajuda na leitura
    
    try:
        # 1. Verifica se o catálogo existe
        cursor.execute("SELECT ID_Catag FROM Catalogo WHERE ID_Catag = %s", (id_catag,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Catálogo não encontrado.")
        
        # 2. Atualiza dados básicos
        sql_cat = "UPDATE Catalogo SET Nome = %s, Descricao = %s WHERE ID_Catag = %s"
        cursor.execute(sql_cat, (catalogo.nome, catalogo.descricao, id_catag))
            
        # 3. Remove associações antigas
        cursor.execute("DELETE FROM Catalogo_EBook WHERE ID_Catag = %s", (id_catag,))
        
        # 4. Reinsere as novas associações
        if catalogo.ebooks_ids:
            sql_item = "INSERT INTO Catalogo_EBook (ID_Catag, ID_EBook) VALUES (%s, %s)"
            valores = [(id_catag, ebook_id) for ebook_id in catalogo.ebooks_ids]
            cursor.executemany(sql_item, valores)
            
        conexao.commit()
        return {"id_catag": id_catag, **catalogo.model_dump()}
        
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Um ou mais E-Books informados não existem no sistema."
        )
    finally:
        cursor.close()
        conexao.close()


@app.delete("/catalogos/{id_catag}")
def excluir_catalogo(id_catag: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()
    sql = "DELETE FROM Catalogo WHERE ID_Catag = %s"
    try:
        cursor.execute(sql, (id_catag,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Catálogo não encontrado.")
        conexao.commit()
        return {"mensagem": "Catálogo excluído com sucesso."}
    except IntegrityError:
        conexao.rollback()
        raise HTTPException(status_code=500, detail="Não foi possível excluir o catálogo.")
    finally:
        cursor.close()
        conexao.close()