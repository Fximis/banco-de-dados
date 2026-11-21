# Lista Completa `ECOMMERCE` — DDL, Carga de Dados e 29 Questões Comentadas

> **Origem (Requisito R4):** Conteúdo originalmente presente no `README.md` raiz do repositório (aula `02-09`, diagrama ER + DDL + 29 questões de `INSERT`, `SELECT` e funções), realocado para a frente MySQL e unificado com os `INSERT`s e a tabela `VENDEDOR` da aula `Aula 26-08 DDL` (08/09 e 15/09).
>
> **Apoio teórico:** Consulte [`../anotacoes/03-dml-crud-e-transacoes.md`](../anotacoes/03-dml-crud-e-transacoes.md), [`../anotacoes/04-dql-filtros-e-funcoes.md`](../anotacoes/04-dql-filtros-e-funcoes.md), [`../anotacoes/05-agregacao-groupby-e-window-functions.md`](../anotacoes/05-agregacao-groupby-e-window-functions.md) e [`../anotacoes/06-joins-subqueries-e-ctes.md`](../anotacoes/06-joins-subqueries-e-ctes.md).

---

## 1. Diagrama Entidade-Relacionamento (ER)

<img width="900" height="900" alt="image" src="https://github.com/user-attachments/assets/e9c04f97-4687-485e-a380-a5bacb55c6b6" />

> **Observação de evolução do schema:** O diagrama original acima representa as 5 tabelas iniciais (`CATEGORIA`, `PRODUTO`, `CLIENTE`, `PEDIDO`, `ITEMPEDIDO`). Na aula seguinte (15/09), foi adicionada a 6ª tabela **`VENDEDOR`** com auto-relacionamento (`gerente_id -> idvendedor`) e a coluna `PEDIDO.vendedor_id`. Ambas as etapas estão unificadas no script canônico abaixo.

---

## 2. Script Canônico Unificado (`ECOMMERCE` — DDL + Carga Inicial)

### Decisões de Padronização do Schema
1. **Case-sensitivity (`lower_case_table_names=0`):** Nomes de tabelas sempre em **MAIÚSCULAS** (`CATEGORIA`, `PRODUTO`, `CLIENTE`, `VENDEDOR`, `PEDIDO`, `ITEMPEDIDO`) e colunas em **minúsculas**, evitando erro `1146` em ambientes Linux/Docker.
2. **Tamanho de `cpf`:** Atualizado de `VARCHAR(12)` (do script original de aula) para **`VARCHAR(14)`**, permitindo armazenar tanto CPF apenas com 11 dígitos (`'12345678901'`) quanto CPF com máscara (`'123.456.789-01'`). *(Se o sistema padronizar sempre 11 dígitos numéricos sem máscara, `CHAR(11)` é ainda mais compacto.)*
3. **Cliente 6 (`Fernanda Costa`, `email = NULL`):** Adicionado à carga base para tornar a questão **Q20 (`IFNULL`/`COALESCE`)** e a armadilha de **`Q8` (`CONCAT` com `NULL`)** testáveis na prática.
4. **Reconciliação de `total_pedido`:** No script original da aula `08/09`, o Pedido 1 foi inserido com `total_pedido = 299.80` (enquanto seus itens `149.90 + 350.00` somam `499.90`) e o Pedido 4 com `5499.80` (enquanto seus itens `4500.00 + 199.90 + 2*149.90` somam `4999.70`). Nesta base canônica, os totais foram reconciliados para **`499.90`** e **`4999.70`** para manter consistência matemática entre `PEDIDO` e `ITEMPEDIDO`.

