# 03 — DML (CRUD) e Transações (ACID)

> **Base utilizada neste guia:** Esquema canônico **`ECOMMERCE`** (MySQL 8.x), consolidado e livre de erros.  
> Para o script completo de criação e carga inicial (`CREATE DATABASE` + `CREATE TABLE` + `ALTER TABLE` + `INSERT`s), consulte **[`../exercicios/02-lista-ecommerce-completa.md`](../exercicios/02-lista-ecommerce-completa.md)**.  
> Para regras de DDL (`CREATE`, `ALTER`, `DROP`, `TRUNCATE`) e constraints, consulte **[`./02-ddl-tipos-dados-e-constraints.md`](./02-ddl-tipos-dados-e-constraints.md)**.

---

## 1. O que é DML e o Ciclo CRUD

**DML (*Data Manipulation Language*)** é o subconjunto da SQL responsável por manipular os **dados** armazenados dentro das tabelas já criadas pelo DDL. Ela corresponde diretamente às operações **CRUD**:

| Operação CRUD | Comando SQL | O que faz | Guia correspondente |
|---|---|---|---|
| **C**reate | `INSERT` | Insere novos registros na tabela | Este guia (Seção 2) |
| **R**ead | `SELECT` | Consulta e projeta registros | [Guia 04 — DQL, Filtros e Funções](./04-dql-filtros-e-funcoes.md) |
| **U**pdate | `UPDATE` | Atualiza valores de registros existentes | Este guia (Seção 3) |
| **D**elete | `DELETE` | Remove registros da tabela | Este guia (Seção 4) |

### Padrão de Nomenclatura e Armadilhas de Sintaxe (Para Prova)

1. **Case-sensitivity (`lower_case_table_names=0`):** Em servidores Linux/Docker, os nomes das tabelas diferenciam maiúsculas de minúsculas. Como o banco `ECOMMERCE` cria tabelas em **MAIÚSCULAS** (`CATEGORIA`, `PRODUTO`, `CLIENTE`, `VENDEDOR`, `PEDIDO`, `ITEMPEDIDO`) e colunas em **minúsculas**, escreva sempre o nome exatamente igual ao `CREATE TABLE`. Escrever `FROM produto` ou `UPDATE cliente` falha com **`ERROR 1146: Table 'ecommerce.produto' doesn't exist`** em ambientes case-sensitive.
2. **Aspas no MySQL:**
   - **Valores de texto/data:** usam aspas simples (`'Ana Silva'`, `'2026-08-15'`).
   - **Identificadores (tabelas/colunas):** não usam aspas duplas (no modo padrão sem `ANSI_QUOTES`, `INSERT INTO "CATEGORIA"` gera **`ERROR 1064`**). Se precisar escapar um identificador, use crases (`` `CATEGORIA` ``).
3. **Ponto e vírgula (`;`):** Toda instrução SQL independente deve terminar com `;`. Omitir `;` entre dois comandos seguidos gera **`ERROR 1064 (syntax error)`**.
4. **Ordem de execução:** Executar `SELECT * FROM PRODUTO;` antes dos `INSERT`s retorna conjunto vazio (*Empty set*). Em tabelas com `FOREIGN KEY`, sempre insira primeiro os registros da tabela **pai** (`CATEGORIA`, `CLIENTE`, `VENDEDOR`) e depois os da tabela **filha** (`PRODUTO`, `PEDIDO`, `ITEMPEDIDO`).

---

## 2. `INSERT` — Inserção de Dados

### 2.1 `INSERT` Único (Com Lista de Colunas, `AUTO_INCREMENT` e `DEFAULT`)

**Boa prática absoluta:** sempre informe explicitamente a lista de colunas após `INSERT INTO TABELA (...)`. Isso protege o código caso a ordem das colunas mude no futuro e permite aproveitar valores `DEFAULT` e `AUTO_INCREMENT`.

