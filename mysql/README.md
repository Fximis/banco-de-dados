# Frente MySQL / SQL Relacional (MySQL 8.x)

> **Navegação:** [← Voltar à Raiz do Repositório](../README.md) | [Ir para Frente NoSQL / MongoDB →](../nosql/README.md)

Esta frente consolida, corrige e expande todo o conteúdo de **Modelagem Relacional** e **SQL (MySQL 8.x)** da disciplina, reunindo teoria enxuta para revisão rápida de prova, cadernos de exercícios comentados e scripts testados empiricamente.

---

## 1. Ordem Recomendada de Estudo (Trilha Progressiva)

### Etapa 1 — Fundamentos, Modelagem e DDL
1. [`anotacoes/01-modelagem-relacional-e-normalizacao.md`](anotacoes/01-modelagem-relacional-e-normalizacao.md) — MER/DER, cardinalidades, 1FN/2FN/3FN/BCNF e estudo de caso real corrigindo [`arquivos-originais/aula-cidao-qua.architect`](arquivos-originais/aula-cidao-qua.architect).
2. [`anotacoes/02-ddl-tipos-dados-e-constraints.md`](anotacoes/02-ddl-tipos-dados-e-constraints.md) — `CREATE`/`ALTER`/`DROP`/`TRUNCATE`, tipos de dados MySQL 8.x, PKs, `UNIQUE`, `CHECK`, `FOREIGN KEY` e ações em cascata.
3. [`exercicios/01-caderno-ddl-tipos-pks-fks.md`](exercicios/01-caderno-ddl-tipos-pks-fks.md) — Caderno prático completo com 65 exercícios (Blocos 1–4) + script executável.

### Etapa 2 — Manipulação, Consultas, Agregação e JOINs
4. [`anotacoes/03-dml-crud-e-transacoes.md`](anotacoes/03-dml-crud-e-transacoes.md) — `INSERT`, `UPDATE`, `DELETE`, `SQL_SAFE_UPDATES`, colunas geradas e transações ACID (`COMMIT`/`ROLLBACK`/`SAVEPOINT`).
5. [`anotacoes/04-dql-filtros-e-funcoes.md`](anotacoes/04-dql-filtros-e-funcoes.md) — `SELECT`, filtros (`BETWEEN`, `IN`, `NOT IN` + `NULL`, `LIKE`), funções de string, data, numéricas (`FORMAT(..., 'pt_BR')`) e condicionais (`IFNULL`, `COALESCE`, `CASE WHEN`).
6. [`anotacoes/05-agregacao-groupby-e-window-functions.md`](anotacoes/05-agregacao-groupby-e-window-functions.md) — `COUNT`/`SUM`/`AVG`/`MIN`/`MAX`, ordem de execução SQL, `GROUP BY` (`ONLY_FULL_GROUP_BY`), `HAVING` vs `WHERE`, `WITH ROLLUP` e Window Functions.
7. [`anotacoes/06-joins-subqueries-e-ctes.md`](anotacoes/06-joins-subqueries-e-ctes.md) — `INNER JOIN`, `LEFT`/`RIGHT JOIN`, `SELF JOIN`, `UNION`, Subqueries (`IN`/`EXISTS`), CTEs (`WITH`) e `WITH RECURSIVE`.
8. [`exercicios/02-lista-ecommerce-completa.md`](exercicios/02-lista-ecommerce-completa.md) — Base canônica `ECOMMERCE` (diagrama ER + DDL + carga completa) + 29 questões comentadas + exercício de vendas por gerente.
9. [`exercicios/03-guia-oracle-para-mysql-scott.md`](exercicios/03-guia-oracle-para-mysql-scott.md) — Auditoria linha a linha e conversão para MySQL 8.x de [`arquivos-originais/segundo-bimestre.sql`](arquivos-originais/segundo-bimestre.sql) (`scott.emp` / `scott.dept`).