```sql
-- ============================================================================
-- BASE CANÔNICA UNIFICADA: ECOMMERCE (MySQL 8.x)
-- Compatível com: aulas 08/09 e 15/09 (inclui VENDEDOR) + 29 exercícios (Q1..Q29)
-- ============================================================================

DROP DATABASE IF EXISTS ECOMMERCE;
CREATE DATABASE ECOMMERCE
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE ECOMMERCE;

-- 1. CRIAÇÃO DAS TABELAS
CREATE TABLE CATEGORIA (
    idcategoria INT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(30) NOT NULL
);

CREATE TABLE PRODUTO (
    idproduto      INT NOT NULL,
    nome           VARCHAR(40) NOT NULL,
    preco_unitario DECIMAL(10,2),
    estoque        INT,
    categoria_id   INT
);

CREATE TABLE CLIENTE (
    idcliente INT NOT NULL,
    nome      VARCHAR(30) NOT NULL,
    cpf       VARCHAR(14), -- suporta 11 dígitos ou '000.000.000-00' (evoluído de VARCHAR(12))
    email     VARCHAR(60)
);

CREATE TABLE VENDEDOR (
    idvendedor INT NOT NULL,
    nome       VARCHAR(30) NOT NULL,
    gerente_id INT
);

CREATE TABLE PEDIDO (
    idpedido     INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id   INT,
    vendedor_id  INT,
    data_pedido  DATE,
    total_pedido DECIMAL(10,2)
);

CREATE TABLE ITEMPEDIDO (
    pedido_id      INT,
    produto_id     INT,
    quantidade     INT,
    preco_unitario DECIMAL(10,2)
);

-- 2. CONSTRAINTS (PK, UNIQUE, CHECK, FK)
ALTER TABLE PRODUTO ADD CONSTRAINT produto_pk PRIMARY KEY (idproduto);
ALTER TABLE PRODUTO ADD CONSTRAINT produto_preco_unitario_ck CHECK (preco_unitario > 0);
ALTER TABLE PRODUTO ADD CONSTRAINT produto_estoque_ck CHECK (estoque >= 0);
ALTER TABLE PRODUTO ADD CONSTRAINT categoria_produto_fk
    FOREIGN KEY (categoria_id) REFERENCES CATEGORIA(idcategoria);

ALTER TABLE CLIENTE ADD CONSTRAINT cliente_pk PRIMARY KEY (idcliente);
ALTER TABLE CLIENTE ADD CONSTRAINT cliente_cpf_uq UNIQUE (cpf);
ALTER TABLE CLIENTE ADD CONSTRAINT cliente_email_uq UNIQUE (email);
ALTER TABLE CLIENTE ADD status VARCHAR(10) DEFAULT 'Ativo';
ALTER TABLE CLIENTE ADD CONSTRAINT cliente_status_ck CHECK (status IN ('Ativo', 'Inativo'));

ALTER TABLE VENDEDOR ADD CONSTRAINT vendedor_pk PRIMARY KEY (idvendedor);
ALTER TABLE VENDEDOR ADD CONSTRAINT gerente_vendedor_fk
    FOREIGN KEY (gerente_id) REFERENCES VENDEDOR(idvendedor);

ALTER TABLE PEDIDO ADD CONSTRAINT cliente_pedido_fk
    FOREIGN KEY (cliente_id) REFERENCES CLIENTE(idcliente);
ALTER TABLE PEDIDO ADD CONSTRAINT vendedor_pedido_fk
    FOREIGN KEY (vendedor_id) REFERENCES VENDEDOR(idvendedor);

ALTER TABLE ITEMPEDIDO ADD CONSTRAINT pedido_produto_pk PRIMARY KEY (pedido_id, produto_id);
ALTER TABLE ITEMPEDIDO ADD CONSTRAINT pedido_itempedido_fk
    FOREIGN KEY (pedido_id) REFERENCES PEDIDO(idpedido);
ALTER TABLE ITEMPEDIDO ADD CONSTRAINT produto_itempedido_fk
    FOREIGN KEY (produto_id) REFERENCES PRODUTO(idproduto);
ALTER TABLE ITEMPEDIDO ADD CONSTRAINT itempedido_quantidade_ck CHECK (quantidade > 0);
ALTER TABLE ITEMPEDIDO ADD CONSTRAINT itempedido_preco_unitario_ck CHECK (preco_unitario > 0);

-- 3. CARGA INICIAL (SEED)
INSERT INTO CATEGORIA (nome) VALUES
    ('Eletronicos'),
    ('Perifericos'),
    ('Hardware'),
    ('Cadeiras Gamer'),
    ('Notebooks');

INSERT INTO CLIENTE (idcliente, nome, cpf, email, status) VALUES
    (1, 'Ana Silva',      '12345678901', 'ana@email.com',        'Ativo'),
    (2, 'Carlos Souza',   '98765432100', 'carlos@email.com',     'Ativo'),
    (3, 'Beatriz Lima',   '11122233344', 'bia.lima@email.com',   'Inativo'),
    (4, 'Joao Paulo',     '55566677788', 'joao.paulo@email.com', 'Ativo'),
    (5, 'Maria Oliveira', '99988877766', 'maria@email.com',      'Ativo'),
    (6, 'Fernanda Costa', '44455566677', NULL,                   'Ativo');

INSERT INTO PRODUTO (idproduto, nome, preco_unitario, estoque, categoria_id) VALUES
    (1, 'Mouse Gamer RGB',   149.90, 50, 1),
    (2, 'Teclado Mecanico',  350.00, 30, 2),
    (3, 'Monitor 27 144Hz', 1299.90, 15, 1),
    (4, 'Cadeira Gamer',     899.00,  8, 4),
    (5, 'Notebook i7',      4500.00,  5, 5),
    (6, 'Headset Gamer',     199.90, 25, 2);

-- Ordem topológica para respeitar a auto-FK gerente_id -> idvendedor
INSERT INTO VENDEDOR (idvendedor, nome, gerente_id) VALUES
    (1, 'Roberto Diretor',   NULL),
    (2, 'Fernanda Gerente',  1),
    (5, 'Marcos Gerente',    1),
    (3, 'Carlos Vendedor',   2),
    (4, 'Juliana Vendedor',  2),
    (6, 'Patricia Vendedor', 5);

-- Nota: valores originais da aula 08/09 eram 299.80 (Pedido 1) e 5499.80 (Pedido 4);
-- aqui estão reconciliados com a soma exata de ITEMPEDIDO (499.90 e 4999.70).
INSERT INTO PEDIDO (cliente_id, vendedor_id, data_pedido, total_pedido) VALUES
    (1, 3, '2026-08-15',  499.90),
    (2, 3, '2026-08-20', 2198.90),
    (1, 4, '2026-08-22',  899.00),
    (4, 6, CURDATE(),    4999.70);

INSERT INTO ITEMPEDIDO (pedido_id, produto_id, quantidade, preco_unitario) VALUES
    (1, 1, 1,  149.90),
    (1, 2, 1,  350.00),
    (2, 3, 1, 1299.90),
    (2, 4, 1,  899.00),
    (3, 4, 1,  899.00),
    (4, 5, 1, 4500.00),
    (4, 6, 1,  199.90),
    (4, 1, 2,  149.90);
```

