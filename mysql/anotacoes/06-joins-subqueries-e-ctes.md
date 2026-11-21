# 06 — `JOIN`s, Operadores de Conjunto, Subqueries e CTEs

> **Base utilizada neste guia:** Esquema canônico **`ECOMMERCE`** (MySQL 8.x, incluindo `VENDEDOR` e `PEDIDO.vendedor_id`).  
> Setup completo da base e exercícios: **[`../exercicios/02-lista-ecommerce-completa.md`](../exercicios/02-lista-ecommerce-completa.md)**.

---

## 1. `JOIN`s Relacionais no `ECOMMERCE`

Use sempre a sintaxe **ANSI explícita** (`FROM T1 JOIN T2 ON ...`), nunca a junção antiga por vírgula no `WHERE` (`FROM T1, T2 WHERE ...`), que facilita produtos cartesianos acidentais.

> **Cuidado com `lower_case_table_names=0`:** mantenha nomes de tabelas em **MAIÚSCULAS** (`PEDIDO`, `VENDEDOR`, `CLIENTE`, `PRODUTO`, `CATEGORIA`, `ITEMPEDIDO`) e **casing idêntico nos aliases** (se declarou `g`, nunca escreva `G.nome`, pois gera `ERROR 1054`).

### 1.1 `INNER JOIN` (Interseção por Predicado `ON`)

> **Correção conceitual (`Aula 26-08 DDL:732-734`):**
> `INNER JOIN` não significa simplesmente "o que tem de igual nas tabelas", e sim a **interseção das linhas de ambas as tabelas que satisfazem a condição do `ON`** (geralmente `FK = PK`, mas também pode usar `>`, `BETWEEN`, etc.). Linhas sem correspondência no outro lado são descartadas.

```sql
USE ECOMMERCE;

-- 1. INNER JOIN com 2 tabelas: PEDIDO + VENDEDOR
SELECT
    p.idpedido,
    p.cliente_id,
    p.data_pedido,
    p.total_pedido,
    p.vendedor_id,
    v.nome AS nome_vendedor
FROM PEDIDO p
INNER JOIN VENDEDOR v ON p.vendedor_id = v.idvendedor;

-- 2. INNER JOIN encadeado com 3 tabelas: PEDIDO + VENDEDOR + CLIENTE
SELECT
    p.idpedido,
    p.data_pedido,
    p.total_pedido,
    v.nome AS nome_vendedor,
    c.nome AS nome_cliente
FROM PEDIDO p
INNER JOIN VENDEDOR v ON p.vendedor_id = v.idvendedor
INNER JOIN CLIENTE  c ON p.cliente_id  = c.idcliente
ORDER BY p.idpedido;
```

### 1.2 `LEFT JOIN` — Correção Crítica do Exemplo `VENDEDOR` + `COALESCE`

Nas anotações originais (`Aula 26-08 DDL:741-746`), havia uma consulta tentando listar o total vendido por vendedor com `COALESCE(SUM(p.total_pedido), 0)`, mas usando **`INNER JOIN`** e **`GROUP BY v.nome`**:

```sql
-- VERSÃO ORIGINAL COM BUG LÓGICO:
-- 1) INNER JOIN descarta Roberto (1), Fernanda (2) e Marcos (5) que não têm pedidos!
--    O COALESCE(..., 0) nunca chega a atuar porque linhas sem pedido foram eliminadas!
-- 2) GROUP BY apenas em v.nome colapsaria vendedores homônimos.
SELECT v.nome AS nome_vendedor, COALESCE(SUM(p.total_pedido), 0) AS valor_total
FROM VENDEDOR v
INNER JOIN PEDIDO p ON v.idvendedor = p.vendedor_id
GROUP BY v.nome;
```

**Versão Corrigida com `LEFT JOIN` + `GROUP BY v.idvendedor, v.nome`:**

```sql
-- CORRETO: preserva TODOS os 6 vendedores e exibe 0.00 para quem não vendeu diretamente
SELECT
    v.idvendedor,
    v.nome                         AS nome_vendedor,
    COUNT(p.idpedido)              AS qtd_pedidos,
    COALESCE(SUM(p.total_pedido), 0.00) AS valor_total
FROM VENDEDOR v
LEFT JOIN PEDIDO p ON v.idvendedor = p.vendedor_id
GROUP BY v.idvendedor, v.nome
ORDER BY valor_total DESC, v.idvendedor ASC;
```

