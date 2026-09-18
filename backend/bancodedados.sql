DROP DATABASE IF EXISTS biblioteca_digital;
CREATE DATABASE IF NOT EXISTS biblioteca_digital;
USE biblioteca_digital;

CREATE TABLE Autor (
    Autor_ID INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(255) NOT NULL
);

CREATE TABLE Categoria (
    Ctego_ID INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(255) NOT NULL
);

CREATE TABLE Usuario (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(255) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    Senha VARCHAR(255) NOT NULL,
    CPF VARCHAR(14) NOT NULL UNIQUE,
    Data_nasc DATE NOT NULL
);

CREATE TABLE Bibliotecario (
    Biblio_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL UNIQUE,
    Matricula VARCHAR(50) NOT NULL UNIQUE,
    FOREIGN KEY (User_ID) REFERENCES Usuario(User_ID) ON DELETE CASCADE
);

CREATE TABLE EBook (
    EBook_ID INT AUTO_INCREMENT PRIMARY KEY,
    Titulo VARCHAR(255) NOT NULL,
    Autor_ID INT NOT NULL,
    Ctego_ID INT NOT NULL,
    Ano INT,
    Paginas INT,
    Descricao TEXT,
    Capa VARCHAR(255),
    FOREIGN KEY (Autor_ID) REFERENCES Autor(Autor_ID) ON DELETE RESTRICT,
    FOREIGN KEY (Ctego_ID) REFERENCES Categoria(Ctego_ID) ON DELETE RESTRICT
);