```sql
USE ECOMMERCE;

-- CATEGORIA tem idcategoria AUTO_INCREMENT: omitimos a coluna da PK
INSERT INTO CATEGORIA (nome) VALUES ('Eletronicos');
INSERT INTO CATEGORIA (nome) VALUES ('Perifericos');

-- CLIENTE tem status DEFAULT 'Ativo': ao omitir 'status', o MySQL preenche 'Ativo'
INSERT INTO CLIENTE (idcliente, nome, cpf, email)
VALUES (1, 'Ana Silva', '12345678901', 'ana@email.com');

-- PRODUTO e ITEMPEDIDO com todas as colunas informadas explicitamente
INSERT INTO PRODUTO (idproduto, nome, preco_unitario, estoque, categoria_id)
VALUES (1, 'Mouse Gamer RGB', 149.90, 50, 1);
```

> **Atenção na prova (`INSERT` posicional sem colunas):**
> `INSERT INTO CLIENTE VALUES (1, 'Ana Silva', ...);` exige que você informe **todas** as colunas na ordem exata da tabela (inclusive colunas `AUTO_INCREMENT` como `NULL` ou `0`, e colunas `DEFAULT` passando a palavra-chave `DEFAULT`). Sempre prefira listar as colunas!

### 2.2 `INSERT` Múltiplo (Bulk Insert)

Inserir várias tuplas em um único comando reduz chamadas de rede, reduz sobrecarga de transações e torna a inserção atômica por instrução (ou todas entram, ou o comando inteiro falha se houver erro em uma das linhas).

```sql
INSERT INTO CATEGORIA (nome) VALUES
    ('Hardware'),
    ('Cadeiras Gamer'),
    ('Notebooks');

INSERT INTO CLIENTE (idcliente, nome, cpf, email, status) VALUES
    (2, 'Carlos Souza',   '98765432100', 'carlos@email.com',     'Ativo'),
    (3, 'Beatriz Lima',   '11122233344', 'bia.lima@email.com',   'Inativo'),
    (4, 'Joao Paulo',     '55566677788', 'joao.paulo@email.com', 'Ativo'),
    (5, 'Maria Oliveira', '99988877766', 'maria@email.com',      'Ativo'),
    (6, 'Fernanda Costa', '44455566677', NULL,                   'Ativo');
```

### 2.3 Erros Clássicos no `INSERT` (Casos Reais Corrigidos)

#### Caso 1 — Inversão posicional de `preco_unitario` e `estoque` (Caso `Camiseta`)
Nas anotações originais de DML, ao cadastrar o produto `'Camiseta'` (`R$ 50,99`, `20` unidades em estoque, categoria `3`), os valores numéricos foram invertidos:

```sql
-- ERRADO (inverteu preco_unitario com estoque):
-- preco_unitario recebe 20.00 e estoque (INT) trunca/arredonda 50.99 para 51 silenciosamente!
INSERT INTO PRODUTO (idproduto, nome, preco_unitario, estoque, categoria_id)
VALUES (5, 'Camiseta', 20, 50.99, 3);

-- CORRETO (idproduto livre, ex.: 7, ou 5 em base vazia; preco=50.99, estoque=20):
INSERT INTO PRODUTO (idproduto, nome, preco_unitario, estoque, categoria_id)
VALUES (7, 'Camiseta', 50.99, 20, 3);
```

> **Por que isso é perigoso?** Não gera erro de execução! O MySQL aceita `20` no `DECIMAL(10,2)` (`20.00`) e converte `50.99` para o inteiro `51` (emitindo apenas um *warning* ou arredondando), corrompendo silenciosamente o preço e o estoque.

#### Caso 2 — Violação de `CHECK` (`ERROR 3819`)
A tabela `PRODUTO` possui `CHECK (preco_unitario > 0)`. Tentar inserir preço negativo ou zero falha imediatamente:

```sql
-- FALHA PROPOSITAL: ERROR 3819 (HY000): Check constraint 'produto_preco_unitario_ck' is violated.
-- (E exige que categoria_id = 1 já exista na tabela CATEGORIA)
INSERT INTO PRODUTO (idproduto, nome, preco_unitario, estoque, categoria_id)
VALUES (100, 'Produto Teste', -50.00, 10, 1);
```

