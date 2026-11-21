# 02 — DDL, Tipos de Dados, Constraints e Exclusão Segura (MySQL 8.x)

> **Navegação:** [← Anterior: Modelagem e Normalização](./01-modelagem-relacional-e-normalizacao.md) | [Índice MySQL](../README.md) | [Próximo: DML, CRUD e Transações →](./03-dml-crud-e-transacoes.md)
> **Prática relacionada:** Os 65 exercícios completos (Blocos 1, 2, 3 e 4 corrigidos e executáveis) estão em [Caderno de Exercícios DDL, Tipos, PKs e FKs](../exercicios/01-caderno-ddl-tipos-pks-fks.md).

Este guia consolida e corrige todas as anotações de DDL, escolha de tipos, chaves primárias, `UNIQUE`, `CHECK`, `FOREIGN KEY` e comandos de exclusão (`DELETE`, `TRUNCATE`, `DROP`) para o MySQL 8.x (`InnoDB`).

---

## 1. Comandos DDL Fundamentais

**DDL (*Data Definition Language*)** define e altera a **estrutura** do banco e das tabelas. No MySQL, comandos DDL realizam **commit implícito** — ou seja, não podem ser desfeitos com `ROLLBACK`.

```sql
-- Bancos de dados
DROP DATABASE IF EXISTS loja_estudos;
CREATE DATABASE loja_estudos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE loja_estudos;

-- Inspeção de estrutura
SHOW TABLES;
DESCRIBE minha_tabela;       -- ou DESC minha_tabela;
SHOW CREATE TABLE minha_tabela;
```

### Principais Operações com `ALTER TABLE`

```sql
-- Adicionar coluna
ALTER TABLE produto ADD COLUMN codigo_barras VARCHAR(20) NOT NULL;

-- Alterar tipo/nulabilidade mantendo o nome (MODIFY)
ALTER TABLE produto MODIFY COLUMN codigo_barras VARCHAR(30) NULL;

-- Renomear coluna no MySQL 8.0+ (RENAME COLUMN)
ALTER TABLE produto RENAME COLUMN codigo_barras TO ean;

-- Alterar nome + definição juntos (CHANGE COLUMN)
ALTER TABLE produto CHANGE COLUMN ean codigo_ean VARCHAR(13) NOT NULL;

-- Remover coluna
ALTER TABLE produto DROP COLUMN codigo_ean;

-- Adicionar e remover constraints nomeadas
ALTER TABLE produto ADD CONSTRAINT uq_produto_nome UNIQUE (nome);
ALTER TABLE produto DROP INDEX uq_produto_nome;         -- UNIQUE é um índice no MySQL
ALTER TABLE produto DROP CHECK ck_produto_preco;        -- MySQL 8.0.16+
ALTER TABLE produto DROP FOREIGN KEY fk_produto_cat;
```

> **Atenção na Prova:** No MySQL, para remover uma `UNIQUE` usa-se `DROP INDEX nome_constraint` (ou `DROP CONSTRAINT` a partir do 8.0.19), enquanto para remover uma `FOREIGN KEY` usa-se `DROP FOREIGN KEY nome_fk` (o índice auxiliar continua existindo até um `DROP INDEX`).

---

## 2. Guia de Tipos de Dados no MySQL 8.x (e Armadilhas Reais)

A escolha errada de tipo causa truncamento silencioso, erro de cálculo financeiro ou estouro de limite. Abaixo estão as regras essenciais com os casos corrigidos das anotações de aula:

### 2.1 Inteiros (`TINYINT`, `SMALLINT`, `INT`, `BIGINT`)