---

## 3. Lista de Exercícios (`Q1` a `Q29`) + Gabarito Comentado

> **Instruções gerais:** Execute primeiro o script da Seção 2. Todas as questões `Q1` a `Q29` são resolvíveis em uma única tabela (sem `JOIN`).

### BLOCO 1 — `INSERT` (`INSERT INTO`)

#### Q1 — `INSERT` ÚNICO com `DEFAULT`
**Enunciado:** Insira um novo cliente com `id` `10`, nome `'Lucas Mendes'`, cpf `'12312312312'`, email `'lucas@email.com'`. Não informe o `status`, deixe o MySQL usar o `DEFAULT 'Ativo'`.

```sql
INSERT INTO CLIENTE (idcliente, nome, cpf, email)
VALUES (10, 'Lucas Mendes', '12312312312', 'lucas@email.com');
```
> **Explicação:** Ao omitir `status` na lista explícita de colunas, o MySQL preenche automaticamente `'Ativo'`.

#### Q2 — `INSERT` ÚNICO validando `CHECK`
**Enunciado:** Tente inserir um produto `id` `100`, nome `'Produto Teste'`, preço `-50`, estoque `10`, categoria `1`. O que acontece? Por quê?

```sql
INSERT INTO PRODUTO (idproduto, nome, preco_unitario, estoque, categoria_id)
VALUES (100, 'Produto Teste', -50, 10, 1);
```
> **O que acontece:** A execução **falha propositalmente** com:
> `ERROR 3819 (HY000): Check constraint 'produto_preco_unitario_ck' is violated.`
> **Por quê:** O valor `-50` viola a regra `CHECK (preco_unitario > 0)` definida na tabela `PRODUTO`.

#### Q3 — `INSERT` MÚLTIPLO (Bulk)
**Enunciado:** Em UM único comando, insira 3 novas categorias: `'Smartphones'`, `'Smartwatches'`, `'Tablets'`.

```sql
INSERT INTO CATEGORIA (nome) VALUES
    ('Smartphones'),
    ('Smartwatches'),
    ('Tablets');
```
> **Explicação:** Como `idcategoria` possui `AUTO_INCREMENT`, os IDs `6`, `7` e `8` são gerados automaticamente em sequência após as 5 categorias iniciais.