#### Caso 3 — Violação de `FOREIGN KEY` (`ERROR 1452`)
Se você tentar inserir um pedido para um `cliente_id` que não existe em `CLIENTE` (ex.: `cliente_id = 10` antes de cadastrar o cliente `10`):

```sql
-- FALHA se idcliente = 10 ainda não existir em CLIENTE:
-- ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails
-- (`ecommerce`.`pedido`, CONSTRAINT `cliente_pedido_fk` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`idcliente`))
INSERT INTO PEDIDO (cliente_id, data_pedido, total_pedido)
VALUES (10, '2025-11-01', 9000.00);

-- CORREÇÃO: cadastre o cliente 10 antes (ou use um idcliente já existente, como 1, 2 ou 4):
INSERT INTO CLIENTE (idcliente, nome, cpf, email)
VALUES (10, 'Lucas Mendes', '12312312312', 'lucas@email.com');

INSERT INTO PEDIDO (cliente_id, data_pedido, total_pedido)
VALUES (10, '2025-11-01', 9000.00);
```

#### Caso 4 — Tamanho de `cpf` (`ERROR 1406`)
Se a coluna fosse `VARCHAR(12)`, inserir um CPF formatado (`'000.000.000-00'`, 14 caracteres) geraria **`ERROR 1406: Data too long for column 'cpf'`**. No contrato canônico, `cpf` usa `VARCHAR(14)` para suportar ambos os formatos (11 dígitos puros ou formatado com pontos e hífen).

### 2.4 Recursos Avançados de `INSERT` (MySQL)

#### `INSERT IGNORE` (Ignora falhas convertendo em warnings)
```sql
-- Se idcliente = 1 já existir (PK duplicada), não aborta o comando inteiro;
-- insere apenas as linhas válidas e gera warning para a duplicada.
INSERT IGNORE INTO CLIENTE (idcliente, nome, cpf, email) VALUES
    (1, 'Ana Duplicada', '12345678901', 'ana@email.com'),
    (11, 'Rafael Nunes', '22233344455', 'rafael@email.com');
```
> **Cuidado:** `INSERT IGNORE` também ignora violações de `CHECK`, `UNIQUE` e `NOT NULL` (convertendo para valor padrão do tipo). Use apenas quando ignorar duplicatas for realmente o comportamento desejado.

#### `ON DUPLICATE KEY UPDATE` (Upsert — Insere ou Atualiza)
Quando uma linha colide com `PRIMARY KEY` ou `UNIQUE`, o MySQL executa o `UPDATE` em vez de falhar:

```sql
-- Se o item (pedido_id=1, produto_id=1) já existir, soma a quantidade; senão, insere!
INSERT INTO ITEMPEDIDO (pedido_id, produto_id, quantidade, preco_unitario)
VALUES (1, 1, 2, 149.90) AS novo
ON DUPLICATE KEY UPDATE
    quantidade = ITEMPEDIDO.quantidade + novo.quantidade;
```
> **Nota MySQL 8.0.20+:** A sintaxe `VALUES(...) AS novo` com alias de linha substitui a antiga função `VALUES(quantidade)` dentro do `ON DUPLICATE KEY UPDATE`, que está depreciada no MySQL 8.x.

#### `INSERT INTO ... SELECT` (Inserção a partir de consulta)
```sql
-- Copia produtos em promoção ou popula uma tabela auxiliar de auditoria/histórico
INSERT INTO CATEGORIA (nome)
SELECT CONCAT(nome, ' - Outlet')
FROM CATEGORIA
WHERE idcategoria = 1;
```

---

## 3. `UPDATE` — Atualização de Registros

### 3.1 Sintaxe e Exemplos Seguros

```sql
UPDATE NOME_TABELA
SET coluna1 = novo_valor1,
    coluna2 = novo_valor2
WHERE condicao;
```