| Tipo | Bytes | Faixa com Sinal (`SIGNED`) | Faixa sem Sinal (`UNSIGNED`) | Quando Usar |
|---|---|---|---|---|
| `TINYINT` | 1 | `-128` a `127` | `0` a `255` | `BOOLEAN` (`TINYINT(1)`), dia da semana (`1..7`), nota (`1..5`), códigos pequenos. |
| `SMALLINT` | 2 | `-32.768` a `32.767` | `0` a `65.535` | Ano letivo, **porta TCP** (`1..65535`). |
| `INT` | 4 | `-2,14 bi` a `2,14 bi` | `0` a `4,29 bi` | Chaves primárias padrão, quantidades, contadores. |
| `BIGINT` | 8 | `±9,22 × 10¹⁸` | `0` a `1,84 × 10¹⁹` | Logs de acesso em alta escala, transações financeiras, IDs distribuídos. |

> **Erro Comum #1 — Porta TCP em `SMALLINT` com sinal:**
> Portas TCP/UDP vão de `1` a **`65535`**. Declarar `porta SMALLINT DEFAULT 587` aceita `587`, mas falha ao tentar gravar portas altas como `49152` (`Out of range value`, limite máximo `32767`).
> **Correção:** usar **`SMALLINT UNSIGNED`** + `CHECK (porta BETWEEN 1 AND 65535)`.

### 2.2 Ponto Fixo (`DECIMAL`) vs Ponto Flutuante (`FLOAT` / `DOUBLE`)

- **`DECIMAL(M, D)` (exato):** `M` = total de dígitos; `D` = casas decimais. Armazena o valor exato (ideal para dinheiro, notas, percentuais, pesos).
- **`FLOAT` / `DOUBLE` (aproximado IEEE 754):** usa representação binária aproximada. `0.1 + 0.2` pode resultar em `0.30000000000000004`, quebrando comparações de igualdade (`WHERE valor = 7.50`).

> **Erro Comum #2 — `nota FLOAT` na tabela `avaliacao`:**
> Nunca use `FLOAT` para notas escolares/avaliações ou valores monetários. Troque por **`DECIMAL(4,2)`** (ou `DECIMAL(3,1)`).

> **Erro Comum #3 — `percentual DECIMAL(4,2)` em `cupom_desconto`:**
> Em `DECIMAL(4,2)`, há 4 dígitos no total e 2 após a vírgula — logo, sobram apenas **2 dígitos inteiros**! O maior valor possível é **`99.99`** (um cupom de `100.00%` gera `Out of range value`).
> **Correção:** usar **`DECIMAL(5,2)`** (suporta até `999.99`, cobrindo `100.00%`) com `CHECK (percentual > 0 AND percentual <= 100)`.

### 2.3 Texto (`CHAR`, `VARCHAR`, `TEXT`)

| Tipo | Armazenamento | Uso Recomendado |
|---|---|---|
| `CHAR(N)` | Tamanho **fixo** (`0..255`). Ocupa sempre `N` caracteres (faz *padding* à direita). | Códigos de comprimento constante: `uf CHAR(2)`, `cep CHAR(8)`, `competencia CHAR(7)`, `letra_sala CHAR(1)`. |
| `VARCHAR(N)` | Tamanho **variável** (`0..65.535` bytes) + 1 ou 2 bytes de prefixo de tamanho. | Nomes, e-mails, logradouros, senhas em hash, IPs (`VARCHAR(45)` suporta IPv6 completo). |
| `TEXT` / `MEDIUMTEXT` | Textos longos fora da linha principal (64 KB / 16 MB). | Descrições extensas, artigos, logs textuais. |

*Nota sobre `CHAR` sem tamanho:* escrever apenas `recomenda CHAR` no MySQL equivale a `CHAR(1)`, mas é boa prática explicitar `CHAR(1)` para legibilidade.

### 2.4 Binários (`BLOB`, `MEDIUMBLOB`, `LONGBLOB`)

| Tipo | Capacidade Máxima | Observação Prática |
|---|---|---|
| `TINYBLOB` | 255 bytes | Tokens binários curtos. |
| `BLOB` | **64 KB** (65.535 bytes) | **Insuficiente** para PDFs, imagens ou anexos reais! |
| `MEDIUMBLOB` | **16 MB** | Pequenos PDFs e fotos comprimidas. |
| `LONGBLOB` | **4 GB** | Arquivos maiores (se realmente precisarem ir para o banco). |

