# 04 — DQL (Consultas), Filtros e Funções Escalares

> **Base utilizada neste guia:** Esquema canônico **`ECOMMERCE`** (MySQL 8.x).  
> Script completo de setup e lista de 29 exercícios práticos: **[`../exercicios/02-lista-ecommerce-completa.md`](../exercicios/02-lista-ecommerce-completa.md)**.

---

## 1. DQL Básica: Projeção, Aliases, Ordenação e Paginação

**DQL (*Data Query Language*)** é a parte da SQL focada em consultar dados (`SELECT`) sem modificá-los.

### 1.1 Projeção de Colunas e Aliases (`AS`)

- `SELECT *` traz todas as colunas (útil para inspeção rápida, mas **evite em produção/sistemas** para não trafegar dados desnecessários nem quebrar aplicações se colunas mudarem).
- **Atenção aos nomes exatos:** na tabela `PRODUTO`, a PK correta é ✅ `idproduto` (sem underscore); usar ❌ incorreto `SELECT ID_PRODUTO FROM PRODUTO;` gera **`ERROR 1054`**.
- **Sempre finalize instruções com `;`.**

```sql
USE ECOMMERCE;

-- Projeção específica com alias (AS é opcional, mas recomendado pela clareza)
SELECT
    idproduto AS codigo,
    nome      AS nome_produto,
    preco_unitario,
    estoque,
    (estoque * preco_unitario) AS valor_estoque
FROM PRODUTO;
```

### 1.2 Remoção de Duplicatas (`DISTINCT`)

```sql
-- Lista os IDs únicos de clientes que já realizaram ao menos um pedido
SELECT DISTINCT cliente_id
FROM PEDIDO;
```

> **Atenção:** `DISTINCT` aplica-se à **combinação inteira** das colunas projetadas após ele, e trata múltiplos valores `NULL` como iguais (retorna no máximo um `NULL`).

### 1.3 Ordenação (`ORDER BY`)

- `ASC` (crescente: A→Z, menor→maior, mais antigo→mais recente) é o **padrão** quando omitido.
- `DESC` (decrescente: Z→A, maior→menor).
- No MySQL, valores `NULL` aparecem **primeiro** no `ORDER BY ... ASC` e **por último** no `ORDER BY ... DESC`.

```sql
-- Clientes em ordem alfabética inversa (Z-A)
SELECT idcliente, nome, email
FROM CLIENTE
ORDER BY nome DESC;

-- Múltiplos critérios: primeiro por cliente crescente, depois pedido mais recente primeiro
SELECT idpedido, cliente_id, data_pedido, total_pedido
FROM PEDIDO
ORDER BY cliente_id ASC, data_pedido DESC;
```

### 1.4 Paginação (`LIMIT` e `OFFSET`)

```sql
-- Os 3 produtos mais caros (sempre use ORDER BY antes de LIMIT para resultado determinístico!)
SELECT idproduto, nome, preco_unitario
FROM PRODUTO
ORDER BY preco_unitario DESC
LIMIT 3;

-- Página 2 (pula os 2 primeiros e traz os próximos 2)
SELECT idproduto, nome, preco_unitario
FROM PRODUTO
ORDER BY idproduto ASC
LIMIT 2 OFFSET 2;
-- Sintaxe alternativa exclusiva do MySQL: LIMIT 2, 2 (LIMIT offset, quantidade — cuidado para não inverter!)
```

---

## 2. Filtros com `WHERE` e Armadilhas Clássicas

A cláusula `WHERE` filtra **linhas individuais** antes de qualquer agrupamento ou ordenação.

### 2.1 Operadores de Comparação

| Operador | Significado | Exemplo |
|---|---|---|
| `=` | Igual | `WHERE idproduto = 1` |
| `<>` ou `!=` | Diferente (`<>` é o padrão ANSI) | `WHERE status <> 'Inativo'` |
| `>`, `>=`, `<`, `<=` | Maior, maior/igual, menor, menor/igual | `WHERE preco_unitario > 200.00` |
| `<=>` | Igualdade *NULL-safe* (exclusivo MySQL) | `WHERE email <=> NULL` (`TRUE` se `email` for `NULL`) |

### 2.2 Operadores Lógicos e Precedência (`NOT` > `AND` > `OR`)

Na lógica SQL, **`AND` tem precedência maior que `OR`** (assim como multiplicação vem antes da soma). Misturar `AND` e `OR` sem parênteses é uma das maiores fontes de bugs em provas!