**Resultado esperado na base canônica:**
- `Patricia Vendedor` (6): `4999.70` (`1` pedido)
- `Carlos Vendedor` (3): `2698.80` (`2` pedidos: `499.90 + 2198.90`)
- `Juliana Vendedor` (4): `899.00` (`1` pedido)
- `Roberto Diretor` (1), `Fernanda Gerente` (2), `Marcos Gerente` (5): `0.00` (`0` pedidos)

> **Armadilha clássica no `LEFT JOIN`:**
> Se você colocar uma condição sobre a tabela da **direita** (`p`) no **`WHERE`** (ex.: `WHERE p.data_pedido >= '2026-08-01'`), as linhas sem pedido têm `p.data_pedido = NULL`, falham no `WHERE` e o `LEFT JOIN` **vira um `INNER JOIN` disfarçado**! Filtros opcionais da tabela da direita devem ficar dentro do **`ON`** (ex.: `LEFT JOIN PEDIDO p ON v.idvendedor = p.vendedor_id AND p.data_pedido >= '2026-08-01'`).

### 1.3 `RIGHT JOIN`, `CROSS JOIN`, `FULL OUTER JOIN` Emulado e Anti-Join

| Tipo de JOIN | O que retorna | Uso típico |
|---|---|---|
| `RIGHT JOIN` | Todas as linhas da tabela da **direita** + correspondências da esquerda | Espelho do `LEFT JOIN` (em produção, prefira reescrever invertendo as tabelas com `LEFT JOIN` por clareza) |
| `CROSS JOIN` | Produto cartesiano ($M \times N$ linhas) | Gerar combinações/grades (ex.: todas as categorias × faixas) |
| `FULL OUTER JOIN` | Todas da esquerda + todas da direita (`NULL` onde não houver par) | **MySQL NÃO possui sintaxe nativa `FULL OUTER JOIN`** — deve ser emulado com `UNION`! |
| **Anti-Join** | Linhas da esquerda **sem** correspondência na direita | `LEFT JOIN ... WHERE direita.pk IS NULL` |

```sql
-- 1. Anti-Join: Clientes que NUNCA fizeram pedido (Beatriz Lima, Maria Oliveira, Fernanda Costa)
SELECT c.idcliente, c.nome, c.status
FROM CLIENTE c
LEFT JOIN PEDIDO p ON c.idcliente = p.cliente_id
WHERE p.idpedido IS NULL;

-- 2. Anti-Join: Categorias sem nenhum produto cadastrado (3 - Hardware)
SELECT cat.idcategoria, cat.nome
FROM CATEGORIA cat
LEFT JOIN PRODUTO pr ON cat.idcategoria = pr.categoria_id
WHERE pr.idproduto IS NULL;

-- 3. Emulação de FULL OUTER JOIN no MySQL (LEFT JOIN + UNION ALL + RIGHT JOIN filtrando nulos)
SELECT c.idcliente, c.nome, p.idpedido
FROM CLIENTE c
LEFT JOIN PEDIDO p ON c.idcliente = p.cliente_id
UNION ALL
SELECT c.idcliente, c.nome, p.idpedido
FROM CLIENTE c
RIGHT JOIN PEDIDO p ON c.idcliente = p.cliente_id
WHERE c.idcliente IS NULL;
```

---

## 2. Auto-Relacionamento (`SELF JOIN`) e Solução do Exercício do Gerente

Um **auto-relacionamento** ocorre quando uma tabela possui uma `FOREIGN KEY` apontando para sua própria `PRIMARY KEY` (ex.: `VENDEDOR.gerente_id -> VENDEDOR.idvendedor`). Para consultá-la, damos **dois aliases distintos** à mesma tabela.

### 2.1 Listando Toda a Equipe e seu Respectivo Gerente (Corrigido!)

Nas anotações originais (`Aula 26-08 DDL:748-750`), havia dois problemas:
1. Uso de alias `G` na declaração e `g` no `ON` (falha com **`ERROR 1054`** em ambientes case-sensitive).
2. Uso de `INNER JOIN`, que **escondia** `Roberto Diretor` (`gerente_id IS NULL`).

```sql
-- CORRETO: LEFT JOIN inclui Roberto Diretor (sem gerente) e mantém aliases consistentes (v e g)
SELECT
    v.idvendedor,
    v.nome                          AS nome_vendedor,
    v.gerente_id,
    COALESCE(g.nome, 'Sem gerente (Diretoria)') AS nome_gerente
FROM VENDEDOR v
LEFT JOIN VENDEDOR g ON v.gerente_id = g.idvendedor
ORDER BY v.idvendedor;
```