> **Regra de ouro:** **Nunca execute `UPDATE` sem `WHERE`**, a menos que sua intenção explícita seja alterar **todas** as linhas da tabela. Antes de rodar o `UPDATE` (ou `DELETE`), faça um `SELECT` com o mesmo `WHERE` para conferir exatamente quais linhas serão afetadas!

Exemplos aplicados à base `ECOMMERCE`:

```sql
-- 1. Padronizar email para minúsculo de um cliente específico
UPDATE CLIENTE
SET email = LOWER(email)
WHERE idcliente = 3;

-- 2. Associar vendedores aos pedidos (correção: pedidos 1 e 2 são do vendedor 3, Carlos Vendedor)
UPDATE PEDIDO
SET vendedor_id = 3
WHERE idpedido IN (1, 2);

UPDATE PEDIDO
SET vendedor_id = 4
WHERE idpedido = 3;

UPDATE PEDIDO
SET vendedor_id = 6
WHERE idpedido = 4;

-- 3. Conferir e atualizar quantidade de um item com PK composta
SELECT * FROM ITEMPEDIDO WHERE pedido_id = 1 AND produto_id = 2;

UPDATE ITEMPEDIDO
SET quantidade = 3
WHERE pedido_id = 1 AND produto_id = 2;
```

> **Atenção à consistência `PEDIDO.total_pedido` vs `ITEMPEDIDO`:**
> Na base canônica, o Pedido 1 inicia com `total_pedido = 499.90` (`149.90 + 350.00`) e o Pedido 4 com `4999.70` (`4500.00 + 199.90 + 2 * 149.90`), corrigindo os valores inconsistentes das anotações originais (`299.80` e `5499.80`).  
> Se você alterar `ITEMPEDIDO.quantidade` para `3` no item `(1, 2)`, lembre-se de recalcular `PEDIDO.total_pedido` (idealmente dentro de uma transação!) para que o cabeçalho do pedido não fique desatualizado (`499.90` vs `1199.90`).

### 3.2 Armadilha do `SQL_SAFE_UPDATES` (`ERROR 1175`)

No MySQL Workbench, a variável `SQL_SAFE_UPDATES` vem ativada por padrão (`1`). Nesse modo, o MySQL **bloqueia** qualquer `UPDATE` ou `DELETE` que não utilize uma coluna de chave (`PRIMARY KEY` ou `INDEX`) no `WHERE` ou um `LIMIT`:

```sql
-- Coluna sem índice (ex.: estoque ou nome) ou ausência de WHERE com SQL_SAFE_UPDATES = 1:
UPDATE PRODUTO SET preco_unitario = preco_unitario * 1.10 WHERE estoque < 10;
-- ERROR 1175 (HY000): You are using safe update mode and you tried to update a table
-- without a WHERE that uses a KEY column.
-- (Observação: colunas PK, UNIQUE e até FKs como categoria_id possuem índice no InnoDB;
-- já colunas comuns como estoque, preco_unitario ou nome não possuem índice por padrão.)
```

**Como lidar corretamente:**
1. **Melhor prática:** sempre filtre usando a PK (`WHERE idproduto = 1` ou `WHERE idproduto IN (...)`).
2. **Quando precisar atualizar em lote por coluna não indexada:** desabilite temporariamente na sessão e reabilite logo depois:

```sql
SET SQL_SAFE_UPDATES = 0;

UPDATE PRODUTO
SET preco_unitario = ROUND(preco_unitario * 1.05, 2)
WHERE estoque < 10;

SET SQL_SAFE_UPDATES = 1;
```

### 3.3 Correção do Caso `VALOR_ESTOQUE`: Coluna Gerada vs `VIEW`

Nas anotações originais (`Aula 26-08 DDL`), ocorreu a seguinte sequência problemática:
1. Adicionou-se a coluna `VALOR_ESTOQUE DECIMAL(10,2)` na tabela `PRODUTO`.
2. Logo em seguida removeu-se a coluna com `DROP COLUMN` (inclusive com uma tentativa com erro de digitação no nome da coluna, gerando `ERROR 1091`).
3. Na linha seguinte tentou-se executar um `UPDATE` atribuindo `ESTOQUE * PRECO_UNITARIO` à coluna que já havia sido removida, gerando **`ERROR 1054: Unknown column 'VALOR_ESTOQUE' in 'field list'`**.