```sql
-- ERRADO (sem parênteses): lê como cat=1 OR (cat=2 AND preco < 500), trazendo produtos da cat 1 acima de 500!
SELECT nome, categoria_id, preco_unitario
FROM PRODUTO
WHERE categoria_id = 1 OR categoria_id = 2 AND preco_unitario < 500;

-- CORRETO (com parênteses): categoria 1 OU 2, E preço abaixo de 500
SELECT nome, categoria_id, preco_unitario
FROM PRODUTO
WHERE (categoria_id = 1 OR categoria_id = 2)
  AND preco_unitario < 500;
```

### 2.3 `BETWEEN` e `NOT BETWEEN`

- `col BETWEEN a AND b` é **inclusivo nos dois extremos** (`col >= a AND col <= b`).
- `col NOT BETWEEN a AND b` (ou `NOT (col BETWEEN a AND b)`) significa **`col < a OR col > b`** (exclui os limites `a` e `b`).

> **Correção de erro nas anotações antigas:**
> Em `Aula 26-8 DML`, havia um comentário dizendo que `WHERE NOT (estoque BETWEEN 1 AND 20)` equivalia a `estoque BETWEEN 10 AND 20`. **Isso está incorreto!**  
> `NOT (estoque BETWEEN 1 AND 20)` equivale a **`estoque NOT BETWEEN 1 AND 20`**, ou seja, `estoque < 1 OR estoque > 20` (no `ECOMMERCE`, traz estoque `25`, `30` e `50`, excluindo `5`, `8` e `15`).

```sql
-- Produtos com preço entre 300 e 1000 (inclusive 300.00 e 1000.00)
SELECT idproduto, nome, preco_unitario
FROM PRODUTO
WHERE preco_unitario BETWEEN 300 AND 1000;

-- Produtos FORA da faixa de estoque de 10 a 30 (retorna < 10 ou > 30: estoque 5, 8 e 50)
SELECT idproduto, nome, estoque
FROM PRODUTO
WHERE estoque NOT BETWEEN 10 AND 30;
```

### 2.4 `IN`, `NOT IN` e a Armadilha Mortal do `NULL`

- **Erro de sintaxe clássico:** escrever `WHERE categoria_id (1, 2)` sem a palavra-chave `IN` gera **`ERROR 1305: FUNCTION ecommerce.categoria_id does not exist`** (o MySQL interpreta `categoria_id(...)` como chamada de função!). O correto é `WHERE categoria_id IN (1, 2)`.

```sql
-- Forma limpa para substituir múltiplos OR na mesma coluna
SELECT idproduto, nome, categoria_id
FROM PRODUTO
WHERE categoria_id IN (1, 2);

-- Exclusão com valores fixos (seguro quando não há NULL na lista)
SELECT idproduto, nome
FROM PRODUTO
WHERE idproduto NOT IN (1, 2);
```

> **ARMADILHA CLÁSSICA DE PROVA — `NOT IN` com `NULL`:**
> No SQL, comparações com `NULL` resultam em **`UNKNOWN`** (lógica de 3 valores: `TRUE`, `FALSE`, `UNKNOWN`).  
> A expressão `x NOT IN (1, 2, NULL)` é expandida pelo banco para:  
> `x <> 1 AND x <> 2 AND x <> NULL` → como `x <> NULL` é sempre `UNKNOWN`, **a condição inteira NUNCA é `TRUE`**!  
> **Resultado:** se houver **um único `NULL`** dentro da lista ou subquery de um `NOT IN`, a consulta retorna **0 linhas (Empty set)**!
>
> **Exemplo real no `ECOMMERCE`:** O vendedor `1` (`Roberto Diretor`) tem `gerente_id = NULL`. Veja a diferença:
> ```sql
> -- ARMADILHA: retorna 0 linhas porque gerente_id contém NULL!
> SELECT idvendedor, nome FROM VENDEDOR
> WHERE idvendedor NOT IN (SELECT gerente_id FROM VENDEDOR);
>
> -- CORRETO 1: filtrar IS NOT NULL dentro da subquery
> SELECT idvendedor, nome FROM VENDEDOR
> WHERE idvendedor NOT IN (
>     SELECT gerente_id FROM VENDEDOR WHERE gerente_id IS NOT NULL
> );
>
> -- CORRETO 2 (ainda mais seguro e idiomático): usar NOT EXISTS (ver Guia 06)
> SELECT v.idvendedor, v.nome FROM VENDEDOR v
> WHERE NOT EXISTS (
>     SELECT 1 FROM VENDEDOR sub WHERE sub.gerente_id = v.idvendedor
> );
> ```