### 2.2 Solução Comentada do Exercício em Aberto (`L754`): "Total de Vendas por Gerente"

No final da aula de 15/09, ficou o desafio: *"Total de vendas por gerente, e não por vendedor"*.  
Para chegar ao total da equipe de cada gerente direto, encadeamos **`VENDEDOR g` (gerente)** → **`VENDEDOR sub` (subordinado)** → **`PEDIDO p` (vendas do subordinado)**:

```sql
-- Opção A: Somente gerentes diretos (quem possui subordinados diretos)
SELECT
    g.idvendedor                        AS id_gerente,
    g.nome                              AS nome_gerente,
    COUNT(DISTINCT sub.idvendedor)      AS qtd_subordinados_diretos,
    COUNT(p.idpedido)                   AS qtd_pedidos_equipe,
    COALESCE(SUM(p.total_pedido), 0.00) AS total_vendas_equipe
FROM VENDEDOR g
INNER JOIN VENDEDOR sub ON sub.gerente_id = g.idvendedor
LEFT  JOIN PEDIDO   p   ON p.vendedor_id  = sub.idvendedor
GROUP BY g.idvendedor, g.nome
ORDER BY total_vendas_equipe DESC;
-- Resultado na base canônica:
-- Marcos Gerente (5): 4999.70 (vendas de Patricia)
-- Fernanda Gerente (2): 3597.80 (Carlos 2698.80 + Juliana 899.00)
-- Roberto Diretor (1): 0.00 (seus subordinados diretos são Fernanda e Marcos, que não têm pedidos diretos)
```

> **E para somar toda a subárvore hierárquica** (fazendo o Diretor `Roberto` acumular `8597.50` = vendas indiretas dos netos Carlos, Juliana e Patricia)? Isso exige uma **CTE Recursiva (`WITH RECURSIVE`)**, mostrada na Seção 5.2 abaixo!

---

## 3. Operadores de Conjunto (`UNION` vs `UNION ALL`)

Enquanto `JOIN` combina colunas **lado a lado** (horizontalmente), `UNION` empilha linhas de duas ou mais consultas **uma abaixo da outra** (verticalmente).

**Regras obrigatórias:**
- Mesmo número de colunas em todos os `SELECT`s e tipos compatíveis.
- Os nomes das colunas do resultado vêm sempre do **primeiro `SELECT`**.
- Um único `ORDER BY` ao final ordena todo o conjunto unido.

| Operador | Duplicatas | Performance | Quando usar |
|---|---|---|---|
| `UNION` | **Remove duplicatas** (faz sort/distinct interno) | Mais lento | Quando há sobreposição e você quer linhas únicas |
| `UNION ALL` | **Mantém tudo** (apenas concatena) | **Mais rápido** | Quando os conjuntos já são disjuntos ou duplicatas são desejadas |

```sql
-- Lista unificada de contatos (clientes + vendedores)
SELECT 'Cliente'  AS tipo, idcliente  AS id, nome, COALESCE(email, 'sem email') AS contato
FROM CLIENTE
UNION ALL
SELECT 'Vendedor' AS tipo, idvendedor AS id, nome, 'interno@ecommerce.com'      AS contato
FROM VENDEDOR
ORDER BY tipo, nome;
```

> **Nota MySQL 8.0.31+:** Versões recentes do MySQL 8.0 passaram a suportar nativamente `INTERSECT` e `EXCEPT` (além de `UNION`). Em versões anteriores, emula-se `INTERSECT` com `INNER JOIN`/`IN` e `EXCEPT` com `LEFT JOIN ... IS NULL` ou `NOT EXISTS`.

---

## 4. Subqueries (Subconsultas)

Uma **subquery** é um `SELECT` aninhado dentro de outro comando SQL.

### 4.1 Subquery Escalar (Retorna 1 linha × 1 coluna)

```sql
-- Produtos com preço acima da média do catálogo
SELECT idproduto, nome, preco_unitario
FROM PRODUTO
WHERE preco_unitario > (SELECT AVG(preco_unitario) FROM PRODUTO)
ORDER BY preco_unitario DESC;
```
> **Erro comum:** se a subquery escalar retornar mais de 1 linha para operadores como `=` ou `>`, o MySQL falha com **`ERROR 1242: Subquery returns more than 1 row`**.