> **Atenção na Prova / Produção:** Em `anexo_documento`, usar `BLOB` limita o arquivo a 64 KB. Se o arquivo for salvo no banco, use `MEDIUMBLOB` ou `LONGBLOB`. Na arquitetura moderna, recomenda-se salvar o arquivo em *Object Storage* (S3/MinIO) e gravar apenas a URL/caminho (`VARCHAR(500)`) + metadados (`hash`, `mime_type`, `tamanho_bytes`) no banco.

### 2.5 Booleanos (`BOOLEAN` / `BOOL`)

No MySQL, **`BOOLEAN`** (ou `BOOL`) não é um tipo físico separado: é um **alias para `TINYINT(1)`**.
- `TRUE` equivale a `1` e `FALSE` equivale a `0`.
- Como continua sendo `TINYINT(1)`, sem `CHECK` ou `ENUM`, uma coluna `BOOLEAN` aceitaria `2` ou `9`. Use `TRUE`/`FALSE` nas queries e `NOT NULL DEFAULT FALSE` (ou `TRUE`) na DDL.

### 2.6 Tipos Temporais (`DATE`, `DATETIME`, `TIMESTAMP`, `TIME`)

> **Correção de Anotação Antiga:** O formato literal padrão no MySQL é **`YYYY-MM-DD`** (4 dígitos de ano, 2 de mês, 2 de dia — nunca com apenas 3 dígitos no ano!). Para `DATETIME` e `TIMESTAMP`, o formato é **`YYYY-MM-DD HH:MM:SS`**.

| Tipo | Formato | Intervalo Suportado | Fuso Horário | Quando Usar |
|---|---|---|---|---|
| `DATE` | `'YYYY-MM-DD'` | `1000-01-01` a `9999-12-31` | Não | Data de nascimento, validade, data do pedido (`CURDATE()`). |
| `TIME` | `'HH:MM:SS'` | `-838:59:59` a `838:59:59` | Não | Horário de aula (`grade_horario`), duração. |
| `DATETIME` | `'YYYY-MM-DD HH:MM:SS'` | `1000-01-01` a **`9999-12-31`** | **Não converte** (salva exatamente o que foi enviado) | Agendamentos futuros, logs gerais, eventos após 2038. |
| `TIMESTAMP` | `'YYYY-MM-DD HH:MM:SS'` | `1970-01-01 00:00:01` UTC a **`2038-01-19 03:14:07` UTC** | **Converte para UTC** ao gravar e para o fuso da sessão ao ler | Auditoria automática (`DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`), respeitando o limite Y2038. |

*Dica:* tanto `DEFAULT CURRENT_TIMESTAMP` quanto `DEFAULT NOW()` funcionam em `DATETIME` e `TIMESTAMP` no MySQL 8.x.

### 2.7 UUID no MySQL 8.x (`CHAR(36)` vs `BINARY(16)`)

1. **Evite nomear a coluna como `UUID`:** embora o MySQL aceite `UUID CHAR(36)`, `UUID()` é o nome de uma função nativa — prefira `id_usuario`.
2. **Problema de `CHAR(36)` com `UUID()` (v4 aleatório):** ocupa 36 bytes (ou mais conforme charset) e, por ser aleatório, provoca **fragmentação de páginas na B-Tree** do InnoDB em tabelas grandes.
3. **Solução nativa do MySQL 8.0+:** usar **`BINARY(16)`** com **`UUID_TO_BIN(UUID(), 1)`** (o segundo argumento `1` reordena os bits de tempo para o início, deixando o UUID sequencial na B-Tree!) e ler com `BIN_TO_UUID(id_usuario, 1)`:

```sql
CREATE TABLE usuario_rede (
    id_usuario BINARY(16) NOT NULL DEFAULT (UUID_TO_BIN(UUID(), 1)),
    login      VARCHAR(30) NOT NULL,
    CONSTRAINT pk_usuario_rede PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_login UNIQUE (login)
);
```