#### Q4 — `INSERT` MÚLTIPLO no `ITEMPEDIDO`
**Enunciado:** O pedido `3` já existe. Em um único comando, insira 2 itens nele: produto `1` quantidade `3` preço `149.90` e produto `6` quantidade `1` preço `199.90`.

```sql
INSERT INTO ITEMPEDIDO (pedido_id, produto_id, quantidade, preco_unitario) VALUES
    (3, 1, 3, 149.90),
    (3, 6, 1, 199.90);
```
> **Notas importantes sobre Q4:**
> 1. No `README.md` original faltavam os `INSERT`s iniciais — sem a carga da Seção 2, o `pedido 3` e os produtos `1` e `6` não existiriam (`ERROR 1452` de FK).
> 2. O pedido `3` possuía apenas o produto `4` na carga inicial, portanto os pares `(3, 1)` e `(3, 6)` não conflitam com a chave primária composta `(pedido_id, produto_id)`.
> 3. Inserir linhas em `ITEMPEDIDO` **não** recalcula automaticamente `PEDIDO.total_pedido` (para manter sincronizado em produção, seria necessário um `UPDATE` na mesma transação ou uma `TRIGGER`).

---

### BLOCO 2 — `SELECT` Básico (`SELECT`, `WHERE`, `ORDER BY`)

#### Q5 — `SELECT` com filtro
**Enunciado:** Liste `nome` e `preco_unitario` de todos os produtos com estoque maior que `20`.

```sql
SELECT nome, preco_unitario
FROM PRODUTO
WHERE estoque > 20;
```
> **Resultado na carga inicial:** `Mouse Gamer RGB` (`149.90`), `Teclado Mecanico` (`350.00`), `Headset Gamer` (`199.90`).

#### Q6 — `SELECT` com `ORDER BY`
**Enunciado:** Liste todos os clientes ordenados por nome em ordem alfabética decrescente (`Z-A`).

```sql
SELECT *
FROM CLIENTE
ORDER BY nome DESC;
```

---

### BLOCO 3 — Funções de String (`UPPER`, `LOWER`, `CONCAT`, `SUBSTRING`, `CHAR_LENGTH`, `LIKE`)

#### Q7 — `UPPER` e `LOWER`
**Enunciado:** Liste todos os clientes mostrando o nome em MAIÚSCULO e o email em minúsculo.

```sql
SELECT
    UPPER(nome) AS nome_maiusculo,
    LOWER(email) AS email_minusculo
FROM CLIENTE;
```
> **Obs.:** Para o Cliente 6 (`Fernanda Costa`), `LOWER(NULL)` continua retornando `NULL`.

#### Q8 — `CONCAT` e `CONCAT_WS`
**Enunciado:** Crie uma coluna `'ficha'` no formato: `"ID - Nome <email>"`. Ex: `"1 - Ana Silva <ana@email.com>"`.

```sql
-- Forma recomendada (protegida contra email NULL usando COALESCE):
SELECT CONCAT(idcliente, ' - ', nome, ' <', COALESCE(email, 'sem email'), '>') AS ficha
FROM CLIENTE;

-- Alternativa usando CONCAT_WS para o traço inicial + CONCAT para o email:
SELECT CONCAT_WS(' - ', idcliente, CONCAT(nome, ' <', COALESCE(email, 'sem email'), '>')) AS ficha
FROM CLIENTE;
```
> **Atenção na prova (Q8):**
> - No SQL, **`CONCAT(...)` retorna `NULL` se qualquer argumento for `NULL`**. Sem `COALESCE(email, 'sem email')`, a ficha de `Fernanda Costa` (Cliente 6, `email = NULL`) inteira viraria `NULL`!
> - Já `CONCAT_WS(separador, ...)` ignora argumentos `NULL`, mas aplica o **mesmo** separador entre todas as partes — por isso combinamos `COALESCE` com `CONCAT` para manter o formato exato `"ID - Nome <email>"`.

#### Q9 — `SUBSTRING`, `LEFT`, `RIGHT`
**Enunciado:** Mostre de cada cliente: as 3 primeiras letras do nome (`LEFT`) e os 4 últimos dígitos do CPF (`RIGHT`).

```sql
SELECT
    nome,
    LEFT(nome, 3) AS tres_primeiras,
    RIGHT(cpf, 4) AS ultimos_4_cpf,
    SUBSTRING(nome, 1, 3) AS via_substring
FROM CLIENTE;
```

