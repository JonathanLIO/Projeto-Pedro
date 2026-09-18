from datetime import date
from typing import Optional
from pydantic import BaseModel, EmailStr


# ==========================================
# AUTOR
# ==========================================
class AutorCreate(BaseModel):
    nome: str


class AutorResponse(BaseModel):
    autor_id: int
    nome: str


# ==========================================
# CATEGORIA
# ==========================================
class CategoriaCreate(BaseModel):
    nome: str


class CategoriaResponse(BaseModel):
    ctego_id: int
    nome: str


# ==========================================
# USUÁRIO
# ==========================================
class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    cpf: str
    data_nasc: date


class UsuarioResponse(BaseModel):
    user_id: int
    nome: str
    email: EmailStr
    cpf: str
    data_nasc: date


# ==========================================
# BIBLIOTECÁRIO
# ==========================================
class BibliotecarioCreate(BaseModel):
    user_id: int
    matricula: str


class BibliotecarioResponse(BaseModel):
    biblio_id: int
    user_id: int
    matricula: str


# ==========================================
# E-BOOK
# ==========================================
class EBookCreate(BaseModel):
    titulo: str
    autor_id: int
    ctego_id: int
    ano: Optional[int] = None
    paginas: Optional[int] = None
    descricao: Optional[str] = None
    capa: Optional[str] = None


class EBookResponse(BaseModel):
    ebook_id: int
    titulo: str
    autor_id: int
    ctego_id: int
    ano: Optional[int] = None
    paginas: Optional[int] = None
    descricao: Optional[str] = None
    capa: Optional[str] = None


# ==========================================
# AVALIAÇÃO
# ==========================================
class AvaliacaoCreate(BaseModel):
    nota: int
    user_id: int
    ebook_id: int


class AvaliacaoResponse(BaseModel):
    avac_id: int
    nota: int
    user_id: int
    ebook_id: int


# ==========================================
# PROGRESSO DO LIVRO
# ==========================================
class ProgressoLivroCreate(BaseModel):
    prcnt_leitura: Optional[int] = 0
    atualizacao: date
    user_id: int
    ebook_id: int


class ProgressoLivroResponse(BaseModel):
    progresso_id: int
    prcnt_leitura: int
    atualizacao: date
    user_id: int
    ebook_id: int


# ==========================================
# CATÁLOGO
# ==========================================
class CatalogoCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None
    id_ebook: int


class CatalogoResponse(BaseModel):
    id_catag: int
    nome: str
    descricao: Optional[str] = None
    id_ebook: int