### 2.8 Tipo Nativo `JSON` (MySQL 5.7.8+ / 8.x)

O MySQL 8.x possui o tipo nativo **`JSON`**, que valida documentos JSON automaticamente na inserção e os armazena em formato binário otimizado (permitindo acesso rápido via `->`, `->>`, `JSON_EXTRACT()` e índices funcionais/multi-valor):

```sql
CREATE TABLE configuracao_sistema (
    id_config  INT AUTO_INCREMENT PRIMARY KEY,
    parametros JSON NOT NULL
);
```

---

## 3. Chaves Primárias (`PRIMARY KEY`) — Simples e Compostas

Toda tabela relacional no InnoDB deve ter uma `PRIMARY KEY` (`NOT NULL` + `UNIQUE` garantidos). Há **três formas sintáticas** de declará-la no MySQL:

```sql
-- Modo 1: Inline na coluna (apenas PK simples de 1 coluna)
CREATE TABLE categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome         VARCHAR(40) NOT NULL
);

-- Modo 2: Nível de tabela com CONSTRAINT nomeada (obrigatório para PK composta!)
CREATE TABLE item_pedido (
    id_pedido      INT NOT NULL,
    num_item       INT NOT NULL,
    quantidade     INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_item_pedido PRIMARY KEY (id_pedido, num_item)
);

-- Modo 3: Pós-criação via ALTER TABLE
CREATE TABLE fornecedor (
    id_fornecedor INT NOT NULL,
    razao_social  VARCHAR(100) NOT NULL
);
ALTER TABLE fornecedor ADD CONSTRAINT pk_fornecedor PRIMARY KEY (id_fornecedor);
```

- **PK Surrogate (Artificial):** `id INT AUTO_INCREMENT` (simples, estável, rápida para índices).
- **PK Natural:** atributo real único e estável, como `uf CHAR(2)` ou `ibge_codigo INT`.
- **PK Composta:** combinação de 2 ou mais colunas (muito comum em tabelas associativas `N:N` como `(ra, cod_disciplina)` e históricos temporais como `(id_funcionario, id_cargo, data_promocao)`).

---

## 4. Constraints de Domínio e Unicidade (`NOT NULL`, `DEFAULT`, `UNIQUE`, `CHECK`)

### 4.1 `NOT NULL` e `DEFAULT`

- **`NOT NULL`:** impede valores ausentes (`NULL`).
- **`DEFAULT valor`:** define o valor automático quando a coluna não é informada no `INSERT`. Em MySQL 8.0.13+, também aceita expressões entre parênteses, como `DEFAULT (CURRENT_DATE)` ou `DEFAULT (UUID_TO_BIN(UUID(), 1))`.

### 4.2 `UNIQUE` (Simples e Composta) e a Armadilha do `NULL`

`UNIQUE` garante que não haja dois valores iguais na coluna (ou na combinação de colunas), criando um índice único.

> **Atenção na Prova — Múltiplos `NULL`s em `UNIQUE`:**
> No padrão SQL e no MySQL (InnoDB), **`NULL` não é igual a `NULL`** (`NULL = NULL` é `UNKNOWN`). Portanto, uma coluna (ou par de colunas) `UNIQUE` **PERMITE inserir vários registros com `NULL`**!
> - Em `conta_bancaria`, `CONSTRAINT uq_agencia_conta UNIQUE (agencia, numero_conta)` permite `(NULL, '123')` repetido várias vezes se `agencia` não tiver `NOT NULL`.
> - Em `ECOMMERCE.CLIENTE`, `UNIQUE (email)` permite ter vários clientes sem e-mail (`email = NULL`), mas barra dois clientes com o mesmo e-mail preenchido.

### 4.3 `CHECK` (MySQL 8.0.16+) e Bugs Corrigidos das Anotações

> **Marco Histórico:** Versões antigas do MySQL (< 8.0.16) aceitavam a cláusula `CHECK` na sintaxe, mas a **ignoravam silenciosamente**! O enforcement real de `CHECK` só existe a partir do **MySQL 8.0.16**.

