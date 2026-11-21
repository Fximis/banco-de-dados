# 07 — Views, Stored Procedures, Functions e Triggers (MySQL 8.x)

> **Navegação:** [← Anterior: JOINs, Subqueries e CTEs](./06-joins-subqueries-e-ctes.md) | [Índice MySQL](../README.md) | [Próximo: Índices, Otimização e DCL →](./08-indices-otimizacao-e-dcl.md)
> **Base utilizada:** Todos os exemplos deste guia rodam diretamente sobre o schema canônico **`ECOMMERCE`** (`CATEGORIA`, `PRODUTO`, `CLIENTE`, `VENDEDOR`, `PEDIDO`, `ITEMPEDIDO`), detalhado na [Lista Completa ECOMMERCE](../exercicios/02-lista-ecommerce-completa.md).

Este módulo cobre os objetos programáveis e derivados do MySQL 8.x: **Views**, o uso de **`DELIMITER`**, **Stored Procedures**, **Stored Functions** e **Triggers**.

---

## 1. Views (`CREATE VIEW`)

Uma **View** (visão) é uma **tabela virtual** definida por uma consulta `SELECT` armazenada no banco. Ela **não armazena cópia dos dados** no disco (o MySQL não possui *Materialized Views* nativas como Oracle/PostgreSQL) — toda vez que você consulta a view, o MySQL executa a query subjacente sobre os dados atuais.

### 1.1 Por que usar Views?

1. **Evitar atributos derivados redundantes** (ex.: `vw_valor_estoque` em vez de tentar manter uma coluna física `valor_estoque` atualizada por `UPDATE` manual).
2. **Encapsular `JOIN`s e regras complexas** para simplificar consultas do time.
3. **Segurança e controle de acesso:** expor apenas colunas não sensíveis (ocultando `cpf`, `email`, salários).

### 1.2 Exemplos Práticos no `ECOMMERCE`

#### Exemplo 1: `vw_valor_estoque` (Alternativa correta a dado derivado)
Nas aulas iniciais, tentou-se criar e remover a coluna `VALOR_ESTOQUE` em `PRODUTO`. Com uma `VIEW`, o cálculo fica sempre atualizado automaticamente:

```sql
USE ECOMMERCE;

CREATE OR REPLACE VIEW vw_valor_estoque AS
SELECT
    p.idproduto,
    p.nome                              AS produto,
    c.nome                              AS categoria,
    p.preco_unitario,
    p.estoque,
    (p.preco_unitario * p.estoque)      AS valor_total_estoque
FROM PRODUTO p
INNER JOIN CATEGORIA c ON c.idcategoria = p.categoria_id;

-- Usando a view como se fosse uma tabela:
SELECT * FROM vw_valor_estoque ORDER BY valor_total_estoque DESC;
```

#### Exemplo 2: `vw_resumo_pedidos` (Encapsulamento de `JOIN`s)

```sql
CREATE OR REPLACE VIEW vw_resumo_pedidos AS
SELECT
    p.idpedido,
    p.data_pedido,
    cl.nome   AS cliente,
    v.nome    AS vendedor,
    p.total_pedido
FROM PEDIDO p
INNER JOIN CLIENTE cl ON cl.idcliente = p.cliente_id
LEFT JOIN VENDEDOR v  ON v.idvendedor = p.vendedor_id;

SELECT * FROM vw_resumo_pedidos WHERE total_pedido > 1000;
```

#### Exemplo 3: `vw_clientes_publico` (Ocultação de colunas sensíveis como `cpf`)

```sql
CREATE OR REPLACE VIEW vw_clientes_publico AS
SELECT
    idcliente,
    nome,
    status
FROM CLIENTE;
```

### 1.3 Views Atualizáveis vs Somente Leitura + `WITH CHECK OPTION`

