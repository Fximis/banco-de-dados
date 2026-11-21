# 05 — Agregação, `GROUP BY`, `HAVING` e Window Functions

> **Base utilizada neste guia:** Esquema canônico **`ECOMMERCE`** (MySQL 8.x).  
> Setup completo da base: **[`../exercicios/02-lista-ecommerce-completa.md`](../exercicios/02-lista-ecommerce-completa.md)**.

---

## 1. Funções de Agregação

Funções de agregação resumem **múltiplas linhas** em **um único valor calculado**:

| Função | O que calcula | Comportamento com `NULL` |
|---|---|---|
| `SUM(expr)` | Soma dos valores | Ignora `NULL` (retorna `NULL` se não houver linhas) |
| `AVG(expr)` | Média aritmética | **Ignora `NULL` no numerador E no denominador!** |
| `MAX(expr)` | Maior valor (números, datas ou textos) | Ignora `NULL` |
| `MIN(expr)` | Menor valor | Ignora `NULL` |
| `COUNT(*)` | Conta **todas as linhas** da tabela/grupo | **Inclui linhas com valores `NULL`** |
| `COUNT(col)` | Conta linhas onde `col` **não é `NULL`** | **Ignora `NULL`** |
| `COUNT(DISTINCT col)` | Conta valores **únicos e não nulos** de `col` | **Ignora `NULL` e duplicatas** |

### 1.1 Diferença Crítica: `COUNT(*)` vs `COUNT(col)` vs `COUNT(DISTINCT col)`

Na tabela `CLIENTE` canônica temos **6 clientes**, sendo que a cliente `6` (`Fernanda Costa`) possui `email = NULL`. Na tabela `PEDIDO`, temos **4 pedidos**, feitos pelos clientes `1`, `2`, `1` e `4`:

```sql
USE ECOMMERCE;

SELECT
    COUNT(*)                  AS total_clientes,
    COUNT(email)              AS clientes_com_email,
    COUNT(*) - COUNT(email)   AS clientes_sem_email
FROM CLIENTE;
-- Resultado: total_clientes = 6, clientes_com_email = 5, clientes_sem_email = 1

SELECT
    COUNT(*)                  AS total_pedidos,
    COUNT(DISTINCT cliente_id) AS clientes_compradores_unicos
FROM PEDIDO;
-- Resultado: total_pedidos = 4, clientes_compradores_unicos = 3 (clientes 1, 2 e 4)
```

### 1.2 Erro Clássico de Negócio: `SUM(preco_unitario)` vs `SUM(quantidade * preco_unitario)`

Em `ITEMPEDIDO`, somar apenas `preco_unitario` ignora que um item pode ter `quantidade > 1` (como no Pedido `4`, Produto `1`, que tem `quantidade = 2`):

```sql
-- ERRADO para faturamento: soma apenas o preço unitário de cada linha
-- CORRETO para faturamento: multiplica quantidade * preco_unitario antes de somar
SELECT
    SUM(preco_unitario)              AS soma_precos_unitarios,
    SUM(quantidade * preco_unitario) AS total_venda_real,
    AVG(quantidade * preco_unitario) AS media_por_item,
    MAX(quantidade * preco_unitario) AS maior_item,
    MIN(quantidade * preco_unitario) AS menor_item,
    COUNT(produto_id)                AS qtd_linhas_item
FROM ITEMPEDIDO;
```

> **Cuidado na prova (`AVG` com `NULL`):** se 2 produtos têm estoque `10` e `20`, e 1 produto tem estoque `NULL`, `AVG(estoque)` calcula `(10 + 20) / 2 = 15`, e **não** `30 / 3 = 10`. Se o `NULL` representar zero, use `AVG(COALESCE(estoque, 0))`.

---

## 2. Ordem Lógica de Execução SQL (Fundamental para Prova!)

Você **escreve** o SQL começando por `SELECT`, mas o SGBD **executa logicamente** nesta ordem:

```text
1. FROM        (identifica as tabelas)
2. JOIN / ON   (combina as tabelas)
3. WHERE       (filtra linhas individuais — ANTES da agregação!)
4. GROUP BY    (agrupa as linhas filtradas)
5. HAVING      (filtra os grupos — DEPOIS da agregação!)
6. SELECT      (calcula expressões, aliases e Window Functions)
7. DISTINCT    (remove linhas duplicadas do resultado)
8. ORDER BY    (ordena o resultado final)
9. LIMIT/OFFSET(recorta a página final)
```

**Consequências diretas cobradas em prova:**
1. **Por que um alias criado no `SELECT` não funciona no `WHERE`?** Porque a etapa `3` (`WHERE`) roda antes da etapa `6` (`SELECT`)!
2. **Por que `WHERE SUM(total_pedido) > 1000` dá erro (`ERROR 1111: Invalid use of group function`)?** Porque na etapa `3` os grupos ainda não foram formados! Agregações só existem após o `GROUP BY` (etapa `4`), podendo ser filtradas no `HAVING` (etapa `5`).
3. **Por que o `ORDER BY` enxerga aliases do `SELECT`?** Porque a etapa `8` (`ORDER BY`) roda depois da etapa `6` (`SELECT`).

---

## 3. `GROUP BY` e a Regra Real do `ONLY_FULL_GROUP_BY`

### 3.1 Correção Conceitual do `ONLY_FULL_GROUP_BY`

> **Correção de erro nas anotações originais (`Aula 26-08 DDL:459`):**
> O comentário antigo dizia: *"TODAS AS COLUNAS COLOCADAS ANTES DA FUNCAO DE AGRUPAMENTO PRECISAM SER COLOCADAS NO GROUP BY"*.  
> **Isso é impreciso!** A posição da coluna no `SELECT` (antes ou depois da função de agregação) **não importa**.  
> A regra real do padrão SQL e do modo **`ONLY_FULL_GROUP_BY`** (ativo por padrão no MySQL 8.x) é:
>
> **Toda coluna não agregada presente no `SELECT`, `HAVING` ou `ORDER BY` deve estar listada no `GROUP BY` — *a menos que* ela seja funcionalmente dependente da chave primária (PK) / chave única `NOT NULL` presente no `GROUP BY`.**

**Por que o MySQL exige isso?** Se você agrupar apenas por `categoria_id` e pedir `SELECT categoria_id, nome, SUM(estoque) FROM PRODUTO GROUP BY categoria_id`, existem vários `nome`s diferentes dentro da mesma categoria — qual o banco deveria exibir? Para evitar retorno arbitrário/ambíguo, o MySQL 8.x bloqueia com **`ERROR 1055: Expression #2 of SELECT list is not in GROUP BY clause`**.

**Boa prática acadêmica e portável (funciona em MySQL, PostgreSQL e Oracle):** ao agrupar por uma entidade (ex.: vendedor ou produto), inclua **`PK + colunas descritivas`** no `GROUP BY`, como `GROUP BY v.idvendedor, v.nome` (evita também colapsar duas pessoas homônimas no mesmo grupo!).

### 3.2 Exemplos de `GROUP BY` no `ECOMMERCE`

```sql
-- 1. Total vendido por produto (agrupando por produto_id)
SELECT
    produto_id,
    SUM(quantidade)                  AS unidades_vendidas,
    SUM(quantidade * preco_unitario) AS valor_total
FROM ITEMPEDIDO
GROUP BY produto_id
ORDER BY valor_total DESC;

-- 2. Agrupamento composto (múltiplas colunas) + filtro pré-agregação (WHERE)
SELECT
    pedido_id,
    produto_id,
    SUM(quantidade * preco_unitario) AS subtotal
FROM ITEMPEDIDO
WHERE pedido_id BETWEEN 1 AND 3
GROUP BY pedido_id, produto_id;
```

### 3.3 `WITH ROLLUP` e `GROUPING()` (Subtotais e Total Geral)

No MySQL, `WITH ROLLUP` gera linhas extras de **subtotal** e um **total geral** (com `NULL` nas colunas agrupadas):

