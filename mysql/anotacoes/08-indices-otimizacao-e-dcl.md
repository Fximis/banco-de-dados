# 08 — Índices, Otimização (`EXPLAIN`) e DCL (MySQL 8.x)

> **Navegação:** [← Anterior: Views, Procedures, Functions e Triggers](./07-views-procedures-functions-e-triggers.md) | [Índice MySQL](../README.md) | [Exercícios: Lista ECOMMERCE →](../exercicios/02-lista-ecommerce-completa.md)
> **Base utilizada:** Exemplos construídos sobre o schema canônico **`ECOMMERCE`** (`CATEGORIA`, `PRODUTO`, `CLIENTE`, `VENDEDOR`, `PEDIDO`, `ITEMPEDIDO`).

Este guia fecha a trilha de MySQL 8.x com **performance física** (índices B-Tree, `EXPLAIN` e `EXPLAIN ANALYZE`) e **segurança / controle de acesso** (DCL: usuários, privilégios e *roles* no MySQL 8).

---

## 1. Índices no MySQL (`InnoDB`)

Um **índice** é uma estrutura auxiliar (por padrão **B-Tree**, árvore balanceada) que permite localizar linhas rapidamente sem precisar ler a tabela inteira (*Full Table Scan*).

### 1.1 Índice Clusterizado vs Índice Secundário no InnoDB

No mecanismo **InnoDB** (padrão do MySQL 8.x), existe uma diferença arquitetural essencial:

| Tipo | O que é | O que fica armazenado na folha da B-Tree | Consequência prática |
|---|---|---|---|
| **Índice Clusterizado (*Clustered Index*)** | É a própria **`PRIMARY KEY`** da tabela (ou o primeiro `UNIQUE NOT NULL` se não houver PK). | **A linha inteira da tabela** (todas as colunas). | Buscar pela PK faz **1 única pesquisa** na árvore! |
| **Índice Secundário (*Secondary Index*)** | Qualquer `INDEX` ou `UNIQUE` que não seja a PK. | O valor da(s) coluna(s) indexada(s) + **o valor da `PRIMARY KEY`** (como ponteiro). | Se a query pedir colunas fora do índice, o InnoDB faz *double lookup* (vai no índice secundário achar a PK e depois busca a linha no índice clusterizado). |

> **Covering Index (`Using index`):** Quando todas as colunas usadas no `SELECT`, `WHERE` e `ORDER BY` já estão presentes dentro do próprio índice secundário (ou na PK), o InnoDB **nem toca na tabela principal**! No `EXPLAIN`, isso aparece como `Extra: Using index`.

### 1.2 Criando, Listando e Removendo Índices

```sql
USE ECOMMERCE;

-- Índice simples
CREATE INDEX idx_pedido_data ON PEDIDO (data_pedido);

-- Índice composto (ordem das colunas importa!)
CREATE INDEX idx_pedido_cliente_data ON PEDIDO (cliente_id, data_pedido);

-- Índice único (criado automaticamente por constraints UNIQUE)
CREATE UNIQUE INDEX uq_produto_nome ON PRODUTO (nome);

-- Índice FULLTEXT (para buscas textuais com MATCH(...) AGAINST(...))
CREATE FULLTEXT INDEX ft_produto_nome ON PRODUTO (nome);

-- Inspecionar índices de uma tabela
SHOW INDEX FROM PEDIDO;

-- Remover índice
DROP INDEX idx_pedido_data ON PEDIDO;
```

### 1.3 Regra do Prefixo Mais à Esquerda (*Leftmost Prefix Rule*)

Em um índice composto `(col_A, col_B, col_C)`, o MySQL ordena primeiro por `col_A`, depois por `col_B`, depois por `col_C`. Por isso, o índice só é aproveitado a partir da **primeira coluna à esquerda**:

Considerando `CREATE INDEX idx_pedido_cli_vend_data ON PEDIDO (cliente_id, vendedor_id, data_pedido)`:

| Condição no `WHERE` | Usa o índice composto? | Motivo |
|---|---|---|
| `WHERE cliente_id = 1` | ✅ **Sim** | Prefixo `col_A`. |
| `WHERE cliente_id = 1 AND vendedor_id = 3` | ✅ **Sim** | Prefixo `(col_A, col_B)`. |
| `WHERE cliente_id = 1 AND vendedor_id = 3 AND data_pedido = '2026-08-15'` | ✅ **Sim** | Todas as 3 colunas em sequência. |
| `WHERE cliente_id = 1 AND data_pedido >= '2026-08-01'` | ⚠️ **Parcial** | Usa `cliente_id` pelo índice (para `vendedor_id` faltante, não aproveita `data_pedido` no range completo). |
| `WHERE vendedor_id = 3` | ❌ **Não** (para esse índice composto) | Pulou `cliente_id` (`col_A`)! |
| `WHERE data_pedido = '2026-08-15'` | ❌ **Não** (para esse índice composto) | Pulou `cliente_id` e `vendedor_id`! |