#### Armadilha 1: `NULL` passa no `CHECK`!
Uma constraint `CHECK` só barra o registro quando a expressão resulta em **`FALSE`**. Se o resultado for `TRUE` **ou `UNKNOWN` (causado por `NULL`)**, o MySQL **permite a inserção**!

```sql
CREATE TABLE funcionario (
    matricula INT AUTO_INCREMENT PRIMARY KEY,
    salario   DECIMAL(10,2), -- SEM NOT NULL!
    CONSTRAINT ck_func_salario CHECK (salario > 0)
);

INSERT INTO funcionario (salario) VALUES (NULL);   -- PASSA! (NULL > 0 é UNKNOWN)
INSERT INTO funcionario (salario) VALUES (-500);   -- FALHA! (ERROR 3819)
```
**Regra:** Sempre combine `NOT NULL` com `CHECK` quando a coluna for obrigatória (`salario DECIMAL(10,2) NOT NULL`).

#### Armadilha 2: Bug do `OR` dentro de `IN (...)` (Correção de `imovel`)
Na anotação antiga aparecia:
```sql
-- ERRADO: 'casa' OR 'apartamento' OR 'comercial' vira expressão booleana 0 -> tipo IN (0)!
CONSTRAINT ck_imovel_tipo CHECK (tipo IN ('casa' or 'apartamento' or 'comercial'))
```
Em SQL, itens dentro de `IN (...)` devem ser separados por **vírgula**, nunca por `OR`.

```sql
-- ✅ CORRETO:
CREATE TABLE imovel (
    id_imovel INT AUTO_INCREMENT PRIMARY KEY,
    tipo      VARCHAR(50) NOT NULL,
    CONSTRAINT ck_imovel_tipo CHECK (tipo IN ('casa', 'apartamento', 'comercial'))
);
```

#### Armadilha 3: Bug do `OR 'N'` sem repetir a coluna (Correção de `pesquisa`)
Na anotação antiga aparecia:
```sql
-- ERRADO: avaliado como (recomenda = 'S') OR ('N'), onde 'N' é avaliado como booleano (0)
recomenda CHAR NOT NULL CHECK (recomenda = 'S' or 'N')
```
Em SQL, cada condição ligada por `OR` deve ser uma comparação completa — ou, melhor ainda, usar `IN`:

```sql
-- ✅ CORRETO (forma recomendada com IN):
CREATE TABLE pesquisa (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    nota      TINYINT NOT NULL,
    recomenda CHAR(1) NOT NULL,
    CONSTRAINT ck_pesquisa_nota CHECK (nota BETWEEN 1 AND 5),
    CONSTRAINT ck_pesquisa_recomenda CHECK (recomenda IN ('S', 'N'))
);
-- Alternativa válida: CHECK (recomenda = 'S' OR recomenda = 'N')
```

---

## 5. Integridade Referencial (`FOREIGN KEY`) e Ações em Cascata

Uma `FOREIGN KEY` (chave estrangeira) garante que todo valor não-nulo na tabela **filha** corresponda a um valor existente na coluna `PRIMARY KEY` (ou `UNIQUE`) da tabela **pai**.

### 5.1 Requisitos Obrigatórios no InnoDB (MySQL 8.x)

1. Ambas as tabelas devem usar engine **`InnoDB`** (padrão no MySQL 8.x).
2. As colunas pai e filha devem ter **exatamente o mesmo tipo e sinal** (`INT` com `INT`, `INT UNSIGNED` com `INT UNSIGNED` — misturar `INT` com `BIGINT` ou `INT` com `INT UNSIGNED` gera erro `ERROR 3780: Referencing column ... and referenced column ... are incompatible`).
3. A coluna referenciada na tabela pai deve ser indexada (`PRIMARY KEY` ou `UNIQUE` / `INDEX`).
4. Para inserir na tabela filha, o registro pai deve existir antes (ou usar `NULL` se a FK for anulável). Para excluir/dropar, exclua os filhos (ou a tabela filha) antes do pai.