#### Q10 — `CHAR_LENGTH` e `LENGTH`
**Enunciado:** Mostre o nome do cliente e quantos caracteres ele tem. Use `CHAR_LENGTH` para contar corretamente acentos.

```sql
SELECT
    nome,
    CHAR_LENGTH(nome) AS qtd_caracteres,
    LENGTH(nome) AS qtd_bytes
FROM CLIENTE;
```
> **Explicação:** Em `utf8mb4`, caracteres acentuados (ex.: `'João'`) consomem 2 bytes em `LENGTH()`, mas contam corretamente como 1 caractere em `CHAR_LENGTH()`.

#### Q11 — `LIKE`, `REPLACE` e `TRIM`
**Enunciado:** Liste produtos cujo nome contém `'Gamer'`. Na mesma query, crie uma coluna trocando `'Gamer'` por `'PRO'`.

```sql
SELECT
    nome,
    REPLACE(nome, 'Gamer', 'PRO') AS nome_pro,
    TRIM(nome) AS nome_limpo
FROM PRODUTO
WHERE nome LIKE '%Gamer%';
```
> **Atenção na prova (Q11):**
> 1. No collation padrão do MySQL 8 (`utf8mb4_0900_ai_ci`), **`LIKE` é case-insensitive** (`'%gamer%'` encontra `'Gamer'`), **mas `REPLACE()` é SEMPRE case-sensitive!** Se você escrever `REPLACE(nome, 'gamer', 'PRO')` em minúsculo, a substituição não acontece.
> 2. O título do bloco menciona `TRIM`: a função remove espaços em branco extras do início e do fim da string (`TRIM('  Mouse  ')` → `'Mouse'`), útil na limpeza de cadastros.

#### Q12 — `LPAD` e `RPAD`
**Enunciado:** Liste `idproduto` formatado com 5 dígitos completados com zero à esquerda. Ex: `1` vira `00001`. Use `LPAD`.

```sql
SELECT
    idproduto,
    LPAD(idproduto, 5, '0') AS codigo_formatado,
    nome
FROM PRODUTO;
```
> **Complemento:** `RPAD(idproduto, 5, '0')` preenche à direita (`10000`).

---

### BLOCO 4 — Funções de Data (`YEAR`, `MONTH`, `DATE_FORMAT`, `DATEDIFF`, `DATE_ADD`, `CURDATE`)

#### Q13 — `YEAR`, `MONTH`, `DAY`
**Enunciado:** Liste todos os pedidos mostrando o ano, mês e dia separados da `data_pedido`.

```sql
SELECT
    idpedido,
    data_pedido,
    YEAR(data_pedido) AS ano,
    MONTH(data_pedido) AS mes,
    DAY(data_pedido) AS dia
FROM PEDIDO;
```

#### Q14 — `DATE_FORMAT` (formato BR)
**Enunciado:** Liste os pedidos com data no formato brasileiro `DD/MM/AAAA`. Use `DATE_FORMAT`.

```sql
SELECT
    idpedido,
    DATE_FORMAT(data_pedido, '%d/%m/%Y') AS data_br
FROM PEDIDO;
```
> **Pegadinha:** `%Y` maiúsculo exibe 4 dígitos (`2026`); `%y` minúsculo exibe apenas 2 (`26`).

#### Q15 — `DATEDIFF` e `CURDATE`
**Enunciado:** Calcule há quantos dias cada pedido foi feito até hoje.

```sql
SELECT
    idpedido,
    data_pedido,
    DATEDIFF(CURDATE(), data_pedido) AS dias_desde_pedido
FROM PEDIDO;
```
> **Explicação:** `DATEDIFF(data1, data2)` retorna `data1 - data2` em dias. Se inverter a ordem, o resultado fica negativo para pedidos passados.

#### Q16 — `DATE_ADD`
**Enunciado:** Considere que o prazo de entrega são 7 dias após a `data_pedido`. Mostre a data prevista de entrega.

```sql
SELECT
    idpedido,
    data_pedido,
    DATE_ADD(data_pedido, INTERVAL 7 DAY) AS previsao_entrega
FROM PEDIDO;
```

---

### BLOCO 5 — Funções Numéricas (`ROUND`, `CEIL`, `FLOOR`, `FORMAT`, `MOD`, `COUNT`, `SUM`, `AVG`)