### Etapa 3 — Tópicos Complementares e Produção
10. [`anotacoes/07-views-procedures-functions-e-triggers.md`](anotacoes/07-views-procedures-functions-e-triggers.md) — `VIEW`, `DELIMITER`, Stored Procedures, Stored Functions (`DETERMINISTIC`) e Triggers (`NEW`/`OLD`, `SIGNAL`).
11. [`anotacoes/08-indices-otimizacao-e-dcl.md`](anotacoes/08-indices-otimizacao-e-dcl.md) — Índices B-Tree (clusterizado vs secundário, leftmost prefix), leitura de `EXPLAIN`/`EXPLAIN ANALYZE` e DCL (`CREATE USER`, `GRANT`, `REVOKE`, `ROLE`).

---

## 2. Mapeamento: Arquivos Legados → Nova Estrutura (`mysql/`)

| Origem Legada | Destino(s) em `mysql/` | Tratamento Aplicado |
|---|---|---|
| `README.md` (raiz original, SQL `02-09`) | [`exercicios/02-lista-ecommerce-completa.md`](exercicios/02-lista-ecommerce-completa.md) | Realocado (R4) com diagrama ER, `INSERT`s unificados, tabela `VENDEDOR` e gabarito comentado das 29 questões |
| `exc` | [`anotacoes/02-ddl-tipos-dados-e-constraints.md`](anotacoes/02-ddl-tipos-dados-e-constraints.md) e [`exercicios/01-caderno-ddl-tipos-pks-fks.md`](exercicios/01-caderno-ddl-tipos-pks-fks.md) | Corrigidos tipos (`nota DECIMAL(4,2)`, `percentual DECIMAL(5,2)`, `porta SMALLINT UNSIGNED`, `notificacao`) e adicionadas PKs em todas as 35 tabelas |
| `Anotações de coisas que fui errando.md` | [`anotacoes/02-ddl-tipos-dados-e-constraints.md`](anotacoes/02-ddl-tipos-dados-e-constraints.md), [`anotacoes/03-dml-crud-e-transacoes.md`](anotacoes/03-dml-crud-e-transacoes.md) e [`exercicios/01-caderno-ddl-tipos-pks-fks.md`](exercicios/01-caderno-ddl-tipos-pks-fks.md) | Corrigidos bugs de `CHECK` (`IN` com `or`, `recomenda = 'S' or 'N'`), documentadas limitações de `TRUNCATE` com FK e completado Bloco 4 (`51–65`) |
| `Aula 26-08 DDL` | [`anotacoes/02`](anotacoes/02-ddl-tipos-dados-e-constraints.md), [`03`](anotacoes/03-dml-crud-e-transacoes.md), [`04`](anotacoes/04-dql-filtros-e-funcoes.md), [`05`](anotacoes/05-agregacao-groupby-e-window-functions.md), [`06`](anotacoes/06-joins-subqueries-e-ctes.md) e [`exercicios/02`](exercicios/02-lista-ecommerce-completa.md) | Eliminadas ~200 linhas duplicadas de `08/09` vs `15/09`, corrigidos bugs de nomes de colunas (`valor_estoque`, `idproduto`, `LEFT JOIN` em `VENDEDOR`) e unificada a base `ECOMMERCE` |
| `Aula 26-8 DML` | [`anotacoes/03-dml-crud-e-transacoes.md`](anotacoes/03-dml-crud-e-transacoes.md) e [`anotacoes/04-dql-filtros-e-funcoes.md`](anotacoes/04-dql-filtros-e-funcoes.md) | Corrigidos erros de omissão do operador `IN` (`WHERE categoria_id IN (1,2)`), troca de `preco`/`estoque` em `Camiseta`, comentário de `NOT BETWEEN` e adicionados `UPDATE`/`DELETE`/Transações |
| `segundo-bimestre.sql` | [`arquivos-originais/segundo-bimestre.sql`](arquivos-originais/segundo-bimestre.sql) + [`exercicios/03-guia-oracle-para-mysql-scott.md`](exercicios/03-guia-oracle-para-mysql-scott.md) | **Original preservado intacto (R1)**; erros corrigidos (`;` antes do `HAVING`, espaço antes do parêntese em `COUNT(e.empno)`, aliases) e dataset `scott` portado para MySQL 8.x |
| `aula cidao qua.architect` | [`arquivos-originais/aula-cidao-qua.architect`](arquivos-originais/aula-cidao-qua.architect) + [`anotacoes/01-modelagem-relacional-e-normalizacao.md`](anotacoes/01-modelagem-relacional-e-normalizacao.md) | Arquivo binário/XML preservado intacto; violações de 1FN/3FN diagnosticadas e schema normalizado em `anotacoes/01` |