CREATE TABLE Avaliacao (
    Avac_ID INT AUTO_INCREMENT PRIMARY KEY,
    Nota INT NOT NULL,
    User_ID INT NOT NULL,
    EBook_ID INT NOT NULL,
    FOREIGN KEY (User_ID) REFERENCES Usuario(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (EBook_ID) REFERENCES EBook(EBook_ID) ON DELETE CASCADE
);

CREATE TABLE Progresso_Livro (
    Progresso_ID INT AUTO_INCREMENT PRIMARY KEY,
    Pagina_Lidas INT DEFAULT 0,
    Atualizacao DATE NOT NULL,
    User_ID INT NOT NULL,
    EBook_ID INT NOT NULL,
    FOREIGN KEY (User_ID) REFERENCES Usuario(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (EBook_ID) REFERENCES EBook(EBook_ID) ON DELETE CASCADE
);

CREATE TABLE Catalogo (
    ID_Catag INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(255) NOT NULL,
    Descricao TEXT,
    ID_EBook INT NOT NULL,
    FOREIGN KEY (ID_EBook) REFERENCES EBook(EBook_ID) ON DELETE CASCADE
);

CREATE TABLE Usuario_Catalogo (
    User_ID INT NOT NULL,
    ID_Catag INT NOT NULL,
    PRIMARY KEY (User_ID, ID_Catag),
    FOREIGN KEY (User_ID) REFERENCES Usuario(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (ID_Catag) REFERENCES Catalogo(ID_Catag) ON DELETE CASCADE
);

CREATE TABLE Bibliotecario_EBook (
    Biblio_ID INT NOT NULL,
    EBook_ID INT NOT NULL,
    PRIMARY KEY (Biblio_ID, EBook_ID),
    FOREIGN KEY (Biblio_ID) REFERENCES Bibliotecario(Biblio_ID) ON DELETE CASCADE,
    FOREIGN KEY (EBook_ID) REFERENCES EBook(EBook_ID) ON DELETE CASCADE
);

-- INSERINDO DADOS NA TABELA
INSERT INTO Autor (Nome) VALUES 
('Machado de Assis'),
('George Orwell');

INSERT INTO Categoria (Nome) VALUES 
('Ficção Científica'),
('Literatura Brasileira');

INSERT INTO Usuario (Nome, Email, Senha, CPF, Data_nasc) VALUES 
('Carlos Eduardo', 'carlos.eduardo@email.com', 'hash_senha_456', '987.654.321-11', '1988-11-23'),
('Ana Silva', 'ana.silva@email.com', 'hash_senha_123', '123.456.789-00', '1995-04-12');

INSERT INTO Bibliotecario (User_ID, Matricula) VALUES 
(1, 'BIB-2024-001'),
(2, 'BIB-2024-002');

INSERT INTO EBook (Titulo, Autor_ID, Ctego_ID, Ano, Paginas, Descricao, Capa) VALUES 
('Dom Casmurro', 1, 2, 1899, 256, 'Romance clássico sobre a dúvida da traição de Capitu.', '/capas/dom_casmurro.jpg'),
('1984', 2, 1, 1949, 328, 'Distopia sobre um regime totalitário e vigilância constante.', '/capas/1984.jpg'),
('A Revolução dos Bichos', 2, 1, 1945, 152, 'Uma sátira sobre a Revolução Russa narrada por animais de uma fazenda.', '/capas/revolucao_bichos.jpg');

INSERT INTO Avaliacao (Nota, User_ID, EBook_ID) VALUES 
(5, 1, 1),
(4, 2, 2);

INSERT INTO Progresso_Livro (Atualizacao, Pagina_Lidas, User_ID, EBook_ID) VALUES 
('2024-05-10', 100, 1, 1),
('2024-05-12', 50, 2, 2);

INSERT INTO Catalogo (Nome, Descricao, ID_EBook) VALUES 
('Clássicos Imperdíveis', 'Coleção com grandes obras da literatura.', 1),
('Ficção Dystopica', 'Obras focadas em futuros distópicos.', 2);

INSERT INTO Usuario_Catalogo (User_ID, ID_Catag) VALUES 
(1, 1),
(2, 2);

INSERT INTO Bibliotecario_EBook (Biblio_ID, EBook_ID) VALUES 
(1, 1),
(2, 2);

-- PROCEDURES
DELIMITER //

CREATE PROCEDURE sp_BuscarEBookPorTitulo(IN p_Titulo VARCHAR(255))
BEGIN
    SELECT 
        e.EBook_ID, 
        e.Titulo, 
        a.Nome AS Autor, 
        c.Nome AS Categoria, 
        e.Ano
    FROM EBook e
    INNER JOIN Autor a ON e.Autor_ID = a.Autor_ID
    INNER JOIN Categoria c ON e.Ctego_ID = c.Ctego_ID
    WHERE e.Titulo LIKE CONCAT('%', p_Titulo, '%');
END //

CREATE PROCEDURE sp_InserirEBook(
    IN p_Titulo VARCHAR(255),
    IN p_Autor_ID INT,
    IN p_Ctego_ID INT,
    IN p_Ano INT,
    IN p_Paginas INT,
    IN p_Descricao TEXT,
    IN p_Capa VARCHAR(255)
)
BEGIN
    INSERT INTO EBook (Titulo, Autor_ID, Ctego_ID, Ano, Paginas, Descricao, Capa)
    VALUES (p_Titulo, p_Autor_ID, p_Ctego_ID, p_Ano, p_Paginas, p_Descricao, p_Capa);
END //

CREATE PROCEDURE sp_ExcluirAvaliacao(IN p_Avac_ID INT)
BEGIN
    DELETE FROM Avaliacao WHERE Avac_ID = p_Avac_ID;
END //

CREATE PROCEDURE sp_ListarEBooksPorFaixaPaginas(
    IN p_MinPaginas INT,
    IN p_MaxPaginas INT
)
BEGIN
    SELECT EBook_ID, Titulo, Paginas 
    FROM EBook
    WHERE Paginas BETWEEN p_MinPaginas AND p_MaxPaginas;
END //

CREATE PROCEDURE sp_ListarEBooksOrdenadosPorAno(IN p_Ordem VARCHAR(4))
BEGIN
    IF UPPER(p_Ordem) = 'DESC' THEN
        SELECT EBook_ID, Titulo, Ano FROM EBook ORDER BY Ano DESC;
    ELSE
        SELECT EBook_ID, Titulo, Ano FROM EBook ORDER BY Ano ASC;
    END IF;
END //

DELIMITER ;

-- TESTES DAS PROCEDURES
CALL sp_BuscarEBookPorTitulo('Dom');
CALL sp_BuscarEBookPorTitulo('1984');
CALL sp_BuscarEBookPorTitulo('Revolução');

CALL sp_InserirEBook('O Alienista', 1, 2, 1882, 112, 'Conto clássico sobre a loucura e a razão.', '/capas/alienista.jpg');
CALL sp_InserirEBook('Admirável Mundo Novo', 2, 1, 1932, 312, 'Distopia sobre uma sociedade condicionada.', '/capas/admiravel.jpg');
CALL sp_InserirEBook('Memórias Póstumas de Brás Cubas', 1, 2, 1881, 208, 'Romance narrado por um defunto autor.', '/capas/bras_cubas.jpg');

CALL sp_ExcluirAvaliacao(2);
CALL sp_BuscarEBookPorTitulo('LivroInexistenteXYZ');
CALL sp_BuscarEBookPorTitulo('dOm cAsMuRrO');
CALL sp_ListarEBooksOrdenadosPorAno('desc');

CALL sp_BuscarEBookPorTitulo('1984');
CALL sp_InserirEBook('Fahrenheit 451', 2, 1, 1953, 256, 'Sociedade onde livros são proibidos.', '/capas/f451.jpg');
CALL sp_ExcluirAvaliacao(1);
CALL sp_ListarEBooksPorFaixaPaginas(100, 300);
CALL sp_ListarEBooksOrdenadosPorAno('ASC');

-- FUNÇÕES
DELIMITER //

-- 1. Porcentagem do Progresso de Leitura (Corrigida)
DROP FUNCTION IF EXISTS Progresso_Leitura_Porcent //
CREATE FUNCTION Progresso_Leitura_Porcent(idAluno INT, idLivro INT)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE qtd_pagina_total INT DEFAULT 0;
    DECLARE paginas_lidas INT DEFAULT 0;
    DECLARE prcnt_calculado INT DEFAULT 0;
    
    SELECT Paginas INTO qtd_pagina_total 
    FROM EBook 
    WHERE EBook_ID = idLivro;
    
    SELECT Pagina_Lidas INTO paginas_lidas 
    FROM Progresso_Livro 
    WHERE EBook_ID = idLivro AND User_ID = idAluno;
    
    IF qtd_pagina_total > 0 AND paginas_lidas IS NOT NULL THEN
        SET prcnt_calculado = ROUND((paginas_lidas / qtd_pagina_total) * 100);
        IF prcnt_calculado > 100 THEN
            SET prcnt_calculado = 100;
        END IF;
        RETURN prcnt_calculado;
    ELSE
        RETURN 0;
    END IF;
END //

-- 2. Média de Avaliação do Livro
DROP FUNCTION IF EXISTS Media_Avaliacao //
CREATE FUNCTION Media_Avaliacao(idLivro INT)
RETURNS DECIMAL(3,2)
READS SQL DATA
BEGIN   
    DECLARE v_media DECIMAL(3,2) DEFAULT 0.00;
    
    SELECT IFNULL(AVG(Nota), 0) INTO v_media 
    FROM Avaliacao 
    WHERE EBook_ID = idLivro;
    
    RETURN v_media;
END // 

-- 3. Tempo Estimado de Leitura (em dias)
DROP FUNCTION IF EXISTS estim_tempo_leitura //
CREATE FUNCTION estim_tempo_leitura(idLivro INT)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE qtd_pagina_total INT DEFAULT 0;
    DECLARE dias_lendo INT DEFAULT 0;
    
    SELECT Paginas INTO qtd_pagina_total 
    FROM EBook 
    WHERE EBook_ID = idLivro;
    
    SET dias_lendo = CEIL(qtd_pagina_total / 20);
    
    RETURN dias_lendo;
END //

-- 4. Estado de Leitura
DROP FUNCTION IF EXISTS estado_leitura //
CREATE FUNCTION estado_leitura(idAluno INT, idLivro INT)
RETURNS VARCHAR(25)
READS SQL DATA
BEGIN
    DECLARE registro_existe INT DEFAULT 0;
    DECLARE porcentagem INT DEFAULT 0;
    DECLARE status_resultado VARCHAR(25);

    SELECT COUNT(*) INTO registro_existe 
    FROM Progresso_Livro 
    WHERE User_ID = idAluno AND EBook_ID = idLivro;

    IF registro_existe = 0 THEN
        SET status_resultado = 'Não iniciou';
    ELSE
        SET porcentagem = Progresso_Leitura_Porcent(idAluno, idLivro);
        
        IF porcentagem >= 100 THEN
            SET status_resultado = 'Leu';
        ELSE
            SET status_resultado = 'Lendo';
        END IF;
    END IF;

    RETURN status_resultado;
END //

-- 5. Total de livros lidos pelo usuário (Corrigida)
DROP FUNCTION IF EXISTS total_livros_lidos_usuario //
CREATE FUNCTION total_livros_lidos_usuario(idAluno INT)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE total_lidos INT DEFAULT 0;
    
    SELECT COUNT(*) INTO total_lidos
    FROM Progresso_Livro p
    INNER JOIN EBook e ON p.EBook_ID = e.EBook_ID
    WHERE p.User_ID = idAluno AND p.Pagina_Lidas >= e.Paginas;
    
    RETURN total_lidos;
END //

DELIMITER ;

-- TESTES DAS FUNÇÕES
SELECT Progresso_Leitura_Porcent(1, 1) AS Porcentagem_Lida;
SELECT Media_Avaliacao(1) AS Media_Nota_Livro;
SELECT estim_tempo_leitura(2) AS Dias_Estimados;
SELECT estado_leitura(1, 1) AS Status_Leitura;

SELECT 
    EBook_ID,
    Titulo,
    Media_Avaliacao(EBook_ID) AS Nota_Media,
    estim_tempo_leitura(EBook_ID) AS Dias_Para_Ler
FROM EBook;

SELECT total_livros_lidos_usuario(1) AS Total_Livros_Concluidos;

SELECT 
    User_ID,
    Nome,
    Email,
    total_livros_lidos_usuario(User_ID) AS Qtd_Livros_Lidos
FROM Usuario;