### 2.5 `IS NULL` e `IS NOT NULL`

Nunca use `= NULL` ou `!= NULL` (ambos sempre avaliam como `UNKNOWN`). Use sempre `IS NULL` ou `IS NOT NULL`.

```sql
-- Clientes sem email cadastrado (retorna idcliente 6 - Fernanda Costa)
SELECT idcliente, nome, email
FROM CLIENTE
WHERE email IS NULL;

-- Vendedores que possuem gerente definido (exclui Roberto Diretor)
SELECT idvendedor, nome, gerente_id
FROM VENDEDOR
WHERE gerente_id IS NOT NULL;
```

### 2.6 Operador `LIKE` (Busca por Padrão)

> **Correção conceitual:** **`LIKE` é um operador de comparação de texto, e NÃO uma função** (portanto usa-se `WHERE nome LIKE 'M%'`, nunca `LIKE(nome, 'M%')`).

| Curinga | Significado | Exemplo | Casa com |
|---|---|---|---|
| `%` | Zero, um ou vários caracteres | `'M%'` | `'Mouse Gamer RGB'`, `'Monitor 27 144Hz'` |
| `%...%` | Contém o trecho em qualquer posição | `'%Gamer%'` | `'Mouse Gamer RGB'`, `'Cadeira Gamer'`, `'Headset Gamer'` |
| `_` | Exatamente **1** caractere qualquer | `'___ Silva'` | `'Ana Silva'` (3 letras antes do espaço) |

```sql
SELECT idproduto, nome
FROM PRODUTO
WHERE nome LIKE '%Gamer%';
```

> **Nota sobre maiúsculas/acentos:** Na collation padrão do MySQL 8 (`utf8mb4_0900_ai_ci`), `LIKE` é **case-insensitive** (`ci`) e **accent-insensitive** (`ai`). Se precisar de busca sensível a maiúsculas/minúsculas, use `WHERE nome LIKE BINARY '%Gamer%'` ou altere a collation da expressão. Para buscar literalmente `%` ou `_`, use `ESCAPE` (ex.: `LIKE '%10!%%' ESCAPE '!'`).

---

## 3. Funções Escalares de String

| Função | O que faz | Armadilha / Detalhe de Prova |
|---|---|---|
| `UPPER(s)` / `LOWER(s)` | Converte para MAIÚSCULAS / minúsculas | Aplicar função na coluna dentro do `WHERE` (`WHERE UPPER(nome) = ...`) pode impedir o uso de índices! |
| `CONCAT(s1, s2, ...)` | Concatena strings | **Se qualquer argumento for `NULL`, o resultado inteiro vira `NULL`!** |
| `CONCAT_WS(sep, s1, s2, ...)` | Concatena com separador | **Ignora argumentos `NULL`** (muito útil quando campos opcionais como `email` podem ser `NULL`). |
| `SUBSTRING(s, pos, len)` | Extrai trecho a partir de `pos` | **A primeira posição é `1`**, não `0`! |
| `LEFT(s, n)` / `RIGHT(s, n)` | `n` primeiros / `n` últimos caracteres | Útil para prefixos e últimos dígitos de CPF. |
| `CHAR_LENGTH(s)` | Quantidade de **caracteres** | Use para texto com acentos (`'João'` = 4 caracteres). |
| `LENGTH(s)` | Quantidade de **bytes** | Em UTF-8, `'João'` ocupa **5 bytes** (`ã` = 2 bytes)! |
| `REPLACE(s, de, para)` | Substitui ocorrências | **Case-sensitive no MySQL!** `'gamer'` não substitui `'Gamer'`. |
| `TRIM(s)` / `LTRIM` / `RTRIM` | Remove espaços das pontas | Também remove outros caracteres: `TRIM(BOTH '-' FROM '--abc--')`. |
| `LPAD(s, tam, pad)` / `RPAD` | Preenche à esquerda / direita | Ex.: `LPAD(idproduto, 5, '0')` → `'00001'`. |

