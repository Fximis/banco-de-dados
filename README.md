[] Baixar MySQL workbench (Ver qual mais dependência ou programas precisa)
[] Resolver lista de exercicio

### Terça feira O DDL e DML do dia 26, fazendo uma 'venda completa'

<img width="500" height="500" alt="image" src="https://github.com/user-attachments/assets/e9c04f97-4687-485e-a380-a5bacb55c6b6" />

02-09 

-- ======================================================
-- AULA MYSQL - ECOMMERCE
-- Tema: INSERT unico, INSERT multiplo, SELECT com funcoes
-- ======================================================

-- LIMPEZA
DROP DATABASE IF EXISTS ECOMMERCE;
CREATE DATABASE ECOMMERCE;
USE ECOMMERCE;

-- ======================================================
-- 1. CREATE TABLE - BASE DO ALUNO
-- ======================================================
CREATE TABLE CATEGORIA(
idcategoria int AUTO_INCREMENT PRIMARY KEY,
nome varchar(30) NOT NULL);

CREATE TABLE PRODUTO(
idproduto       int NOT NULL,
nome            varchar(40) NOT NULL,
preco_unitario  decimal(10,2),
estoque         int,
categoria_id    int);

CREATE TABLE CLIENTE(
idcliente int NOT NULL,
nome      varchar(30) NOT NULL,
cpf       varchar(12),
email     varchar(60));

CREATE TABLE PEDIDO(
idpedido int AUTO_INCREMENT PRIMARY KEY,
cliente_id int,
data_pedido date,
total_pedido decimal(10,2));

CREATE TABLE ITEMPEDIDO(
pedido_id int,
produto_id int,
quantidade int,
preco_unitario decimal(10,2));

-- ======================================================
-- 2. ALTER TABLE - CONSTRAINTS
-- ======================================================
ALTER TABLE PRODUTO ADD CONSTRAINT produto_pk PRIMARY KEY (idproduto);
ALTER TABLE PRODUTO ADD CONSTRAINT produto_preco_unitario_ck CHECK (preco_unitario > 0);
ALTER TABLE PRODUTO ADD CONSTRAINT produto_estoque_ck CHECK (estoque >=0);
ALTER TABLE PRODUTO ADD CONSTRAINT categoria_produto_fk FOREIGN KEY (categoria_id) REFERENCES CATEGORIA(idcategoria);

ALTER TABLE CLIENTE ADD CONSTRAINT cliente_pk PRIMARY KEY (idcliente);
ALTER TABLE CLIENTE ADD CONSTRAINT cliente_cpf_uq UNIQUE (cpf);
ALTER TABLE CLIENTE ADD CONSTRAINT cliente_email_uq UNIQUE (email);
ALTER TABLE CLIENTE ADD status varchar(10) DEFAULT 'Ativo';
ALTER TABLE CLIENTE ADD CONSTRAINT cliente_status_ck CHECK (status IN ('Ativo','Inativo'));

ALTER TABLE PEDIDO ADD CONSTRAINT cliente_pedido_fk FOREIGN KEY (cliente_id) REFERENCES CLIENTE(idcliente);

ALTER TABLE ITEMPEDIDO ADD CONSTRAINT pedido_produto_pk PRIMARY KEY (pedido_id, produto_id);
ALTER TABLE ITEMPEDIDO ADD CONSTRAINT pedido_itempedido_fk FOREIGN KEY (pedido_id) REFERENCES PEDIDO(idpedido);
ALTER TABLE ITEMPEDIDO ADD CONSTRAINT produto_itempedido_fk FOREIGN KEY (produto_id) REFERENCES PRODUTO(idproduto);
ALTER TABLE ITEMPEDIDO ADD CONSTRAINT itempedido_quantidade_ck CHECK (quantidade > 0);
ALTER TABLE ITEMPEDIDO ADD CONSTRAINT itempedido_preco_unitario_ck CHECK (preco_unitario > 0);