Além do erro de script, **armazenar um dado derivado manualmente via `UPDATE` viola a normalização prática**: toda vez que `estoque` ou `preco_unitario` mudar, `valor_estoque` ficaria errado se alguém esquecer o `UPDATE`.

**Duas soluções modernas e corretas:**

1. **Coluna Gerada (`GENERATED ALWAYS AS`) — MySQL 5.7+ / 8.x:**
```sql
-- Calcula automaticamente sempre que estoque ou preco_unitario mudarem!
ALTER TABLE PRODUTO
ADD COLUMN valor_estoque DECIMAL(12,2)
    GENERATED ALWAYS AS (estoque * preco_unitario) STORED;
```
*(Use `VIRTUAL` se quiser calcular em leitura sem ocupar espaço em disco, ou `STORED` para gravar fisicamente e permitir índices.)*

2. **`VIEW` (Recomendado para consultas sem alterar a estrutura da tabela):**
```sql
CREATE OR REPLACE VIEW vw_produto_estoque AS
SELECT
    idproduto,
    nome,
    preco_unitario,
    estoque,
    (estoque * preco_unitario) AS valor_estoque
FROM PRODUTO;
```
*(Veja mais detalhes sobre Views e Triggers em [`./07-views-procedures-functions-e-triggers.md`](./07-views-procedures-functions-e-triggers.md).)*

---

## 4. `DELETE` — Remoção de Registros

### 4.1 Sintaxe, Proteção e Erro de Chave Estrangeira (`ERROR 1451`)

```sql
DELETE FROM NOME_TABELA
WHERE condicao;
```

**Ordem de exclusão e `FOREIGN KEY` (`ERROR 1451`):**
Por padrão (`ON DELETE RESTRICT` / `NO ACTION`), o MySQL impede apagar um registro pai enquanto existirem registros filhos referenciando-o:

```sql
-- Tentar apagar o cliente 1 (que possui pedidos 1 e 3 em PEDIDO) falha:
-- ERROR 1451 (23000): Cannot delete or update a parent row: a foreign key constraint fails
-- (`ecommerce`.`pedido`, CONSTRAINT `cliente_pedido_fk` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`idcliente`))
DELETE FROM CLIENTE WHERE idcliente = 1;

-- Já a cliente 3 (Beatriz Lima) ou o cliente 5 (Maria Oliveira), que não possuem pedidos,
-- podem ser removidos sem erro de FK:
DELETE FROM CLIENTE WHERE idcliente = 3;
```

> **Boas práticas antes de deletar:**
> - Sempre teste o filtro com `SELECT * FROM TABELA WHERE ...;` antes de trocar para `DELETE`.
> - Em sistemas reais, muitas vezes prefere-se **exclusão lógica (*soft delete*)**: `UPDATE CLIENTE SET status = 'Inativo' WHERE idcliente = 1;` em vez de `DELETE`, preservando o histórico de pedidos e notas fiscais.

### 4.2 Resumo de Prova: `DELETE` vs `TRUNCATE` vs `DROP`

| Característica | `DELETE` | `TRUNCATE TABLE` | `DROP TABLE` |
|---|---|---|---|
| **Categoria** | DML | DDL | DDL |
| **Aceita `WHERE`?** | Sim | Não (remove todas as linhas) | Não (remove a tabela toda) |
| **Pode fazer `ROLLBACK`?** | **Sim** (dentro de transação) | **Não** (causa commit implícito) | **Não** (causa commit implícito) |
| **Reseta `AUTO_INCREMENT`?** | Não | **Sim** (volta para 1) | N/A (estrutura é removida) |
| **Velocidade em massa** | Mais lento (linha a linha + log undo) | Muito rápido (desaloca páginas) | Instantâneo |
| **Dispara Triggers `ON DELETE`?** | Sim | Não | Não |