```sql
-- Demonstrando CONCAT vs CONCAT_WS com cliente 6 (email = NULL)
SELECT
    idcliente,
    nome,
    CONCAT(idcliente, ' - ', nome, ' <', email, '>') AS concat_sem_tratamento,
    CONCAT(idcliente, ' - ', nome, ' <', COALESCE(email, 'sem email'), '>') AS concat_tratado,
    CONCAT_WS(' | ', idcliente, nome, email) AS com_concat_ws
FROM CLIENTE;

-- LEFT, RIGHT, SUBSTRING, CHAR_LENGTH vs LENGTH, LPAD e REPLACE
SELECT
    idcliente,
    LEFT(nome, 3) AS iniciais,
    RIGHT(cpf, 4) AS ultimos_cpf,
    CHAR_LENGTH(nome) AS qtd_chars,
    LENGTH(nome) AS qtd_bytes
FROM CLIENTE;

SELECT
    LPAD(idproduto, 5, '0') AS codigo_padronizado,
    nome,
    REPLACE(nome, 'Gamer', 'PRO') AS nome_pro
FROM PRODUTO
WHERE nome LIKE '%Gamer%';
```

---

## 4. Funções de Data e Hora

| Função | Retorno / Uso | Exemplo |
|---|---|---|
| `CURDATE()` | Data atual (`YYYY-MM-DD`) | `'2026-11-21'` |
| `NOW()` | Data e hora atuais (`YYYY-MM-DD HH:MM:SS`) | `'2026-11-21 12:00:00'` |
| `YEAR(d)`, `MONTH(d)`, `DAY(d)` | Extrai ano, mês (1–12) e dia (1–31) | `YEAR('2026-08-15')` → `2026` |
| `DATE_FORMAT(d, fmt)` | Formata data como texto | `DATE_FORMAT(data_pedido, '%d/%m/%Y')` → `'15/08/2026'` |
| `DATEDIFF(d1, d2)` | Diferença em dias (`d1 - d2`) | `DATEDIFF(CURDATE(), data_pedido)` |
| `DATE_ADD(d, INTERVAL n UNIT)` | Soma intervalo (`DAY`, `MONTH`, `YEAR`) | `DATE_ADD(data_pedido, INTERVAL 7 DAY)` |
| `DATE_SUB(d, INTERVAL n UNIT)` | Subtrai intervalo | `DATE_SUB(CURDATE(), INTERVAL 30 DAY)` |

> **Especificadores mais cobrados no `DATE_FORMAT`:**  
> `%d` (dia 2 dígitos), `%m` (mês 2 dígitos), `%Y` (ano 4 dígitos), `%y` (ano 2 dígitos), `%H` (hora 00–23), `%i` (minutos — atenção: é `%i`, não `%m`!), `%s` (segundos).

```sql
SELECT
    idpedido,
    data_pedido,
    YEAR(data_pedido)  AS ano,
    MONTH(data_pedido) AS mes,
    DAY(data_pedido)   AS dia,
    DATE_FORMAT(data_pedido, '%d/%m/%Y') AS data_br,
    DATEDIFF(CURDATE(), data_pedido)     AS dias_desde_pedido,
    DATE_ADD(data_pedido, INTERVAL 7 DAY) AS previsao_entrega
FROM PEDIDO;
```

---

## 5. Funções Numéricas e Formatação Brasileira (`pt_BR`)

| Função | O que faz | Exemplo (`149.90`) |
|---|---|---|
| `ROUND(n, d)` | Arredonda para `d` casas decimais | `ROUND(149.90, 0)` → `150` |
| `TRUNCATE(n, d)` | **Corta** sem arredondar em `d` casas | `TRUNCATE(149.90, 0)` → `149` |
| `CEIL(n)` / `CEILING(n)` | Teto (menor inteiro `>= n`) | `CEIL(149.10)` → `150` |
| `FLOOR(n)` | Piso (maior inteiro `<= n`) | `FLOOR(149.90)` → `149` |
| `MOD(a, b)` ou `a % b` | Resto da divisão inteira | `MOD(idproduto, 2)` (`0` par, `1` ímpar) |
| `FORMAT(n, d, 'pt_BR')` | Formata número com separador de milhar `.` e decimal `,` | `FORMAT(12345.67, 2, 'pt_BR')` → `'12.345,67'` *(no MySQL 8.x, números de 4 dígitos como `1299.90` retornam `'1299,90'` em `'pt_BR'`)* |

> **Atenção na prova (`FORMAT` retorna STRING!):**
> `FORMAT(preco_unitario, 2, 'pt_BR')` devolve um texto (`VARCHAR`), não um número.  
> - **Nunca** faça `ORDER BY FORMAT(preco_unitario, 2, 'pt_BR')` — ordenaria alfabeticamente (`'899,00'` > `'4.500,00'`)! Ordene pela coluna numérica original (`preco_unitario`) e use `FORMAT` apenas na exibição final no `SELECT`.