### 5.2 Ações Referenciais (`ON DELETE` e `ON UPDATE`)

| Ação | Comportamento no `ON DELETE` (apagar pai) | Comportamento no `ON UPDATE` (alterar PK do pai) | Observação Crítica MySQL / InnoDB |
|---|---|---|---|
| **`RESTRICT`** | **Bloqueia** a exclusão do pai se houver filhos (`ERROR 1451`). | **Bloqueia** a alteração da PK do pai se houver filhos. | Padrão quando omitido; verificado imediatamente. |
| **`NO ACTION`** | No MySQL, idêntico a `RESTRICT` (bloqueia imediatamente). | Idêntico a `RESTRICT`. | Em outros SGBDs (PostgreSQL) pode ser adiado até o `COMMIT` (`DEFERRABLE`), no MySQL não. |
| **`CASCADE`** | **Apaga automaticamente** todas as linhas filhas associadas. | **Atualiza automaticamente** o valor da FK em todas as linhas filhas. | Muito usado em `ON DELETE CASCADE` (ex.: `pedido` → `item_pedido`) e `ON UPDATE CASCADE` em PK natural (ex.: `uf`). |
| **`SET NULL`** | Define a coluna FK dos filhos como **`NULL`**. | Define a coluna FK dos filhos como **`NULL`**. | **Exige que a coluna FK permita `NULL`!** Se a FK for `NOT NULL`, a criação falha. |
| **`SET DEFAULT`** | *(Não suportado funcionalmente no InnoDB)* | *(Não suportado funcionalmente no InnoDB)* | **Pegadinha clássica:** Embora prevista no padrão SQL ANSI, **o InnoDB não executa `SET DEFAULT`**. Em versões mais antigas do MySQL, o `CREATE TABLE` falhava na hora; no MySQL 8.x, o parser aceita a cláusula, mas o InnoDB bloqueia a exclusão/alteração do pai com `ERROR 1451` (como `RESTRICT`), nunca aplicando o `DEFAULT`. |

### 5.3 Exemplos Práticos Completos (Simples, Composta e Auto-relacionamento)

```sql
-- 1. FK Simples + RESTRICT (padrão) e CASCADE
CREATE TABLE projeto (
    id_projeto INT AUTO_INCREMENT PRIMARY KEY,
    nome       VARCHAR(50) NOT NULL
);

CREATE TABLE tarefa (
    id_tarefa  INT AUTO_INCREMENT PRIMARY KEY,
    descricao  VARCHAR(100) NOT NULL,
    id_projeto INT NOT NULL,
    CONSTRAINT fk_tarefa_projeto
        FOREIGN KEY (id_projeto) REFERENCES projeto(id_projeto)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- 2. FK com SET NULL (coluna id_depto PRECISA aceitar NULL)
CREATE TABLE departamento (
    id_depto INT AUTO_INCREMENT PRIMARY KEY,
    nome     VARCHAR(50) NOT NULL
);

CREATE TABLE colaborador (
    id_colab INT AUTO_INCREMENT PRIMARY KEY,
    nome     VARCHAR(80) NOT NULL,
    id_depto INT NULL,
    CONSTRAINT fk_colab_depto
        FOREIGN KEY (id_depto) REFERENCES departamento(id_depto)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- 3. FK Composta (referenciando PK composta de tabela associativa)
CREATE TABLE turma_disciplina (
    id_turma       INT NOT NULL,
    cod_disciplina INT NOT NULL,
    CONSTRAINT pk_turma_disc PRIMARY KEY (id_turma, cod_disciplina)
);

CREATE TABLE avaliacao_turma (
    id_avaliacao   INT AUTO_INCREMENT PRIMARY KEY,
    id_turma       INT NOT NULL,
    cod_disciplina INT NOT NULL,
    titulo         VARCHAR(60) NOT NULL,
    CONSTRAINT fk_aval_turma_disc
        FOREIGN KEY (id_turma, cod_disciplina)
        REFERENCES turma_disciplina(id_turma, cod_disciplina)
        ON DELETE CASCADE
);
```