```sql
SELECT
    IF(GROUPING(categoria_id) = 1, 'TOTAL GERAL', CAST(categoria_id AS CHAR)) AS categoria,
    COUNT(*)                   AS qtd_produtos,
    SUM(estoque)               AS total_unidades,
    SUM(estoque * preco_unitario) AS valor_total_estoque
FROM PRODUTO
GROUP BY categoria_id WITH ROLLUP;
```

> **Dica de `GROUPING(col)` (MySQL 8.0+):** retorna `1` quando o `NULL` foi gerado pelo `ROLLUP` (linha de total) e `0` quando veio dos dados reais da tabela!

---

## 4. `HAVING` vs `WHERE` (Correção Conceitual e Portabilidade)

> **Correção de erro nas anotações originais (`Aula 26-08 DDL:469-470`):**
> O comentário dizia que `HAVING` é usado *"para fazer a condicional, não usa o WHERE mais de 1x"*.  
> **Na verdade:** `HAVING` **não** é um "segundo `WHERE`". A diferença é **em que momento** eles filtram:
> - **`WHERE`** filtra **linhas individuais** *antes* do `GROUP BY` (sem funções de agregação).
> - **`HAVING`** filtra **grupos inteiros** *depois* do `GROUP BY` (usando resultados agregados como `SUM`, `COUNT`, `AVG`).

```sql
-- Combinando WHERE (antes de agrupar) e HAVING (depois de agrupar)
SELECT
    pedido_id,
    COUNT(*)                         AS qtd_itens,
    SUM(quantidade * preco_unitario) AS valor_total
FROM ITEMPEDIDO
WHERE pedido_id >= 1                 -- 1º: filtra linhas individuais
GROUP BY pedido_id                   -- 2º: agrupa por pedido
HAVING SUM(quantidade * preco_unitario) > 2000  -- 3º: mantém só pedidos > R$ 2.000
ORDER BY valor_total DESC;
```

> **Atenção à portabilidade (Alias no `HAVING`):**
> O MySQL aceita `HAVING valor_total > 2000` (usando o alias do `SELECT`) como uma extensão própria, mas isso viola o padrão ANSI SQL e **falha** no PostgreSQL, Oracle e SQL Server. **Prefira sempre repetir a expressão agregada:** `HAVING SUM(quantidade * preco_unitario) > 2000`.

---

## 5. Nota sobre Dado Derivado (`valor_estoque`)

Como visto no [Guia 03 — DML e Transações](./03-dml-crud-e-transacoes.md), valores derivados como `estoque * preco_unitario` **não** devem ser mantidos com `DROP` + `UPDATE` manuais. Para consultas recorrentes, use:
- Cálculo direto na projeção (`SELECT ..., estoque * preco_unitario AS valor_estoque`),
- `GENERATED ALWAYS AS (estoque * preco_unitario) STORED` na tabela, ou
- Uma **`VIEW`** (veja [`./07-views-procedures-functions-e-triggers.md`](./07-views-procedures-functions-e-triggers.md)).

---

## 6. Window Functions (Funções de Janela — MySQL 8.0+)

Enquanto o **`GROUP BY` colapsa** várias linhas em uma única linha por grupo, uma **Window Function (`OVER (...)`)** calcula agregações, rankings ou comparações **sem colapsar as linhas** — cada linha original é mantida na saída!

### 6.1 Anatomia do `OVER (...)`

```text
funcao_janela(...) OVER (
    [PARTITION BY coluna_grupo]   -- opcional: divide em sub-janelas (como um "GROUP BY" que não colapsa)
    [ORDER BY coluna_ordem]       -- opcional: define a ordem dentro da janela (obrigatório p/ ranking/LAG/LEAD)
    [ROWS BETWEEN ... AND ...]    -- opcional: moldura da janela (ex.: UNBOUNDED PRECEDING AND CURRENT ROW)
)
```

### 6.2 Ranqueamento: `ROW_NUMBER()`, `RANK()` e `DENSE_RANK()`

Diferença clássica de prova quando há **empate** (ex.: se dois itens tiverem o mesmo valor: `100, 100, 80`):
- **`ROW_NUMBER()`:** numeração contínua sem repetir (`1, 2, 3`).
- **`RANK()`:** empates recebem o mesmo número e **pulam** posições (`1, 1, 3`).
- **`DENSE_RANK()`:** empates recebem o mesmo número **sem pular** posições (`1, 1, 2`).