/*

# LISTA DE EXERCÍCIOS - AULA MYSQL ECOMMERCE
# Base: ECOMMERCE (CATEGORIA, PRODUTO, CLIENTE, PEDIDO, ITEMPEDIDO)

--------------------------------------------------------------------------------
-- INSTRUÇÕES GERAIS PARA O ALUNO
-- 1. Execute o script ECOMMERCE_aula_completa.sql
-- 2. Cada questão indica o COMANDO que deve ser usado
-- 3. Não use JOIN. Todas são resolvíveis em uma única tabela
--------------------------------------------------------------------------------

================================================================================
BLOCO 1 - INSERT (Comando: INSERT INTO)
================================================================================

Q1 - INSERT ÚNICO com DEFAULT
Enunciado: Insira um novo cliente com id 10, nome 'Lucas Mendes', cpf '12312312312', email 'lucas@email.com'. Não informe o status, deixe o MySQL usar o DEFAULT 'Ativo'.
Comando esperado: INSERT INTO com colunas específicas

Q2 - INSERT ÚNICO validando CHECK
Enunciado: Tente inserir um produto id 100, nome 'Produto Teste', preco -50, estoque 10, categoria 1. O que acontece? Por que?
Comando esperado: INSERT que falha no CHECK produto_preco_unitario_ck

Q3 - INSERT MÚLTIPLO (BULK)
Enunciado: Em UM único comando, insira 3 novas categorias: 'Smartphones', 'Smartwatches', 'Tablets'.
Comando esperado: INSERT com múltiplos VALUES separados por vírgula

Q4 - INSERT MÚLTIPLO no ITEMPEDIDO
Enunciado: O pedido 3 já existe. Em um único comando, insira 2 itens nele: produto 1 quantidade 3 preço 149.90 e produto 6 quantidade 1 preço 199.90.
Comando esperado: INSERT bulk em tabela com PK composta

================================================================================
BLOCO 2 - SELECT BÁSICO (Comando: SELECT, WHERE, ORDER BY)
================================================================================

Q5 - SELECT com filtro
Enunciado: Liste nome e preco_unitario de todos os produtos com estoque maior que 20.



Q6 - SELECT com ORDER BY
Enunciado: Liste todos os clientes ordenados por nome em ordem alfabética decrescente (Z-A).

================================================================================
BLOCO 3 - FUNÇÕES DE STRING (Comandos: UPPER, LOWER, CONCAT, SUBSTRING, CHAR_LENGTH, LIKE)
================================================================================

Q7 - UPPER e LOWER
Enunciado: Liste todos os clientes mostrando o nome em MAIÚSCULO e o email em minúsculo.

Q8 - CONCAT e CONCAT_WS
Enunciado: Crie uma coluna 'ficha' no formato: "ID - Nome <email>" . Ex: "1 - Ana Silva <ana@email.com>"


Q9 - SUBSTRING, LEFT, RIGHT
Enunciado: Mostre de cada cliente: as 3 primeiras letras do nome (LEFT) e os 4 últimos dígitos do CPF (RIGHT).

Q10 - CHAR_LENGTH e LENGTH
Enunciado: Mostre o nome do cliente e quantos caracteres ele tem. Use CHAR_LENGTH para contar corretamente acentos.

Q11 - LIKE, REPLACE e TRIM
Enunciado: Liste produtos cujo nome contém 'Gamer'. Na mesma query, crie uma coluna trocando 'Gamer' por 'PRO'.

Q12 - LPAD e RPAD
Enunciado: Liste idproduto formatado com 5 dígitos completados com zero à esquerda. Ex: 1 vira 00001. Use LPAD.

================================================================================
BLOCO 4 - FUNÇÕES DE DATA (Comandos: YEAR, MONTH, DATE_FORMAT, DATEDIFF, DATE_ADD, CURDATE)
================================================================================

Q13 - YEAR, MONTH, DAY
Enunciado: Liste todos os pedidos mostrando o ano, mês e dia separados da data_pedido.

Q14 - DATE_FORMAT (formato BR)
Enunciado: Liste os pedidos com data no formato brasileiro DD/MM/AAAA. Use DATE_FORMAT.

Q15 - DATEDIFF e CURDATE
Enunciado: Calcule há quantos dias cada pedido foi feito até hoje.

Q16 - DATE_ADD
Enunciado: Considere que o prazo de entrega são 7 dias após a data_pedido. Mostre a data prevista de entrega.

================================================================================
BLOCO 5 - FUNÇÕES NUMÉRICAS (Comandos: ROUND, CEIL, FLOOR, FORMAT, MOD, COUNT, SUM, AVG)
================================================================================

Q17 - ROUND, CEIL, FLOOR
Enunciado: Mostre o preço de cada produto, seu piso (FLOOR), seu teto (CEIL) e arredondado sem casas decimais (ROUND).

Q18 - FORMAT (formato BR)
Enunciado: Liste produtos com preço no formato brasileiro com R$ e vírgula. Use FORMAT ou CONCAT + FORMAT.

Q19 - MOD (resto da divisão)
Enunciado: Liste os produtos separando os de ID par e ímpar. Use MOD(idproduto, 2).

================================================================================
BLOCO 6 - TRATAMENTO DE NULO E CONDICIONAL (Comandos: IFNULL, COALESCE, IF, CASE WHEN)
================================================================================

Q20 - IFNULL e COALESCE
Enunciado: Alguns clientes podem não ter email. Liste nome e email, mas se email for nulo mostre 'sem email'. Use IFNULL.

Q21 - IF() ternário
Enunciado: Liste produtos com uma coluna 'situacao_estoque': se estoque > 10 mostre 'OK', senão 'REPOR'.

Q22 - CASE WHEN
Enunciado: Classifique produtos por preço: <200 = 'Barato', 200 a 800 = 'Médio', >800 = 'Premium'. Use CASE WHEN.

================================================================================
BLOCO 7 - AND e OR (Comandos: AND, OR, parênteses)
================================================================================

Q23 - AND
Enunciado: Liste produtos com preço maior que 200 E estoque maior ou igual a 10.

Q24 - OR
Enunciado: Liste clientes que estão com status 'Inativo' OU tem id 1.

Q25 - AND + OR com parênteses
Enunciado: Liste produtos que são da categoria 1 OU 2, E que custam menos que 500. Use parênteses obrigatoriamente.

================================================================================
BLOCO 8 - IN e NOT IN (Comandos: IN, NOT IN, BETWEEN)
================================================================================

Q26 - IN
Enunciado: Liste clientes cujo id está em (1,2,4). Substitua o uso de OR por IN.

Q27 - NOT IN
Enunciado: Liste todos os produtos EXCETO os de id 1 e 2.

Q28 - BETWEEN + IN combinados
Enunciado: Liste produtos com preço ENTRE 100 E 1000, E cuja categoria está IN (1,2,4).

Q29 - DESAFIO FINAL
Enunciado: Na tabela PRODUTO, crie um relatório com: codigo formatado LPAD 4 zeros, nome em MAIUSCULO, preco BR com FORMAT, estoque, situacao com IF (OK se >10 senão REPOR), e classe de preço com CASE WHEN. Filtre apenas produtos com categoria IN (1,2) e preco BETWEEN 100 AND 2000.


*/