*(Detalhes sobre `DROP` e `TRUNCATE` estão no [Guia 02 — DDL e Constraints](./02-ddl-tipos-dados-e-constraints.md).)*

---

## 5. Transações e Propriedades ACID

Uma **transação** é uma unidade lógica de trabalho composta por uma ou mais operações DML que devem ser executadas como um bloco indivisível: **ou todas funcionam, ou nenhuma é aplicada** (*tudo ou nada*).

### 5.1 Os 4 Pilares ACID (Cobrado em Prova!)

| Letra | Propriedade | Significado |
|---|---|---|
| **A** | **Atomicidade** | Tudo ou nada: se qualquer comando falhar no meio, o `ROLLBACK` desfaz tudo até o estado inicial. |
| **C** | **Consistência** | A transação leva o banco de um estado válido para outro estado válido, respeitando `PK`, `FK`, `UNIQUE`, `CHECK` e regras de negócio (ex.: `total_pedido` = soma dos itens). |
| **I** | **Isolamento** | Transações simultâneas não enxergam estados parciais inconsistentes umas das outras (controlado pelo nível de isolamento e locks). |
| **D** | **Durabilidade** | Após o `COMMIT`, os dados ficam gravados permanentemente em disco (*redo log*), sobrevivendo a quedas de energia ou reinicializações. |

### 5.2 Controle de Transações no MySQL (`InnoDB`)

Por padrão, o MySQL opera com `autocommit = 1` (cada comando isolado é confirmado automaticamente). Para agrupar vários comandos:

| Comando | Função |
|---|---|
| `START TRANSACTION;` (ou `BEGIN;`) | Inicia uma transação explícita (suspende o autocommit até `COMMIT` ou `ROLLBACK`). |
| `COMMIT;` | Confirma permanentemente todas as alterações da transação atual. |
| `ROLLBACK;` | Desfaz todas as alterações desde o início da transação. |
| `SAVEPOINT nome;` | Cria um ponto de salvamento intermediário dentro da transação. |
| `ROLLBACK TO SAVEPOINT nome;` | Desfaz apenas até aquele ponto, mantendo os passos anteriores ativos. |
| `RELEASE SAVEPOINT nome;` | Remove o marcador de savepoint sem desfazer os dados. |

> **Armadilha clássica de prova:**
> 1. O engine **`MyISAM`** **não suporta transações** (`ROLLBACK` não desfaz!). Use sempre **`InnoDB`** (padrão do MySQL 8.x).
> 2. Comandos **DDL** (`CREATE`, `ALTER`, `DROP`, `TRUNCATE`) causam **`COMMIT` implícito** automático no MySQL! Se você abrir uma transação, fizer um `INSERT` e rodar um `ALTER TABLE`, não conseguirá mais dar `ROLLBACK` no `INSERT`.

### 5.3 Níveis de Isolamento (Resumo de Prova)

Controlados via `SET TRANSACTION ISOLATION LEVEL ...;` (o padrão do MySQL/InnoDB é **`REPEATABLE READ`**):

| Nível de Isolamento | Dirty Read (Leitura Suja) | Non-Repeatable Read (Leitura Não Repetível) | Phantom Read (Leitura Fantasma) |
|---|---|---|---|
| `READ UNCOMMITTED` | Pode ocorrer | Pode ocorrer | Pode ocorrer |
| `READ COMMITTED` | Evita | Pode ocorrer | Pode ocorrer |
| `REPEATABLE READ` *(Padrão MySQL)* | Evita | Evita | Evita (no InnoDB via MVCC + gap locks) |
| `SERIALIZABLE` | Evita | Evita | Evita |

### 5.4 Exemplo Prático Completo: "Venda Completa" Atômica no `ECOMMERCE`