---

## 3. Cola Rápida (Cheat Sheet de Prova — MySQL 8.x)

### DDL & Constraints
```sql
CREATE TABLE EXEMPLO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo CHAR(6) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'Ativo',
    pai_id INT NULL,
    CONSTRAINT uq_exemplo_codigo UNIQUE (codigo),
    CONSTRAINT ck_exemplo_preco CHECK (preco > 0),
    CONSTRAINT ck_exemplo_status CHECK (status IN ('Ativo', 'Inativo')),
    CONSTRAINT fk_exemplo_pai FOREIGN KEY (pai_id) REFERENCES EXEMPLO(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);
```
- **Atenção:** `CHECK` é imposto desde o MySQL **8.0.16**; se a coluna aceitar `NULL`, o `CHECK` deixa `NULL` passar (`UNKNOWN`).
- **`DELETE` vs `TRUNCATE` vs `DROP`:** `DELETE` é DML (aceita `WHERE` e `ROLLBACK`, não reseta `AUTO_INCREMENT`); `TRUNCATE` é DDL (reseta `AUTO_INCREMENT`, não aceita `ROLLBACK`, **falha com `ERROR 1701` se houver FK apontando para a tabela**); `DROP` remove a estrutura inteira.

### DML & Transações
```sql
START TRANSACTION;
    INSERT INTO PEDIDO (cliente_id, vendedor_id, data_pedido, total_pedido)
    VALUES (1, 3, CURDATE(), 149.90);
    UPDATE PRODUTO SET estoque = estoque - 1 WHERE idproduto = 1;
COMMIT; -- ou ROLLBACK; em caso de erro
```

### DQL: Ordem de Escrita vs. Ordem de Execução
- **Escrita:** `SELECT` → `FROM` → `JOIN` → `WHERE` → `GROUP BY` → `HAVING` → `ORDER BY` → `LIMIT`
- **Execução lógica:** `FROM / JOIN` → `WHERE` *(filtra linhas)* → `GROUP BY` → `HAVING` *(filtra grupos)* → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`
- **Funções-chave:** `COALESCE(a, 'padrão')`, `CONCAT(...)`, `DATE_FORMAT(dt, '%d/%m/%Y')`, `DATEDIFF(d1, d2)`, `FORMAT(val, 2, 'pt_BR')`, `CASE WHEN ... THEN ... ELSE ... END`.
- **Armadilhas:** `REPLACE()` é case-sensitive; `NOT IN` retorna vazio se houver `NULL` na lista; `CONCAT` com `NULL` retorna `NULL`.

### JOINs, Agregação & Window Functions
- **`INNER JOIN`**: somente pares que satisfazem `ON`.
- **`LEFT JOIN`**: mantém todas as linhas da tabela à esquerda (use com `COALESCE(SUM(...), 0)` quando quiser incluir registros sem movimento, como vendedores com `0` vendas!).
- **`ONLY_FULL_GROUP_BY`:** toda coluna não agregada do `SELECT` deve estar no `GROUP BY` (ou depender funcionalmente da PK agrupada — prefira `GROUP BY tabela.pk, tabela.nome`).
- **Window Function:** `ROW_NUMBER() OVER (PARTITION BY categoria_id ORDER BY preco_unitario DESC)`.

---

## 4. Aviso de Preservação (Requisito R1)

Os arquivos dentro de [`arquivos-originais/`](arquivos-originais/) (`segundo-bimestre.sql` e `aula-cidao-qua.architect`) são **preservados integralmente sem alterações** para manter a rastreabilidade histórica do repositório original (`main`). Todas as correções e versões executáveis em MySQL 8.x residem em `anotacoes/` e `exercicios/`.