> **Lacuna identificada no material original:** O título do Bloco 5 original lista `COUNT, SUM, AVG`, porém as questões `Q17` a `Q19` não utilizavam nenhuma função de agregação. Veja logo após a Q19 a subseção complementar cobrindo `COUNT`, `SUM` e `AVG`.

#### Q17 — `ROUND`, `CEIL`, `FLOOR`
**Enunciado:** Mostre o preço de cada produto, seu piso (`FLOOR`), seu teto (`CEIL`) e arredondado sem casas decimais (`ROUND`).

```sql
SELECT
    nome,
    preco_unitario,
    FLOOR(preco_unitario) AS piso,
    CEIL(preco_unitario) AS teto,
    ROUND(preco_unitario, 0) AS arredondado
FROM PRODUTO;
```

#### Q18 — `FORMAT` (formato BR)
**Enunciado:** Liste produtos com preço no formato brasileiro com `R$` e vírgula. Use `FORMAT` ou `CONCAT + FORMAT`.

```sql
SELECT
    nome,
    CONCAT('R$ ', FORMAT(preco_unitario, 2, 'pt_BR')) AS preco_br
FROM PRODUTO;
```
> **Atenção na prova (Q18):**
> - ❌ Errado omitir o 3º argumento `'pt_BR'` (pois usa o padrão americano `'en_US'` com vírgula no milhar e ponto no decimal). ✅ Correto: informar o locale **`'pt_BR'`** em `FORMAT(preco_unitario, 2, 'pt_BR')` para usar vírgula decimal brasileira (`1299,90` / `4500,00`; no MySQL 8.x, o separador de milhar `.` em `pt_BR` segue a regra CLDR para números a partir de 5 dígitos inteiros, ex.: `12.999,90`).
> - `FORMAT()` devolve **texto (`VARCHAR`)**, não número: nunca faça `ORDER BY preco_br` nem operações matemáticas sobre o resultado formatado.

#### Q19 — `MOD` (resto da divisão)
**Enunciado:** Liste os produtos separando os de ID par e ímpar. Use `MOD(idproduto, 2)`.

```sql
SELECT
    idproduto,
    nome,
    MOD(idproduto, 2) AS resto,
    IF(MOD(idproduto, 2) = 0, 'Par', 'Ímpar') AS paridade
FROM PRODUTO
ORDER BY paridade, idproduto;
```

#### Exercícios Complementares do Bloco 5 (`COUNT`, `SUM`, `AVG`)
Para cobrir as funções anunciadas no título original do Bloco 5:

1. **Quantos produtos estão cadastrados (`COUNT`)?**
   ```sql
   SELECT COUNT(*) AS total_produtos FROM PRODUTO;
   ```
2. **Qual a quantidade total de unidades em estoque e o valor total imobilizado em estoque (`SUM`)?**
   ```sql
   SELECT
       SUM(estoque) AS total_unidades_estoque,
       SUM(preco_unitario * estoque) AS valor_total_estoque
   FROM PRODUTO;
   ```
3. **Qual o preço médio dos produtos arredondado para 2 casas decimais (`AVG` + `ROUND`)?**
   ```sql
   SELECT ROUND(AVG(preco_unitario), 2) AS preco_medio FROM PRODUTO;
   ```

---

### BLOCO 6 — Tratamento de Nulo e Condicional (`IFNULL`, `COALESCE`, `IF`, `CASE WHEN`)

#### Q20 — `IFNULL` e `COALESCE`
**Enunciado:** Alguns clientes podem não ter email. Liste nome e email, mas se email for nulo mostre `'sem email'`. Use `IFNULL`.

```sql
SELECT
    nome,
    IFNULL(email, 'sem email') AS email_ifnull,
    COALESCE(email, 'sem email') AS email_coalesce
FROM CLIENTE;
```
> **Diferença na prova:** `IFNULL(a, b)` é específico do MySQL e aceita apenas 2 argumentos. `COALESCE(a, b, c, ...)` é padrão SQL ANSI e retorna o primeiro valor não nulo entre N argumentos. Na carga inicial, `Fernanda Costa` (id 6) exibe `'sem email'`.

#### Q21 — `IF()` ternário
**Enunciado:** Liste produtos com uma coluna `'situacao_estoque'`: se estoque > 10 mostre `'OK'`, senão `'REPOR'`.

```sql
SELECT
    nome,
    estoque,
    IF(estoque > 10, 'OK', 'REPOR') AS situacao_estoque
FROM PRODUTO;
```