Uma `VIEW` só aceita `INSERT`, `UPDATE` ou `DELETE` se houver mapeamento 1-para-1 com a tabela base. Ela se torna **não-atualizável** quando contém:
- Funções de agregação (`SUM`, `COUNT`, `AVG`, `MIN`, `MAX`), `GROUP BY` ou `HAVING`;
- `DISTINCT`, `UNION` / `UNION ALL`;
- Subqueries no `SELECT` ou certas construções com `JOIN` / colunas calculadas.

Quando a view é atualizável (ex.: filtro simples em uma tabela), o **`WITH CHECK OPTION`** impede que um `INSERT` ou `UPDATE` feito através da view viole o próprio `WHERE` dela:

```sql
CREATE OR REPLACE VIEW vw_clientes_ativos AS
SELECT idcliente, nome, cpf, email, status
FROM CLIENTE
WHERE status = 'Ativo'
WITH CHECK OPTION;

-- Permitido (mantém status = 'Ativo'):
UPDATE vw_clientes_ativos SET email = 'ana.silva@email.com' WHERE idcliente = 1;

-- BLOQUEADO pelo WITH CHECK OPTION (ERROR 1369: CHECK OPTION failed):
UPDATE vw_clientes_ativos SET status = 'Inativo' WHERE idcliente = 1;
```

### 1.4 Gerenciando Views

```sql
SHOW FULL TABLES WHERE Table_type = 'VIEW';
SHOW CREATE VIEW vw_valor_estoque;
DROP VIEW IF EXISTS vw_clientes_publico;
```

---

## 2. Por que usar `DELIMITER`?

Por padrão, o cliente `mysql` (e ferramentas como MySQL Workbench) interpreta o ponto e vírgula **`;`** como o fim do comando e o envia imediatamente ao servidor.

Dentro de uma **Stored Procedure**, **Function** ou **Trigger**, o bloco `BEGIN ... END` contém várias instruções terminadas por `;`. Se você não mudar o delimitador antes, o cliente corta o `CREATE` na primeira `;` interna e gera **erro de sintaxe (`ERROR 1064`)**.

```sql
DELIMITER //

CREATE PROCEDURE exemplo()
BEGIN
    SELECT 1; -- este ';' pertence ao corpo da rotina, nao encerra o CREATE!
END //

DELIMITER ; -- SEMPRE restaure para ';' ao terminar!
```

> **Atenção na Prova:** `DELIMITER` é um comando do **cliente** (`mysql`, Workbench), não da linguagem SQL do servidor (se usar drivers como Python/JDBC diretamente, você envia o `CREATE PROCEDURE` sem `DELIMITER`). Em scripts `.sql` e provas escritas, sempre use `DELIMITER //` (ou `$$`) antes e `DELIMITER ;` depois.

---

## 3. Stored Procedures (`CREATE PROCEDURE`)

Uma **Stored Procedure** (procedimento armazenado) é uma rotina salva no banco que executa um conjunto de comandos (DML, controle de fluxo, transações) e é chamada com **`CALL`**.

### 3.1 Modos de Parâmetro

| Modo | Significado | Exemplo |
|---|---|---|
| **`IN`** (padrão) | Apenas entrada (valor passado para dentro). | `IN p_categoria_id INT` |
| **`OUT`** | Apenas saída (recebe um valor calculado e devolve em variável `@var`). | `OUT p_total DECIMAL(10,2)` |
| **`INOUT`** | Entra com um valor e sai atualizado. | `INOUT p_saldo DECIMAL(10,2)` |

### 3.2 Exemplos Práticos no `ECOMMERCE`

#### Exemplo 1: Procedure com `IN` e `OUT` + `IF/ELSE` e `SIGNAL` (`sp_aplicar_reajuste_categoria`)

```sql
DELIMITER //

DROP PROCEDURE IF EXISTS sp_aplicar_reajuste_categoria //

CREATE PROCEDURE sp_aplicar_reajuste_categoria (
    IN  p_categoria_id INT,
    IN  p_percentual   DECIMAL(5,2),
    OUT p_qtd_afetados INT
)
BEGIN
    -- Validação defensiva com erro customizado
    IF p_percentual <= -100 OR p_percentual > 200 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Percentual de reajuste fora da faixa permitida (-100 a 200).';
    END IF;

    UPDATE PRODUTO
       SET preco_unitario = ROUND(preco_unitario * (1 + p_percentual / 100), 2)
     WHERE categoria_id = p_categoria_id;

    SET p_qtd_afetados = ROW_COUNT();
END //

DELIMITER ;

-- Executando a procedure:
CALL sp_aplicar_reajuste_categoria(2, 10.00, @afetados);
SELECT @afetados AS produtos_reajustados;
```