### 1.4 Quando o Índice NÃO é Usado (Pegadinhas Clássicas!)

Mesmo existindo um índice na coluna, o otimizador do MySQL **deixa de usá-lo** (ou faz *scan* completo) nestes cenários:

1. **Aplicar função ou cálculo na coluna do `WHERE` (predicado não-sargável):**
   ```sql
   -- RUIM: função YEAR() na coluna impede uso direto da B-Tree em data_pedido
   SELECT * FROM PEDIDO WHERE YEAR(data_pedido) = 2026;

   -- BOM: intervalo sargável preserva o índice!
   SELECT * FROM PEDIDO
   WHERE data_pedido >= '2026-01-01' AND data_pedido < '2027-01-01';
   ```
2. **`LIKE` começando com curinga `%`:**
   ```sql
   -- RUIM: não sabe por qual letra começar na B-Tree -> Full Scan
   SELECT * FROM PRODUTO WHERE nome LIKE '%Gamer%';

   -- BOM: prefixo fixo consegue usar B-Tree (range scan)
   SELECT * FROM PRODUTO WHERE nome LIKE 'Mouse%';
   ```
   *(Para busca por palavras no meio de textos longos, use índice `FULLTEXT` com `MATCH(col) AGAINST('termo')`.)*
3. **Conversão implícita de tipo:**
   ```sql
   -- RUIM: cpf é VARCHAR(14), mas recebeu número! MySQL converte cada linha para número e anula o índice.
   SELECT * FROM CLIENTE WHERE cpf = 12345678901;

   -- BOM: comparar string com string
   SELECT * FROM CLIENTE WHERE cpf = '12345678901';
   ```
4. **Tabela muito pequena ou baixa seletividade:** se uma tabela tem só 4 ou 6 linhas (como o seed didático do `ECOMMERCE`), ou se um filtro retorna ~80% da tabela, ler a tabela inteira sequencialmente (`ALL`) é mais rápido do que navegar na B-Tree.
5. **Negação (`!=`, `<>`, `NOT IN`) ou `OR` entre coluna indexada e coluna sem índice.**

### 1.5 Trade-offs dos Índices

- **Benefícios:** acelera drasticamente `SELECT` com `WHERE`, `JOIN ... ON`, `ORDER BY`, `GROUP BY` e `MIN`/`MAX`.
- **Custos:** cada índice adicional ocupa memória/disco e deixa **`INSERT`, `UPDATE` e `DELETE` mais lentos**, pois o InnoDB precisa atualizar todas as B-Trees afetadas. **Não indexe todas as colunas indiscriminadamente!**

---

## 2. Análise de Queries com `EXPLAIN` e `EXPLAIN ANALYZE`

Antes de colocar uma query lenta em produção (ou para responder questões de otimização), execute `EXPLAIN` antes da consulta:

```sql
EXPLAIN
SELECT p.idpedido, p.data_pedido, p.total_pedido
FROM PEDIDO p
WHERE p.cliente_id = 1
  AND p.data_pedido >= '2026-08-01';
```

### 2.1 Como Ler as Colunas do `EXPLAIN`

| Coluna | O que significa |
|---|---|
| **`type`** | Método de acesso às linhas (**quanto mais acima na tabela abaixo, melhor**). |
| **`possible_keys`** | Índices que o otimizador considerou usar. |
| **`key`** | Índice efetivamente escolhido (`NULL` = não usou nenhum índice). |
| **`key_len`** | Quantos bytes do índice foram usados (útil para saber quantas colunas de um índice composto entraram!). |
| **`rows`** | Estimativa de quantas linhas serão examinadas. |
| **`filtered`** | Percentual estimado de linhas que sobrevivem ao filtro `WHERE`. |
| **`Extra`** | Informações adicionais importantes (`Using index`, `Using where`, `Using filesort`, `Using temporary`). |

### 2.2 Escala de `type` (do Melhor ao Pior)

1. **`system` / `const`**: busca por `PRIMARY KEY` ou `UNIQUE` com constante (`WHERE idcliente = 1`) — lê no máximo **1 linha**.
2. **`eq_ref`**: `JOIN` por PK ou `UNIQUE NOT NULL` (1 linha encontrada para cada linha anterior).
3. **`ref`**: busca por índice não-único (ex.: FK `WHERE cliente_id = 1`).
4. **`range`**: busca por intervalo usando índice (`BETWEEN`, `>`, `<`, `IN`, `LIKE 'abc%'`).
5. **`index`**: percorre toda a árvore do índice (mais leve que ler a tabela inteira, mas ainda varre tudo).
6. **`ALL`**: **Full Table Scan** — lê todas as linhas da tabela do começo ao fim (alerta vermelho em tabelas grandes!).