---

## 6. `DELETE` vs `TRUNCATE` vs `DROP` (Limitações Críticas do `TRUNCATE`)

Nas anotações antigas, o `TRUNCATE` era descrito apenas como "destrói e recria a tabela vazia e reseta o `AUTO_INCREMENT`". No **MySQL 8.x (`InnoDB`)**, há **armadilhas fundamentais** que caem em prova:

| Critério | `DELETE FROM tab WHERE ...` | `TRUNCATE TABLE tab` | `DROP TABLE tab` |
|---|---|---|---|
| **Categoria SQL** | **DML** | **DDL** | **DDL** |
| **Permite `WHERE`?** | Sim (sem `WHERE`, apaga tudo) | **Não** (sempre esvazia tudo) | **Não** (remove tabela e estrutura) |
| **Aceita `ROLLBACK`?** | **Sim** (dentro de transação) | **Não** (commit implícito!) | **Não** (commit implícito!) |
| **Reseta `AUTO_INCREMENT`?** | **Não** | **Sim** (volta para `1`) | Remove a tabela inteira |
| **Dispara triggers `DELETE`?** | **Sim** (linha por linha) | **Não** | **Não** |
| **Com `FOREIGN KEY` apontando para ela** | Apaga se não houver filhos (ou executa `CASCADE` / `SET NULL`) | **FALHA com `ERROR 1701 (42000)`**, **mesmo se a tabela filha estiver completamente vazia!** | **FALHA com `ERROR 3730`** enquanto houver FK apontando para ela |

```sql
-- Exemplo da armadilha do TRUNCATE com FK:
-- Mesmo que 'tarefa' esteja vazia (0 linhas), o comando abaixo FALHA:
TRUNCATE TABLE projeto;
-- ERROR 1701 (42000): Cannot truncate a table referenced in a foreign key constraint

-- Alternativa transacional segura quando há FKs:
DELETE FROM projeto; -- funciona se 'tarefa' estiver vazia ou se a FK for ON DELETE CASCADE
```

> **Atenção na Prova:** Se uma questão perguntar *"É possível desfazer um `TRUNCATE TABLE` com `ROLLBACK` no MySQL?"* ou *"O `TRUNCATE` funciona em tabela referenciada por FK se a tabela filha estiver vazia?"*, a resposta para **ambas** é **NÃO**!

---

## 7. Erros Comuns (Resumo Rápido)

- Usar `FLOAT` para dinheiro ou notas → usar `DECIMAL(M,D)`.
- Usar `DECIMAL(4,2)` para percentual até 100% → só chega a `99.99`; usar `DECIMAL(5,2)`.
- Usar `SMALLINT` com sinal para porta TCP → vai só até `32767`; usar `SMALLINT UNSIGNED`.
- Escrever data no formato `'dd/mm/yyyy'` ou com 3 dígitos no ano em `INSERT` → MySQL exige `'YYYY-MM-DD'`.
- Usar `OR` dentro da lista do `IN (...)` ou omitir o nome da coluna após `OR` no `CHECK` → ✅ correto: usar vírgulas no `IN ('a', 'b')` e repetir a coluna em `CHECK (col = 'S' OR col = 'N')`.
- Esquecer `NOT NULL` em coluna com `CHECK` → `NULL` passa no `CHECK` (`UNKNOWN` não viola a regra).
- Tentar usar `ON DELETE SET DEFAULT` no InnoDB → não é suportado no MySQL.

---

> **Prática Completa:** Resolva e execute os 65 exercícios comentados no [Caderno de Exercícios DDL, Tipos, PKs e FKs](../exercicios/01-caderno-ddl-tipos-pks-fks.md).
> **Próximo passo teórico:** [03 — DML, CRUD e Transações →](./03-dml-crud-e-transacoes.md)