#### Q22 — `CASE WHEN`
**Enunciado:** Classifique produtos por preço: `< 200` = `'Barato'`, `200` a `800` = `'Médio'`, `> 800` = `'Premium'`. Use `CASE WHEN`.

```sql
SELECT
    nome,
    preco_unitario,
    CASE
        WHEN preco_unitario < 200 THEN 'Barato'
        WHEN preco_unitario <= 800 THEN 'Médio'
        ELSE 'Premium'
    END AS classe_preco
FROM PRODUTO;
```

---

### BLOCO 7 — `AND` e `OR` (`AND`, `OR`, parênteses)

#### Q23 — `AND`
**Enunciado:** Liste produtos com preço maior que `200` E estoque maior ou igual a `10`.

```sql
SELECT *
FROM PRODUTO
WHERE preco_unitario > 200
  AND estoque >= 10;
```

#### Q24 — `OR`
**Enunciado:** Liste clientes que estão com status `'Inativo'` OU têm `id` `1`.

```sql
SELECT *
FROM CLIENTE
WHERE status = 'Inativo'
   OR idcliente = 1;
```
> **Resultado na carga inicial:** `1 - Ana Silva` e `3 - Beatriz Lima`.

#### Q25 — `AND` + `OR` com parênteses
**Enunciado:** Liste produtos que são da categoria `1` OU `2`, E que custam menos que `500`. Use parênteses obrigatoriamente.

```sql
SELECT *
FROM PRODUTO
WHERE (categoria_id = 1 OR categoria_id = 2)
  AND preco_unitario < 500;
```
> **Por que os parênteses são obrigatórios?** Porque `AND` tem precedência maior que `OR`. Sem parênteses, `categoria_id = 1 OR categoria_id = 2 AND preco_unitario < 500` seria interpretado como `categoria_id = 1 OR (categoria_id = 2 AND preco_unitario < 500)`, trazendo o `Monitor 27 144Hz` (`1299.90`) indevidamente!

---

### BLOCO 8 — `IN`, `NOT IN` e `BETWEEN`

#### Q26 — `IN`
**Enunciado:** Liste clientes cujo `id` está em `(1, 2, 4)`. Substitua o uso de `OR` por `IN`.

```sql
SELECT *
FROM CLIENTE
WHERE idcliente IN (1, 2, 4);
```
> **Erro comum em aula:** ❌ Nunca omita a palavra `IN` antes da lista de valores (gera `ERROR 1064`); ✅ o correto é sempre escrever `WHERE idcliente IN (1, 2, 4)`.

#### Q27 — `NOT IN`
**Enunciado:** Liste todos os produtos EXCETO os de `id` `1` e `2`.

```sql
SELECT *
FROM PRODUTO
WHERE idproduto NOT IN (1, 2);
```
> **Armadilha clássica:** Nunca coloque `NULL` dentro de uma lista `NOT IN (...)` (ex.: vindo de uma subquery) — se houver qualquer `NULL` na lista, `NOT IN` retorna 0 linhas!

#### Q28 — `BETWEEN` + `IN` combinados
**Enunciado:** Liste produtos com preço ENTRE `100` E `1000`, E cuja categoria está `IN (1, 2, 4)`.

```sql
SELECT *
FROM PRODUTO
WHERE preco_unitario BETWEEN 100 AND 1000
  AND categoria_id IN (1, 2, 4);
```
> **Nota:** `BETWEEN 100 AND 1000` é inclusivo nas duas pontas (`>= 100 AND <= 1000`).

#### Q29 — DESAFIO FINAL
**Enunciado:** Na tabela `PRODUTO`, crie um relatório com: código formatado `LPAD` 4 zeros, nome em MAIÚSCULO, preço BR com `FORMAT`, estoque, situação com `IF` (`OK` se `> 10` senão `REPOR`), e classe de preço com `CASE WHEN`. Filtre apenas produtos com categoria `IN (1, 2)` e preço `BETWEEN 100 AND 2000`.

```sql
SELECT
    LPAD(idproduto, 4, '0') AS codigo,
    UPPER(nome) AS nome,
    CONCAT('R$ ', FORMAT(preco_unitario, 2, 'pt_BR')) AS preco_br,
    estoque,
    IF(estoque > 10, 'OK', 'REPOR') AS situacao,
    CASE
        WHEN preco_unitario < 200 THEN 'Barato'
        WHEN preco_unitario <= 800 THEN 'Médio'
        ELSE 'Premium'
    END AS classe_preco
FROM PRODUTO
WHERE categoria_id IN (1, 2)
  AND preco_unitario BETWEEN 100 AND 2000;
```
> **Resultado na carga inicial (4 linhas):** `0001 MOUSE GAMER RGB`, `0002 TECLADO MECANICO`, `0003 MONITOR 27 144HZ` e `0006 HEADSET GAMER`.