### 2.3 Significado dos Principais `Extra`

- **`Using index`:** excelente! *Covering Index* (respondeu só com o índice, sem ler a tabela).
- **`Using where`:** aplicou filtro após ler a linha/índice.
- **`Using filesort`:** precisou ordenar os resultados em memória/disco porque o `ORDER BY` não bateu com a ordem de um índice (atenção em tabelas grandes).
- **`Using temporary`:** criou tabela temporária interna (comum em `GROUP BY`/`DISTINCT` sem índice adequado).

### 2.4 `EXPLAIN ANALYZE` (MySQL 8.0.18+)

Enquanto o `EXPLAIN` tradicional apenas **estima** o plano sem rodar a query, o **`EXPLAIN ANALYZE`** **executa de verdade** a consulta e imprime o tempo real, o custo e o número real de linhas processadas em cada etapa:

```sql
EXPLAIN ANALYZE
SELECT p.idpedido, c.nome, p.total_pedido
FROM PEDIDO p
INNER JOIN CLIENTE c ON c.idcliente = p.cliente_id
WHERE c.cpf = '12345678901';
```

#### Exemplo Comparativo Antes vs Depois de um Índice em `PEDIDO`

```sql
-- 1. Antes (sem índice em data_pedido):
-- EXPLAIN mostra possible_keys = NULL, key = NULL, type = ALL
EXPLAIN
SELECT idpedido, total_pedido FROM PEDIDO WHERE data_pedido = '2026-08-20';

-- 2. Criando índice cobrindo (data_pedido, total_pedido):
CREATE INDEX idx_pedido_data_total ON PEDIDO (data_pedido, total_pedido);

-- 3. Depois:
-- EXPLAIN passa a exibir possible_keys = idx_pedido_data_total, key = idx_pedido_data_total,
-- type = ref, Extra = Using index (Covering Index!)
EXPLAIN
SELECT idpedido, total_pedido FROM PEDIDO WHERE data_pedido = '2026-08-20';
```
*(Lembrete: em tabelas minúsculas de 4 linhas, o otimizador pode escolher `ALL` por custo menor que abrir o índice — mas com um índice cobrindo ou volume real de linhas, a transição `ALL` → `ref` + `Using index` fica imediata.)*

---

## 3. DCL — Controle de Acesso e Segurança no MySQL 8.x

**DCL (*Data Control Language*)** controla **quem** pode conectar ao servidor e **o que** pode fazer em cada banco, tabela ou coluna.

### 3.1 Identidade de Usuário no MySQL (`'usuario'@'host'`)

No MySQL, um usuário é sempre identificado pelo par **`'nome'@'host'`**:
- `'ana'@'localhost'` → só conecta localmente na mesma máquina.
- `'ana'@'192.168.1.%'` → só conecta dessa sub-rede.
- `'ana'@'%'` → conecta de qualquer host remoto (cuidado com segurança!).

> **Mudança Crítica no MySQL 8.0+ (Cai em Prova!):**
> No MySQL 5.7, era comum criar usuário implicitamente dentro do próprio `GRANT ... IDENTIFIED BY`. **No MySQL 8.x isso foi REMOVIDO!**
> Tentar rodar `GRANT SELECT ON ECOMMERCE.* TO 'novo'@'localhost' IDENTIFIED BY '123';` falha com **`ERROR 1064`** ou **`ERROR 1410 (42000): You are not allowed to create a user with GRANT`**. É obrigatório criar o usuário antes com **`CREATE USER`**.

### 3.2 Ciclo Completo de Usuários (`CREATE USER`, `ALTER USER`, `DROP USER`)

```sql
-- 1. Criar usuários (sem privilégios iniciais além de USAGE = apenas conectar)
CREATE USER IF NOT EXISTS 'app_leitura'@'localhost' IDENTIFIED BY 'SenhaForte#2026';
CREATE USER IF NOT EXISTS 'app_vendas'@'localhost'  IDENTIFIED BY 'SenhaVendas#2026';

-- 2. Alterar senha ou expiração
ALTER USER 'app_leitura'@'localhost' IDENTIFIED BY 'NovaSenhaForte#2026';

-- 3. Remover usuário
DROP USER IF EXISTS 'usuario_antigo'@'localhost';
```

### 3.3 Princípio do Menor Privilégio (`GRANT`, `REVOKE`, `SHOW GRANTS`)