#### Exemplo 2: Procedure de Consulta com Múltiplos `OUT` (`sp_resumo_cliente`)

```sql
DELIMITER //

DROP PROCEDURE IF EXISTS sp_resumo_cliente //

CREATE PROCEDURE sp_resumo_cliente (
    IN  p_cliente_id  INT,
    OUT p_qtd_pedidos INT,
    OUT p_total_gasto DECIMAL(10,2)
)
BEGIN
    SELECT
        COUNT(*),
        COALESCE(SUM(total_pedido), 0.00)
    INTO
        p_qtd_pedidos,
        p_total_gasto
    FROM PEDIDO
    WHERE cliente_id = p_cliente_id;
END //

DELIMITER ;

CALL sp_resumo_cliente(1, @qtd, @total);
SELECT @qtd AS total_pedidos, @total AS valor_acumulado;
```

#### Exemplo 3: Parâmetro `INOUT` (`sp_acumular_bonus`)

```sql
DELIMITER //

DROP PROCEDURE IF EXISTS sp_acumular_bonus //

CREATE PROCEDURE sp_acumular_bonus (
    INOUT p_valor      DECIMAL(10,2),
    IN    p_acrescimo  DECIMAL(10,2)
)
BEGIN
    SET p_valor = p_valor + p_acrescimo;
END //

DELIMITER ;

SET @meta = 1000.00;
CALL sp_acumular_bonus(@meta, 250.00);
SELECT @meta AS nova_meta; -- Retorna 1250.00
```

---

## 4. Stored Functions (`CREATE FUNCTION`)

Uma **Stored Function** (função armazenada) **sempre retorna um único valor escalar** (`RETURNS tipo`) e pode ser usada diretamente dentro de `SELECT`, `WHERE`, `ORDER BY` ou expressões.

### 4.1 Características Obrigatórias (`DETERMINISTIC`, `READS SQL DATA`, `NO SQL`)

Quando o log binário (*binary log*) está ativo (padrão no MySQL 8.x!), o servidor **rejeita** a criação de funções sem declaração de determinismo/acesso a dados (`ERROR 1418`):
- **`DETERMINISTIC`:** para os mesmos argumentos de entrada, retorna sempre o mesmo resultado (ex.: cálculo matemático, formatação de string).
- **`NOT DETERMINISTIC`:** o resultado pode variar mesmo com entradas iguais (ex.: depende de `NOW()`, `RAND()` ou leitura de tabela que muda).
- **`NO SQL`:** não executa instruções SQL (apenas lógica e variáveis).
- **`READS SQL DATA`:** executa `SELECT` em tabelas, sem modificar dados.

> **Regra de Ouro:** Em funções no MySQL, **não** é permitido executar `INSERT`, `UPDATE`, `DELETE`, `COMMIT` ou `ROLLBACK` na maioria dos contextos — para modificar tabelas, use **Stored Procedure**.

### 4.2 Exemplos Práticos no `ECOMMERCE`

#### Exemplo 1: Função Pura `DETERMINISTIC` (`fn_classificar_ticket`)

```sql
DELIMITER //

DROP FUNCTION IF EXISTS fn_classificar_ticket //

CREATE FUNCTION fn_classificar_ticket(p_valor DECIMAL(10,2))
RETURNS VARCHAR(20)
DETERMINISTIC
NO SQL
BEGIN
    IF p_valor IS NULL THEN
        RETURN 'Indefinido';
    ELSEIF p_valor >= 2000.00 THEN
        RETURN 'Alto';
    ELSEIF p_valor >= 500.00 THEN
        RETURN 'Medio';
    ELSE
        RETURN 'Baixo';
    END IF;
END //

DELIMITER ;

-- Uso direto no SELECT e GROUP BY:
SELECT
    idpedido,
    total_pedido,
    fn_classificar_ticket(total_pedido) AS faixa_ticket
FROM PEDIDO;
```