```sql
SELECT
    idproduto,
    nome,
    preco_unitario,
    FLOOR(preco_unitario)    AS piso,
    CEIL(preco_unitario)     AS teto,
    ROUND(preco_unitario, 0) AS arredondado,
    TRUNCATE(preco_unitario, 0) AS truncado,
    CONCAT('R$ ', FORMAT(preco_unitario, 2, 'pt_BR')) AS preco_br,
    IF(MOD(idproduto, 2) = 0, 'Par', 'Impar') AS paridade_id
FROM PRODUTO
ORDER BY preco_unitario DESC;
```

---

## 6. Tratamento de Nulos e Funções Condicionais

| Função / Expressão | Padrão SQL | Descrição |
|---|---|---|
| `IFNULL(expr, substituto)` | MySQL | Se `expr` for `NULL`, retorna `substituto`; senão, retorna `expr`. Aceita 2 argumentos. |
| `COALESCE(e1, e2, ..., en)` | **ANSI SQL** | Retorna o **primeiro** argumento não nulo da lista (aceita 2 ou mais argumentos). Mais portável! |
| `NULLIF(a, b)` | **ANSI SQL** | Retorna `NULL` se `a = b`; senão, retorna `a`. Excelente para evitar divisão por zero: `total / NULLIF(qtd, 0)`. |
| `IF(cond, v_true, v_false)` | MySQL | Operador ternário simples para 2 caminhos. |
| `CASE WHEN ... THEN ... ELSE ... END` | **ANSI SQL** | Condicional completa para múltiplas faixas/regras (portável para qualquer SGBD). |

```sql
-- 1. IFNULL e COALESCE em CLIENTE (Fernanda Costa tem email NULL)
SELECT
    idcliente,
    nome,
    IFNULL(email, 'sem email')   AS email_ifnull,
    COALESCE(email, 'sem email') AS email_coalesce
FROM CLIENTE;

-- 2. IF() ternário e CASE WHEN em PRODUTO
SELECT
    LPAD(idproduto, 4, '0') AS codigo,
    UPPER(nome)             AS produto,
    CONCAT('R$ ', FORMAT(preco_unitario, 2, 'pt_BR')) AS preco_br,
    estoque,
    IF(estoque > 10, 'OK', 'REPOR') AS situacao_estoque,
    CASE
        WHEN preco_unitario < 200 THEN 'Barato'
        WHEN preco_unitario <= 800 THEN 'Medio'
        ELSE 'Premium'
    END AS classe_preco
FROM PRODUTO
WHERE categoria_id IN (1, 2, 4)
  AND preco_unitario BETWEEN 100 AND 2000
ORDER BY preco_unitario ASC;
```

> **Dica de `CASE WHEN`:** Os ramos `WHEN` são avaliados **em ordem de cima para baixo** e o primeiro verdadeiro encerra a avaliação. Se omitir o `ELSE` e nenhuma condição bater, o `CASE` retorna **`NULL`**.

---

## Cola Rápida de Prova (`04`)

- **Precedência lógica:** `NOT` → `AND` → `OR`. Sempre use parênteses ao misturar `AND` e `OR`.
- **`BETWEEN 10 AND 20`:** inclui `10` e `20`. `NOT BETWEEN 10 AND 20` exclui ambos (`< 10 OR > 20`).
- **Armadilha `NOT IN` + `NULL`:** se houver um único `NULL` na lista/subquery, `NOT IN` retorna **vazio** (`0` linhas). Use `IS NOT NULL` na subquery ou `NOT EXISTS`.
- **`LIKE`:** é operador, não função (`%` = 0+ chars, `_` = 1 char).
- **`CONCAT` vs `CONCAT_WS`:** `CONCAT` vira `NULL` se qualquer argumento for `NULL`; `CONCAT_WS` pula nulos.
- **`CHAR_LENGTH` vs `LENGTH`:** caracteres vs bytes (`'João'` → `4` chars, `5` bytes).
- **`FORMAT(..., 2, 'pt_BR')`:** retorna texto (`'1.299,90'`); não use para ordenar nem somar.
- **Portabilidade:** prefira `COALESCE` e `CASE WHEN` (ANSI SQL) a `IFNULL` e `IF()` quando precisar de código portável.