---

## 4. Exercício em Aberto da Aula 15/09 — "Total de vendas por gerente"

No final do arquivo legado `Aula 26-08 DDL` (linha 754), ficou em aberto o desafio:
> `-- Total de vendas por gerente, e nao por vendedor (exercicio)`

### Solução Padrão (Gerente Direto: `SELF JOIN` + `LEFT JOIN PEDIDO`)

Para calcular quanto cada **gerente direto** vendeu por meio de seus subordinados imediatos (incluindo gerentes cuja equipe ainda não realizou vendas diretas):

```sql
SELECT
    g.idvendedor AS id_gerente,
    g.nome AS nome_gerente,
    COUNT(p.idpedido) AS qtd_pedidos,
    COALESCE(SUM(p.total_pedido), 0.00) AS total_vendas
FROM VENDEDOR v
INNER JOIN VENDEDOR g
    ON v.gerente_id = g.idvendedor
LEFT JOIN PEDIDO p
    ON p.vendedor_id = v.idvendedor
GROUP BY g.idvendedor, g.nome
ORDER BY total_vendas DESC, g.idvendedor;
```

**Resultado obtido na base canônica (antes dos `INSERT`s de Q4):**

| `id_gerente` | `nome_gerente` | `qtd_pedidos` | `total_vendas` | Explicação |
|---|---|---|---|---|
| `5` | `Marcos Gerente` | `1` | `4999.70` | Venda direta da subordinada `Patricia Vendedor` (Pedido 4) |
| `2` | `Fernanda Gerente` | `3` | `3597.80` | Vendas de `Carlos` (`499.90 + 2198.90`) + `Juliana` (`899.00`) |
| `1` | `Roberto Diretor` | `0` | `0.00` | Seus subordinados diretos (`Fernanda` e `Marcos`) são gerentes e não têm pedidos diretos; `LEFT JOIN` preserva a linha com `0.00`! |

### Gerente Direto vs. Toda a Árvore Hierárquica (`WITH RECURSIVE`)

- A consulta acima mede **apenas subordinados diretos (1 nível)** (`v.gerente_id = g.idvendedor`). Por isso `Roberto Diretor` aparece com `0.00`, pois `Carlos`, `Juliana` e `Patricia` reportam para `Fernanda` e `Marcos`, e não diretamente para `Roberto`.
- Se a regra de negócio pedir o **total acumulado de toda a subárvore hierárquica** abaixo de cada líder (diretos + indiretos), é necessário usar uma **CTE Recursiva (`WITH RECURSIVE`)** no MySQL 8.x:

```sql
WITH RECURSIVE hierarquia AS (
    -- Âncora: cada pessoa é ancestral de si mesma (ou comece pelos subordinados diretos)
    SELECT idvendedor AS id_lider, idvendedor AS id_membro
    FROM VENDEDOR
    UNION ALL
    SELECT h.id_lider, v.idvendedor
    FROM hierarquia h
    INNER JOIN VENDEDOR v ON v.gerente_id = h.id_membro
)
SELECT
    l.idvendedor AS id_lider,
    l.nome AS nome_lider,
    COUNT(p.idpedido) AS qtd_pedidos_subarvore,
    COALESCE(SUM(p.total_pedido), 0.00) AS total_vendas_subarvore
FROM hierarquia h
INNER JOIN VENDEDOR l ON l.idvendedor = h.id_lider
LEFT JOIN PEDIDO p ON p.vendedor_id = h.id_membro
WHERE EXISTS (SELECT 1 FROM VENDEDOR sub WHERE sub.gerente_id = l.idvendedor)
GROUP BY l.idvendedor, l.nome
ORDER BY total_vendas_subarvore DESC;
```
> **Resultado da subárvore:** `Roberto Diretor` acumula **`8597.50`** (`4` pedidos de toda a empresa), `Marcos Gerente` acumula **`4999.70`** (`1` pedido) e `Fernanda Gerente` acumula **`3597.80`** (`3` pedidos).