```sql
-- Ranking de produtos por preço dentro de cada categoria E no catálogo geral
SELECT
    categoria_id,
    idproduto,
    nome,
    preco_unitario,
    ROW_NUMBER() OVER (PARTITION BY categoria_id ORDER BY preco_unitario DESC) AS pos_na_categoria,
    RANK()       OVER (ORDER BY preco_unitario DESC) AS rank_geral,
    DENSE_RANK() OVER (ORDER BY preco_unitario DESC) AS dense_rank_geral
FROM PRODUTO;
```

### 6.3 Deslocamento Temporal/Sequencial: `LAG()` e `LEAD()`

- `LAG(col, n, padrao)` acessa a linha **anterior** dentro da partição.
- `LEAD(col, n, padrao)` acessa a **próxima** linha dentro da partição.

```sql
-- Compara o valor de cada pedido com o pedido anterior do mesmo cliente
SELECT
    cliente_id,
    idpedido,
    data_pedido,
    total_pedido,
    LAG(total_pedido, 1, 0.00) OVER (
        PARTITION BY cliente_id
        ORDER BY data_pedido, idpedido
    ) AS pedido_anterior,
    total_pedido - LAG(total_pedido) OVER (
        PARTITION BY cliente_id
        ORDER BY data_pedido, idpedido
    ) AS diferenca_anterior
FROM PEDIDO
ORDER BY cliente_id, data_pedido, idpedido;
```

### 6.4 Soma Acumulada e Participação Percentual (`SUM() OVER()`)

```sql
-- 1. Soma acumulada (running total) dos pedidos em ordem cronológica
SELECT
    idpedido,
    data_pedido,
    total_pedido,
    SUM(total_pedido) OVER (
        ORDER BY data_pedido, idpedido
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS faturamento_acumulado
FROM PEDIDO;

-- 2. Participação percentual (%) de cada produto no valor total do estoque
SELECT
    idproduto,
    nome,
    categoria_id,
    (estoque * preco_unitario) AS valor_estoque,
    SUM(estoque * preco_unitario) OVER () AS total_geral_estoque,
    ROUND(
        (estoque * preco_unitario) * 100.0 / SUM(estoque * preco_unitario) OVER (),
        2
    ) AS percentual_total
FROM PRODUTO
ORDER BY valor_estoque DESC;
```

> **Regra de ouro das Window Functions (Prova!):**
> Window functions são avaliadas na etapa `6` (`SELECT`), **após** `WHERE`, `GROUP BY` e `HAVING`. Portanto, você **não pode** escrever `WHERE ROW_NUMBER() OVER (...) = 1`. Para filtrar o resultado de uma window function (ex.: "Top 1 produto mais caro por categoria"), envolva a query em uma **CTE (`WITH`)** ou subquery — veja o [Guia 06 — JOINs, Subqueries e CTEs](./06-joins-subqueries-e-ctes.md).

---

## Cola Rápida de Prova (`05`)

- **`COUNT(*)` vs `COUNT(col)`:** `COUNT(*)` conta nulos; `COUNT(col)` ignora nulos; `COUNT(DISTINCT col)` ignora nulos e repetidos.
- **Ordem lógica:** `FROM` → `JOIN` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`.
- **`ONLY_FULL_GROUP_BY`:** toda coluna não agregada do `SELECT`/`HAVING`/`ORDER BY` deve estar no `GROUP BY` (ou depender funcionalmente da PK agrupada). Boa prática: `GROUP BY id, nome`.
- **`WHERE` vs `HAVING`:** `WHERE` filtra **linhas** antes do `GROUP BY`; `HAVING` filtra **grupos** depois do `GROUP BY`.
- **Window Functions:** não colapsam linhas! `ROW_NUMBER` (1,2,3), `RANK` (1,1,3), `DENSE_RANK` (1,1,2), `LAG` (anterior), `LEAD` (próximo), `SUM() OVER ()` (total sem agrupar).