#### Exemplo 2: Função que consulta tabela `READS SQL DATA` (`fn_total_gasto_cliente`)

```sql
DELIMITER //

DROP FUNCTION IF EXISTS fn_total_gasto_cliente //

CREATE FUNCTION fn_total_gasto_cliente(p_cliente_id INT)
RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(10,2);

    SELECT COALESCE(SUM(total_pedido), 0.00)
      INTO v_total
      FROM PEDIDO
     WHERE cliente_id = p_cliente_id;

    RETURN v_total;
END //

DELIMITER ;

SELECT
    idcliente,
    nome,
    fn_total_gasto_cliente(idcliente) AS total_compras
FROM CLIENTE
ORDER BY total_compras DESC;
```

### Procedure vs Function (Resumo)

| Critério | Stored Procedure | Stored Function |
|---|---|---|
| **Como invocar** | `CALL minha_proc(...)` | Dentro de `SELECT`, `WHERE`, `SET` |
| **Retorno** | 0, 1 ou vários (`OUT`/`INOUT` ou result sets) | Sempre **1 valor escalar** (`RETURN`) |
| **Pode alterar dados (`INSERT`/`UPDATE`/`DELETE`)?** | **Sim** (inclusive controlar transações) | **Não** (foco em cálculo/consulta) |
| **Uso em queries SQL** | Não pode ir dentro de um `SELECT` | Pode ir no `SELECT`, `WHERE`, `ORDER BY` |

---

## 5. Triggers (`CREATE TRIGGER`)

Um **Trigger** (gatilho) é um bloco associado a uma tabela que dispara **automaticamente** antes (`BEFORE`) ou depois (`AFTER`) de um evento DML (`INSERT`, `UPDATE`, `DELETE`), linha por linha (`FOR EACH ROW`).

### 5.1 Disponibilidade de `NEW` e `OLD`

| Evento | `OLD.coluna` (valor antigo) | `NEW.coluna` (valor novo) | Uso Típico |
|---|---|---|---|
| **`INSERT`** | ❌ Não existe | ✅ Disponível (editável no `BEFORE`) | Validar estoque, normalizar string, baixar estoque. |
| **`UPDATE`** | ✅ Disponível (somente leitura) | ✅ Disponível (editável no `BEFORE`) | Auditoria de preço antigo vs novo, bloquear alteração inválida. |
| **`DELETE`** | ✅ Disponível (somente leitura) | ❌ Não existe | Registrar log de exclusão, estornar estoque. |

### 5.2 Exemplos Práticos no `ECOMMERCE`

#### Exemplo 1: `BEFORE INSERT` com `SIGNAL SQLSTATE '45000'` (Validar Estoque)

Se alguém tentar inserir um item em `ITEMPEDIDO` com quantidade maior que `PRODUTO.estoque`, o trigger bloqueia a operação com mensagem clara:

```sql
DELIMITER //

DROP TRIGGER IF EXISTS trg_itempedido_valida_estoque //

CREATE TRIGGER trg_itempedido_valida_estoque
BEFORE INSERT ON ITEMPEDIDO
FOR EACH ROW
BEGIN
    DECLARE v_estoque_atual INT;

    SELECT estoque
      INTO v_estoque_atual
      FROM PRODUTO
     WHERE idproduto = NEW.produto_id;

    IF v_estoque_atual IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Produto nao encontrado para o item informado.';
    END IF;

    IF NEW.quantidade > v_estoque_atual THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Estoque insuficiente para atender a quantidade solicitada.';
    END IF;
END //

DELIMITER ;
```

#### Exemplo 2: `AFTER INSERT` (Baixar estoque e atualizar total do pedido)