### 4.2 Subquery de Lista (`IN`, `ANY`/`SOME`, `ALL`)

```sql
-- 1. IN: clientes que já fizeram pelo menos 1 pedido
SELECT idcliente, nome
FROM CLIENTE
WHERE idcliente IN (SELECT cliente_id FROM PEDIDO);

-- 2. ALL: produto(s) cujo preço é maior ou igual ao de TODOS os produtos da categoria 2
SELECT idproduto, nome, preco_unitario
FROM PRODUTO
WHERE preco_unitario >= ALL (
    SELECT preco_unitario FROM PRODUTO WHERE categoria_id = 2
);

-- 3. ANY: produto(s) mais caros que PELO MENOS UM produto da categoria 2
SELECT idproduto, nome, preco_unitario
FROM PRODUTO
WHERE preco_unitario > ANY (
    SELECT preco_unitario FROM PRODUTO WHERE categoria_id = 2
);
```

### 4.3 Subquery Correlacionada + `EXISTS` / `NOT EXISTS` (Imune a `NULL`!)

Na subquery **correlacionada**, a consulta interna referencia uma coluna da consulta externa (executando logicamente para cada linha externa).

- `EXISTS` retorna `TRUE` assim que encontra **pelo menos 1 linha** na subquery (para imediatamente — *short-circuit*).
- `NOT EXISTS` retorna `TRUE` quando **nenhuma linha** é encontrada — e **não sofre da armadilha do `NULL`** que quebra `NOT IN`!

```sql
-- Vendedores que NÃO são gerentes de ninguém (Carlos, Juliana e Patricia)
-- Comparar com o Guia 04: aqui NOT EXISTS funciona perfeitamente mesmo havendo gerente_id NULL!
SELECT v.idvendedor, v.nome
FROM VENDEDOR v
WHERE NOT EXISTS (
    SELECT 1
    FROM VENDEDOR sub
    WHERE sub.gerente_id = v.idvendedor
);

-- Clientes que fizeram pelo menos 1 pedido acima de R$ 1.000,00
SELECT c.idcliente, c.nome
FROM CLIENTE c
WHERE EXISTS (
    SELECT 1
    FROM PEDIDO p
    WHERE p.cliente_id = c.idcliente
      AND p.total_pedido > 1000.00
);
```

### 4.4 Tabela Derivada no `FROM` (Alias Obrigatório no MySQL!)

```sql
-- Média de faturamento por cliente (apenas entre clientes que compraram)
-- ATENÇÃO: no MySQL, omitir "AS resumo" gera ERROR 1248: Every derived table must have its own alias
SELECT ROUND(AVG(resumo.total_cliente), 2) AS ticket_medio_por_cliente
FROM (
    SELECT cliente_id, SUM(total_pedido) AS total_cliente
    FROM PEDIDO
    GROUP BY cliente_id
) AS resumo;
```

---

## 5. CTEs (`WITH`) e `WITH RECURSIVE` (MySQL 8.0+)

### 5.1 CTE Não Recursiva (`WITH`)

Uma **CTE (*Common Table Expression*)** define uma tabela temporária nomeada válida apenas durante aquela query. Substitui subqueries aninhadas no `FROM`, melhora muito a legibilidade e permite filtrar resultados de **Window Functions** (visto no [Guia 05](./05-agregacao-groupby-e-window-functions.md)).

```sql
-- Top 1 produto mais caro de cada categoria usando CTE + ROW_NUMBER()
WITH ProdutosRanqueados AS (
    SELECT
        p.categoria_id,
        c.nome AS categoria,
        p.idproduto,
        p.nome AS produto,
        p.preco_unitario,
        ROW_NUMBER() OVER (
            PARTITION BY p.categoria_id
            ORDER BY p.preco_unitario DESC, p.idproduto ASC
        ) AS rn
    FROM PRODUTO p
    INNER JOIN CATEGORIA c ON p.categoria_id = c.idcategoria
)
SELECT categoria, idproduto, produto, preco_unitario
FROM ProdutosRanqueados
WHERE rn = 1
ORDER BY categoria;
```

### 5.2 CTE Recursiva (`WITH RECURSIVE`) — Árvore Completa de `VENDEDOR`