Imagine que o cliente `2` (`Carlos Souza`) compre do vendedor `4` (`Juliana Vendedor`): `2` unidades do produto `1` (`Mouse Gamer RGB`, `149.90`) e `1` unidade do produto `6` (`Headset Gamer`, `199.90`). Se o estoque não puder ser baixado ou se algum passo falhar, o pedido **não pode** ficar gravado pela metade!

```sql
USE ECOMMERCE;

START TRANSACTION;

-- 1. Cria o cabeçalho do pedido (total inicial 0.00; será atualizado ao final)
INSERT INTO PEDIDO (cliente_id, vendedor_id, data_pedido, total_pedido)
VALUES (2, 4, CURDATE(), 0.00);

-- Captura o idpedido gerado pelo AUTO_INCREMENT nesta sessão
SET @novo_pedido_id = LAST_INSERT_ID();

-- Ponto de salvamento após criar o cabeçalho
SAVEPOINT sp_cabecalho_criado;

-- 2. Insere os itens vendidos (preço congelado no momento da venda)
INSERT INTO ITEMPEDIDO (pedido_id, produto_id, quantidade, preco_unitario) VALUES
    (@novo_pedido_id, 1, 2, 149.90),
    (@novo_pedido_id, 6, 1, 199.90);

-- 3. Baixa o estoque dos produtos (protegido pelo CHECK (estoque >= 0)!)
-- Se o estoque fosse insuficiente, ocorreria ERROR 3819 e poderíamos executar ROLLBACK.
UPDATE PRODUTO SET estoque = estoque - 2 WHERE idproduto = 1;
UPDATE PRODUTO SET estoque = estoque - 1 WHERE idproduto = 6;

-- 4. Atualiza o total_pedido exatamente pela soma dos itens inseridos
UPDATE PEDIDO
SET total_pedido = (
    SELECT SUM(quantidade * preco_unitario)
    FROM ITEMPEDIDO
    WHERE pedido_id = @novo_pedido_id
)
WHERE idpedido = @novo_pedido_id;

-- Conferência antes de confirmar
SELECT * FROM PEDIDO WHERE idpedido = @novo_pedido_id;
SELECT * FROM ITEMPEDIDO WHERE pedido_id = @novo_pedido_id;

-- 5. Confirma toda a operação atomicamente (ou use ROLLBACK; para cancelar tudo)
COMMIT;
```

> **Teste de `SAVEPOINT` e `ROLLBACK`:**
> Se durante a conferência você decidir cancelar apenas os itens (mantendo o cabeçalho) e inserir outros, executaria `ROLLBACK TO SAVEPOINT sp_cabecalho_criado;`. Se quiser cancelar a venda inteira (inclusive o pedido e as baixas de estoque), execute `ROLLBACK;` no lugar de `COMMIT;`.

---

## Cola Rápida de Prova (`03`)

- **Ordem de inserção com FK:** Pai primeiro (`CATEGORIA`, `CLIENTE`, `VENDEDOR`), filho depois (`PRODUTO`, `PEDIDO`, `ITEMPEDIDO`).
- **`INSERT` seguro:** sempre liste as colunas `INSERT INTO TABELA (col1, col2) VALUES (...);`.
- **`ERROR 3819`:** violação de `CHECK` (`preco_unitario <= 0` ou `estoque < 0`).
- **`ERROR 1452`:** violação de `FK` ao inserir/atualizar filho com pai inexistente.
- **`ERROR 1451`:** violação de `FK` ao deletar pai que ainda possui filhos.
- **`ERROR 1175`:** `SQL_SAFE_UPDATES` bloqueando `UPDATE`/`DELETE` sem chave no `WHERE`.
- **`UPDATE`/`DELETE` seguro:** teste o `WHERE` com `SELECT` antes; prefira filtrar pela PK.
- **Dado derivado (`valor_estoque`):** prefira `GENERATED ALWAYS AS (...) STORED` ou `VIEW` em vez de `UPDATE` manual.
- **Transação:** `START TRANSACTION` → DMLs → `COMMIT` (confirma) ou `ROLLBACK` (desfaz). DDL dá commit implícito!