Nunca entregue `ALL PRIVILEGES ON *.*` para contas de aplicação! Conceda apenas o mínimo necessário:

```sql
-- Apenas leitura em todo o banco ECOMMERCE
GRANT SELECT ON ECOMMERCE.* TO 'app_leitura'@'localhost';

-- Leitura, inserção e atualização apenas nas tabelas de venda (sem DROP/ALTER/DELETE)
GRANT SELECT, INSERT, UPDATE ON ECOMMERCE.PEDIDO     TO 'app_vendas'@'localhost';
GRANT SELECT, INSERT         ON ECOMMERCE.ITEMPEDIDO TO 'app_vendas'@'localhost';
GRANT SELECT                 ON ECOMMERCE.PRODUTO    TO 'app_vendas'@'localhost';

-- Consultar privilégios concedidos
SHOW GRANTS FOR 'app_vendas'@'localhost';

-- Revogar um privilégio específico
REVOKE UPDATE ON ECOMMERCE.PEDIDO FROM 'app_vendas'@'localhost';
```

### 3.4 Roles (Papéis) no MySQL 8.x (`CREATE ROLE`)

Introduzidos no **MySQL 8.0**, os **Roles** agrupam permissões em um perfil reutilizável (em vez de repetir dezenas de `GRANT`s para cada funcionário):

```sql
-- 1. Criar os papéis (roles)
CREATE ROLE IF NOT EXISTS 'role_analista_leitura', 'role_operador_vendas';

-- 2. Conceder privilégios às roles
GRANT SELECT ON ECOMMERCE.* TO 'role_analista_leitura';
GRANT SELECT, INSERT, UPDATE ON ECOMMERCE.PEDIDO TO 'role_operador_vendas';
GRANT SELECT, INSERT ON ECOMMERCE.ITEMPEDIDO TO 'role_operador_vendas';

-- 3. Criar usuário e atribuir a role
CREATE USER IF NOT EXISTS 'carlos_bi'@'localhost' IDENTIFIED BY 'BiSenha#2026';
GRANT 'role_analista_leitura' TO 'carlos_bi'@'localhost';

-- 4. MUITO IMPORTANTE: ativar a role como padrão no login!
SET DEFAULT ROLE ALL TO 'carlos_bi'@'localhost';

-- Verificar permissões efetivas considerando a role ativa:
SHOW GRANTS FOR 'carlos_bi'@'localhost' USING 'role_analista_leitura';
```

> **Atenção na Prova — `SET DEFAULT ROLE`:** No MySQL 8.x, atribuir uma role com `GRANT 'role' TO 'user'` **não a ativa automaticamente** na próxima conexão! Se você não executar `SET DEFAULT ROLE ALL TO 'user'` (ou o usuário não rodar `SET ROLE ...` na sessão), ele conectará sem os privilégios da role!

---

## 4. Checklist Rápido de Prova & Erros Comuns

1. **`PRIMARY KEY` no InnoDB é o índice clusterizado:** armazena a linha completa nas folhas; índices secundários guardam o ponteiro da PK.
2. **Índice composto `(A, B, C)`:** `WHERE B = 1` ou `WHERE C = 1` **não** aproveitam o índice (`Leftmost Prefix Rule`).
3. **Função na coluna do `WHERE`:** `WHERE YEAR(data_pedido) = 2026` ou `WHERE UPPER(nome) = 'ANA'` **anula o índice** na maioria dos casos; reescreva com intervalos (`BETWEEN` / `>= AND <`) ou colunas indexáveis.
4. **`LIKE '%abc'`:** curinga no início impede uso da B-Tree (`ALL`). `LIKE 'abc%'` usa o índice (`range`).
5. **`EXPLAIN` (`type`):** `const` / `eq_ref` / `ref` / `range` são bons; `ALL` significa *Full Table Scan*. `Extra: Using index` significa *Covering Index*.
6. **`GRANT` no MySQL 8.x:** não cria usuário sozinho! Execute `CREATE USER` antes de `GRANT`.
7. **`CREATE ROLE`:** lembre-se de ativar com `SET DEFAULT ROLE ALL TO 'usuario'@'host'`.
8. **Par `'usuario'@'host'`:** `'ana'@'localhost'` e `'ana'@'%'` são **contas distintas** no MySQL, com senhas e privilégios independentes.

---

> **Relembre a trilha completa:**
> - [01 — Modelagem e Normalização](./01-modelagem-relacional-e-normalizacao.md)
> - [02 — DDL, Tipos de Dados e Constraints](./02-ddl-tipos-dados-e-constraints.md)
> - [07 — Views, Procedures, Functions e Triggers](./07-views-procedures-functions-e-triggers.md)
> - [Índice MySQL](../README.md)