Uma CTE recursiva possui duas partes unidas por `UNION ALL`:
1. **Membro âncora:** caso base (ex.: o nó raiz `gerente_id IS NULL`).
2. **Membro recursivo:** referencia a própria CTE para avançar um nível por iteração até não retornar mais linhas (protegido por `cte_max_recursion_depth`, padrão `1000` no MySQL).

#### Exemplo 1: Percorrendo o Organograma Completo (Nível e Caminho Hierárquico)

```sql
WITH RECURSIVE Organograma AS (
    -- Âncora: Diretoria (nível 1)
    SELECT
        idvendedor,
        nome,
        gerente_id,
        1 AS nivel,
        CAST(nome AS CHAR(300)) AS caminho
    FROM VENDEDOR
    WHERE gerente_id IS NULL

    UNION ALL

    -- Recursão: subordinados de cada nível
    SELECT
        v.idvendedor,
        v.nome,
        v.gerente_id,
        o.nivel + 1 AS nivel,
        CONCAT(o.caminho, ' -> ', v.nome) AS caminho
    FROM VENDEDOR v
    INNER JOIN Organograma o ON v.gerente_id = o.idvendedor
)
SELECT idvendedor, nivel, nome, caminho
FROM Organograma
ORDER BY caminho;
```

#### Exemplo 2: Total de Vendas da Subárvore Completa de Cada Líder (Diretor + Gerentes + Vendedores)

```sql
WITH RECURSIVE Hierarquia AS (
    -- Cada vendedor é raiz de sua própria subárvore
    SELECT idvendedor AS raiz_id, idvendedor AS membro_id
    FROM VENDEDOR

    UNION ALL

    -- Expande descendentes diretos e indiretos (filhos, netos...)
    SELECT h.raiz_id, v.idvendedor AS membro_id
    FROM Hierarquia h
    INNER JOIN VENDEDOR v ON v.gerente_id = h.membro_id
)
SELECT
    lider.idvendedor,
    lider.nome                         AS vendedor_ou_lider,
    COUNT(p.idpedido)                  AS pedidos_na_subarvore,
    COALESCE(SUM(p.total_pedido), 0.00) AS total_vendas_subarvore
FROM VENDEDOR lider
INNER JOIN Hierarquia h ON lider.idvendedor = h.raiz_id
LEFT  JOIN PEDIDO     p ON p.vendedor_id    = h.membro_id
GROUP BY lider.idvendedor, lider.nome
ORDER BY total_vendas_subarvore DESC, lider.idvendedor ASC;
-- Resultado na base canônica:
-- Roberto Diretor (1): 8597.50 (todos os 4 pedidos da empresa!)
-- Marcos Gerente  (5): 4999.70 (1 pedido via Patricia)
-- Patricia        (6): 4999.70 (1 pedido próprio)
-- Fernanda Gerente(2): 3597.80 (3 pedidos via Carlos e Juliana)
-- Carlos          (3): 2698.80 (2 pedidos próprios)
-- Juliana         (4):  899.00 (1 pedido próprio)
```

---

## Cola Rápida de Prova (`06`)

- **`INNER JOIN`:** interseção pelo predicado `ON`. Descarta quem não tem par.
- **`LEFT JOIN`:** preserva todos da esquerda (`0.00` com `COALESCE`). **Nunca** filtre colunas opcionais da direita no `WHERE` — coloque no `ON`!
- **Anti-Join:** `LEFT JOIN T2 ... WHERE T2.pk IS NULL` encontra quem não tem correspondência.
- **`FULL OUTER JOIN`:** não existe nativo no MySQL; emule com `LEFT JOIN ... UNION ALL ... RIGHT JOIN ... WHERE esq.pk IS NULL`.
- **`SELF JOIN`:** dois aliases diferentes na mesma tabela + `LEFT JOIN` para não perder a raiz (`NULL`).
- **`UNION` vs `UNION ALL`:** `UNION` remove duplicatas (mais caro); `UNION ALL` mantém tudo (mais rápido).
- **`NOT EXISTS` vs `NOT IN`:** prefira `NOT EXISTS` em subqueries porque `NOT IN` retorna **vazio** se houver qualquer `NULL`.
- **Tabela derivada no `FROM`:** sempre dê um alias (`AS sub`), senão dá **`ERROR 1248`**.
- **CTE (`WITH` / `WITH RECURSIVE`):** âncora + `UNION ALL` + passo recursivo para hierarquias como `VENDEDOR`.