```sql
DELIMITER //

DROP TRIGGER IF EXISTS trg_itempedido_pos_insert //

CREATE TRIGGER trg_itempedido_pos_insert
AFTER INSERT ON ITEMPEDIDO
FOR EACH ROW
BEGIN
    UPDATE PRODUTO
       SET estoque = estoque - NEW.quantidade
     WHERE idproduto = NEW.produto_id;

    UPDATE PEDIDO
       SET total_pedido = COALESCE(total_pedido, 0) + (NEW.quantidade * NEW.preco_unitario)
     WHERE idpedido = NEW.pedido_id;
END //

DELIMITER ;
```

#### Exemplo 3: `AFTER UPDATE` para Auditoria de Preços

```sql
CREATE TABLE IF NOT EXISTS LOG_PRECO_PRODUTO (
    idlog          INT AUTO_INCREMENT PRIMARY KEY,
    produto_id     INT NOT NULL,
    preco_anterior DECIMAL(10,2) NOT NULL,
    preco_novo     DECIMAL(10,2) NOT NULL,
    alterado_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_preco_produto
        FOREIGN KEY (produto_id) REFERENCES PRODUTO(idproduto)
);

DELIMITER //

DROP TRIGGER IF EXISTS trg_produto_audita_preco //

CREATE TRIGGER trg_produto_audita_preco
AFTER UPDATE ON PRODUTO
FOR EACH ROW
BEGIN
    -- Só grava log se o preço realmente mudou (NULL-safe com <=>)
    IF NOT (OLD.preco_unitario <=> NEW.preco_unitario) THEN
        INSERT INTO LOG_PRECO_PRODUTO (produto_id, preco_anterior, preco_novo)
        VALUES (NEW.idproduto, OLD.preco_unitario, NEW.preco_unitario);
    END IF;
END //

DELIMITER ;
```

---

## 6. Atenção na Prova & Erros Comuns

### Quadro Comparativo Geral

| Objeto | O que é | Quando Usar |
|---|---|---|
| **View** | `SELECT` salvo (tabela virtual) | Simplificar consultas, ocultar colunas, substituir dados derivados. |
| **Procedure** | Rotina executada com `CALL` | Regras de negócio multi-etapa, cargas, transações, retornos múltiplos (`OUT`). |
| **Function** | Rotina escalar com `RETURN` | Cálculos reutilizáveis dentro de `SELECT` e `WHERE`. |
| **Trigger** | Gatilho automático por linha (`BEFORE`/`AFTER`) | Auditoria (`LOG`), validação com `SIGNAL`, sincronização imediata entre tabelas. |

### Erros Comuns

1. **Esquecer `DELIMITER //`:** gera `ERROR 1064` na primeira linha dentro do `BEGIN ... END`.
2. **Criar `FUNCTION` sem `DETERMINISTIC` ou `READS SQL DATA`:** gera `ERROR 1418` quando `log_bin` está ligado (padrão no MySQL 8.x).
3. **Tentar usar `COMMIT` ou `ROLLBACK` dentro de Trigger ou Function:** **proibido no MySQL** (`ERROR 1422: Explicit or implicit commit is not allowed in stored function or trigger`).
4. **Atualizar a própria tabela dentro de um Trigger da mesma tabela:** um trigger `AFTER UPDATE` na tabela `PRODUTO` **não pode** rodar `UPDATE PRODUTO SET ...` (`ERROR 1442: Can't update table 'PRODUTO' in stored function/trigger because it is already used by statement`). Para modificar valores da própria linha sendo inserida/atualizada, use **`BEFORE INSERT`/`BEFORE UPDATE`** com `SET NEW.coluna = ...`!
5. **Esquecer que `TRUNCATE TABLE` não dispara triggers `DELETE`:** se você depende de um trigger de auditoria `AFTER DELETE`, saiba que `TRUNCATE` ignora o trigger (além de falhar se houver FKs).

---

> **Próximo passo:** [08 — Índices, Otimização (`EXPLAIN`) e DCL →](./08-indices-otimizacao-e-dcl.md)
