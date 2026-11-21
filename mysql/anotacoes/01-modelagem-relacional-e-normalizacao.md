# 01 — Modelagem Relacional e Normalização (1FN, 2FN, 3FN e BCNF)

> **Navegação:** [Índice MySQL](../README.md) | [Próximo: DDL, Tipos de Dados e Constraints →](./02-ddl-tipos-dados-e-constraints.md)

Guia completo de modelagem de bancos relacionais — do modelo conceitual (MER/DER) à normalização até a 3ª Forma Normal (3FN) e BCNF — encerrando com um **estudo de caso real** extraído e corrigido do arquivo [`aula-cidao-qua.architect`](../arquivos-originais/aula-cidao-qua.architect).

---

## 1. As Três Fases da Modelagem de Dados

Antes de escrever qualquer `CREATE TABLE`, o projeto de banco de dados passa por três níveis de abstração:

| Fase | Artefato | Foco Principal | Exemplo |
|---|---|---|---|
| **1. Conceitual** | MER / DER (Diagrama Entidade-Relacionamento) | Regras de negócio, entidades, atributos e cardinalidades, independente de SGBD. | Entidade `CLIENTE` realiza `PEDIDO`. |
| **2. Lógica** | Modelo Relacional (tabelas, colunas, PK, FK) | Transformar entidades e relacionamentos em tabelas normalizadas, resolvendo `N:N` e atributos multivalorados. | Tabela `ITEMPEDIDO (pedido_id, produto_id, quantidade, preco_unitario)`. |
| **3. Física** | Script DDL (`CREATE TABLE`) | Tipos concretos do SGBD (MySQL 8.x), tamanhos, `CHECK`, índices e engine (`InnoDB`). | `preco_unitario DECIMAL(10,2) NOT NULL`. |

---

## 2. Conceitos do MER / DER

### 2.1 Entidades e Atributos

- **Entidade Forte:** existe por si só e possui chave primária própria (ex.: `CLIENTE`, `PRODUTO`, `CATEGORIA`).
- **Entidade Fraca:** depende de outra entidade para existir e normalmente compõe sua chave primária com a chave da entidade dona (ex.: `ITEMPEDIDO` depende de `PEDIDO`; `DEPENDENTE` depende de `FUNCIONARIO`).
- **Tipos de Atributos:**
  - **Simples (atômico):** não se divide (ex.: `cpf`, `preco_unitario`).
  - **Composto:** pode ser subdividido em partes com significado próprio (ex.: `endereco` → `logradouro`, `numero`, `bairro`, `cep`, `cidade`, `uf`). No modelo físico, costuma ser decomposto em colunas separadas.
  - **Multivalorado:** um registro pode ter vários valores simultaneamente (ex.: vários telefones ou vários serviços de streaming). No modelo relacional, **não vira várias colunas** (`tel1, tel2, tel3`) nem texto separado por vírgula — **vira outra tabela** relacionada em `1:N`.
  - **Derivado (calculado):** pode ser obtido a partir de outros dados (ex.: `idade` a partir de `data_nascimento`, ou `valor_estoque = estoque * preco_unitario`). Em regra, **não se armazena fisicamente** (usa-se `VIEW`, consulta ou coluna gerada) para evitar inconsistência.
  - **Identificador:** atributo (ou conjunto) que distingue unicamente cada ocorrência (vira `PRIMARY KEY`).

### 2.2 Cardinalidades e Mapeamento para Tabelas

| Cardinalidade | Significado | Como implementar no Modelo Relacional (MySQL) |
|---|---|---|
| **`1:1`** (Um para Um) | Cada A se associa a no máximo 1 B, e vice-versa. | `FK` + `UNIQUE` em uma das tabelas (preferencialmente no lado opcional) ou PK compartilhada (`id` é PK e FK ao mesmo tempo). |
| **`1:N`** (Um para Muitos) | 1 A pode se associar a vários B; cada B pertence a no máximo 1 A. | A chave primária do lado `1` migra como `FOREIGN KEY` para a tabela do lado `N` (ex.: `CATEGORIA (1) -> (N) PRODUTO` via `categoria_id`). |
| **`N:N`** (Muitos para Muitos) | Vários A se associam a vários B. | **Cria-se uma tabela associativa (intermediária)** contendo as FKs de ambas as tabelas, formando geralmente uma **PK composta** (ou PK surrogate + `UNIQUE(fk1, fk2)`). |
| **Auto-relacionamento (Recursivo)** | Uma entidade se relaciona com ela mesma (`1:N` ou `N:N`). | Uma coluna `FK` aponta para a própria `PK` da tabela (aceitando `NULL` para o nó raiz). |

#### Exemplo Prático de Auto-relacionamento (`VENDEDOR` no `ECOMMERCE`)

No schema `ECOMMERCE`, todo vendedor pode ter um gerente, que também é um registro da tabela `VENDEDOR`. O diretor no topo da hierarquia possui `gerente_id = NULL`:

```sql
CREATE TABLE VENDEDOR (
    idvendedor INT NOT NULL,
    nome       VARCHAR(30) NOT NULL,
    gerente_id INT NULL,
    CONSTRAINT vendedor_pk PRIMARY KEY (idvendedor),
    CONSTRAINT gerente_vendedor_fk
        FOREIGN KEY (gerente_id) REFERENCES VENDEDOR(idvendedor)
);
```

> **Atenção na Prova:** Relacionamentos `N:N` **nunca** existem diretamente em tabelas físicas relacionais. Sempre exigem uma **tabela associativa** (ex.: `PEDIDO` × `PRODUTO` → `ITEMPEDIDO`; `PESSOA` × `EVENTO` → `participacao_evento`).

---

## 3. Normalização (1FN, 2FN, 3FN e BCNF)

Normalizar é organizar colunas e tabelas para **eliminar redundâncias** e evitar três anomalias clássicas:
1. **Anomalia de Inserção:** não conseguir cadastrar um dado sem ter que inventar outro (ex.: não poder cadastrar uma categoria sem existir um produto).
2. **Anomalia de Atualização:** precisar atualizar o mesmo fato em várias linhas e correr o risco de deixar cópias divergentes.
3. **Anomalia de Exclusão:** ao apagar um registro, perder sem querer a única referência de outra entidade (ex.: apagar o último pedido de um cliente e perder o cadastro do cliente).

### 3.1 Primeira Forma Normal (1FN)

**Regra:** Uma tabela está na **1FN** quando:
- Todos os atributos contêm apenas **valores atômicos** (indivisíveis — nada de lista separada por vírgula em uma célula);
- **Não há grupos repetitivos de colunas** (ex.: `telefone1, telefone2, telefone3` ou `netflix, amazon_prime, hbo`).

**Errado (viola 1FN):**

| id_pessoa | nome | telefones |
|---|---|---|
| 1 | Ana | `1199999-0001, 1198888-0002` |

**Certo (1FN — separa entidade multivalorada em tabela filha `1:N`):**

```sql
CREATE TABLE pessoa (
    id_pessoa INT PRIMARY KEY,
    nome      VARCHAR(80) NOT NULL
);

CREATE TABLE pessoa_telefone (
    id_telefone INT AUTO_INCREMENT PRIMARY KEY,
    id_pessoa   INT NOT NULL,
    telefone    VARCHAR(20) NOT NULL,
    CONSTRAINT fk_tel_pessoa FOREIGN KEY (id_pessoa) REFERENCES pessoa(id_pessoa)
);
```

### 3.2 Segunda Forma Normal (2FN)

**Regra:** Uma tabela está na **2FN** quando:
- Já está na **1FN**; **e**
- **Não existem dependências parciais**: todo atributo não-chave depende da **chave primária inteira** (e não apenas de parte dela).

> **Dica rápida:** Se a tabela tem **chave primária simples** (1 única coluna) e está na 1FN, ela **já está automaticamente na 2FN**! A 2FN só precisa ser verificada quando a PK é **composta**.

**Errado (viola 2FN):**
Em `ITEMPEDIDO` com PK composta `(pedido_id, produto_id)`:

```text
ITEMPEDIDO (pedido_id [PK], produto_id [PK], nome_produto, quantidade, preco_unitario)
```
Aqui, `nome_produto` depende **apenas** de `produto_id` (parte da PK), não do par `(pedido_id, produto_id)`. Se o nome do produto mudar, seria necessário atualizar milhares de linhas em `ITEMPEDIDO`.

**Certo (2FN):**
Mover `nome_produto` para `PRODUTO (idproduto [PK], nome, ...)`. Em `ITEMPEDIDO`, ficam apenas os atributos que dependem do item naquele pedido específico (`quantidade` e `preco_unitario` praticado no momento da venda).

### 3.3 Terceira Forma Normal (3FN)

**Regra:** Uma tabela está na **3FN** quando:
- Já está na **2FN**; **e**
- **Não existem dependências transitivas**: nenhum atributo não-chave depende de outro atributo não-chave (`PK → A → B`).

**Errado (viola 3FN):**

```text
PRODUTO (idproduto [PK], nome, categoria_id, nome_categoria)
```
`nome_categoria` depende de `categoria_id` (que não é chave da tabela `PRODUTO`), gerando dependência transitiva `idproduto → categoria_id → nome_categoria`.

**Certo (3FN):**
`CATEGORIA (idcategoria [PK], nome)` fica separada, e `PRODUTO` armazena apenas `categoria_id` como `FOREIGN KEY`.

> **Regra prática complementar (3FN):** Evite também armazenar **colunas calculáveis/derivadas** de outras colunas ou de agregações de tabelas filhas (como `total_itens` ou `qtd_assinaturas`), pois qualquer falha de atualização gera dados inconsistentes — prefira `VIEW` ou consulta agregada (ou trigger/transação controlada quando houver necessidade real de snapshot histórico, como `PEDIDO.total_pedido` ou `ITEMPEDIDO.preco_unitario` no instante da compra).

### 3.4 Menção à BCNF (Forma Normal de Boyce-Codd)

A **BCNF** é um refinamento mais estrito da 3FN: **para toda dependência funcional não-trivial `X → Y`, `X` deve ser uma superchave (chave candidata)**.
Ela aparece em casos raros onde há **múltiplas chaves candidatas compostas sobrepostas** e um atributo não-chave (ou parte de uma chave) determina parte de outra chave candidata (ex.: aluno + disciplina → professor, onde cada professor leciona apenas 1 disciplina: `professor → disciplina`). Nesses casos, decompõe-se a tabela para garantir que todo determinante seja chave.

### Resumo das Formas Normais

| Forma Normal | Regra Central ("Mantra de Prova") | O que elimina |
|---|---|---|
| **1FN** | Valores atômicos; sem grupos repetitivos. | Listas na célula, colunas numeradas (`tel1, tel2`) ou flags fixas por item. |
| **2FN** | 1FN + sem dependência parcial (vale para PK composta). | Atributo que depende só de **metade** da PK composta. |
| **3FN** | 2FN + sem dependência transitiva. | Atributo não-chave que depende de **outro atributo não-chave** (e dados derivados sem justificativa). |
| **BCNF** | Todo determinante é chave candidata. | Anomalias entre chaves candidatas compostas sobrepostas. |

---

## 4. Estudo de Caso Real: Diagnóstico e Correção de `aula-cidao-qua.architect`

O arquivo [`mysql/arquivos-originais/aula-cidao-qua.architect`](../arquivos-originais/aula-cidao-qua.architect) (projeto SQL Power Architect `"aula cidao qua"`) modela um sistema real para gerenciar **rateios de eventos (churrascos) e rateios de assinaturas de streaming** entre alunos (`cadastro_pessoas`).

### 4.1 Inventário do Arquivo Original (8 Tabelas e 6 FKs)

Ao inspecionar o XML do `.architect`, encontramos **8 tabelas** e **6 relacionamentos (`FOREIGN KEY`)**:

| # | Tabela Física (`physicalName`) | Colunas no XML | PK Definida | FKs de Entrada (`<relationships>`) |
|---|---|---|---|---|
| 1 | `cadastro_pessoas` | `ra_pessoa` (INT), `nome_pessoa` (VARCHAR 50), `email_pessoa` (VARCHAR 50, `UNIQUE`) | `ra_pessoa` | — (tabela pai) |
| 2 | `Evento` | `id_evento` (INT AI), `aluno_criador` (INT), `dt_evento` (DATE), `nm_evento` (VARCHAR 50), `lcl_evento` (VARCHAR 50), `vlr_evento` (DECIMAL 7,2), `ra_pessoa` (INT) | `id_evento` | `REL55`: `ra_pessoa → cadastro_pessoas(ra_pessoa)` |
| 3 | `participacao_evento` | `ra_pessoa` (INT), `id_evento` (INT), `status` (VARCHAR 12), `data_inscricao` (DATE) | `(ra_pessoa, id_evento)` | `REL57`: `ra_pessoa → cadastro_pessoas`; `REL63`: `id_evento → Evento` |
| 4 | `vaquinha_evento` | `id_evento` (INT), `ra_pessoa` (INT), `item_evento` (VARCHAR 40), `valor_item_evento` (DECIMAL 7,2), `status_pagamento` (BOOLEAN) | `(id_evento, ra_pessoa)` | `REL59`: `ra_pessoa → cadastro_pessoas`; `REL65`: `id_evento → Evento` |
| 5 | `vaquinha_streaming` | `id_assinatura` (INT), `dt_assinatura` (DATE) | `id_assinatura` | **Nenhuma (tabela isolada)** |
| 6 | `tabela_assinatura` | `ra_pessoa` (INT), `status_assinante` (BOOLEAN), `qtd_assinatura` (INT) | `(ra_pessoa, status_assinante)` | `REL61`: `ra_pessoa → cadastro_pessoas` |
| 7 | `tipos_streaming` | `Netflix` (BOOLEAN), `amazon_prime` (BOOLEAN), `HBO` (BOOLEAN) | **Índice PK vazio (0 colunas!)** | **Nenhuma (tabela isolada)** |
| 8 | `tabela_devedores_evento` | **0 colunas!** (nome lógico: `"Tabela Devedores (Streaming e evento?) - Seprando por ID unico p/ evento e streaming ?"`) | **Índice PK vazio (0 colunas!)** | **Nenhuma (tabela isolada)** |

### 4.2 Acertos do Modelo Original

- Boa identificação de `cadastro_pessoas` com `ra_pessoa` como PK e `UNIQUE` em `email_pessoa`.
- Uso correto de **tabela associativa** em `participacao_evento` com PK composta `(ra_pessoa, id_evento)` resolvendo o `N:N` entre pessoas e eventos.
- Definição de tipos monetários corretos (`DECIMAL(7,2)`) em vez de `FLOAT`.

### 4.3 Problemas Encontrados e Soluções Aplicadas

| # | Problema no `.architect` | Violação / Anti-padrão | Como Corrigir |
|---|---|---|---|
| 1 | **`tipos_streaming` com colunas `Netflix`, `amazon_prime`, `HBO` (booleanas) e sem PK** | **Viola 1FN** (grupo repetitivo em colunas) e falha de integridade (sem PK). Cada novo streaming (ex.: Disney+) exigiria `ALTER TABLE`. | Transformar em tabela normalizada `servico_streaming (id_servico [PK], nome_servico [UNIQUE], valor_mensal)`. |
| 2 | **`tabela_assinatura` com PK `(ra_pessoa, status_assinante)`** | **PK booleana inválida!** Um `BOOLEAN` só tem 2 valores (`TRUE`/`FALSE`), o que impede uma pessoa de participar de mais de 1 grupo de streaming ativo e não identifica qual assinatura ela assinou. | Substituir por `grupo_streaming` (`N:1` com `servico_streaming`) e associativa `assinatura_participante (id_grupo, ra_pessoa)` + `cobranca_streaming`. |
| 3 | **`vaquinha_evento` com PK `(id_evento, ra_pessoa)`** | **PK impeditiva:** impede que a mesma pessoa leve ou pague **dois itens diferentes** (ex.: carvão e refrigerante) no mesmo evento! | Criar `id_item INT AUTO_INCREMENT PRIMARY KEY` em `vaquinha_evento_item` (mantendo FKs para `evento` e `pessoa`, ou FK composta para `participacao_evento`). |
| 4 | **`Evento.aluno_criador` duplicando `Evento.ra_pessoa`** | **Atributo redundante:** `aluno_criador` é um `INT` solto sem FK, enquanto `ra_pessoa` na mesma tabela já referencia o criador em `cadastro_pessoas`. | Remover `aluno_criador` e renomear a FK para um nome claro: `ra_criador`. |
| 5 | **`Evento.vlr_evento` e `tabela_assinatura.qtd_assinatura`** | **Atributos derivados/agregados** sujeitos a anomalia de atualização (ficam desatualizados ao inserir/excluir itens ou assinaturas). | Remover as colunas redundantes e calcular dinamicamente via `SUM()` / `COUNT()` em consultas ou `VIEW`s. |
| 6 | **`tabela_devedores_evento` vazia e dúvida de "ID único p/ evento e streaming"** | **Redundância + Anti-padrão de FK Polimórfica:** devedor é quem tem `status_pagamento = FALSE`; criar uma tabela extra duplica esse estado. Além disso, colocar `id_origem` apontando ora para `evento`, ora para `streaming`, quebra o conceito de `FOREIGN KEY` nativa no MySQL (FK polimórfica não garante integridade referencial!). | **Não criar tabela física de devedores.** Expor os devedores com segurança via **`VIEW`** (`vw_devedores`), consolidando eventos e streamings com `UNION ALL` tipado (`origem = 'EVENTO'` vs `'STREAMING'`). |
| 7 | **Tabelas isoladas (`vaquinha_streaming`, `tipos_streaming`)** | Falta de conexão relacional no grafo (`0` FKs). | Conectar `servico_streaming` → `grupo_streaming` → `assinatura_participante` → `cobranca_streaming`. |

### 4.4 Script DDL Corrigido em 3FN + `VIEW` de Devedores (MySQL 8.x)

O script abaixo corrige todas as falhas de modelagem do `.architect`, mantém compatibilidade com `InnoDB` e `CHECK` do MySQL 8.0.16+ e foi validado diretamente no MySQL 8.4.3:

```sql
DROP DATABASE IF EXISTS rateio_turma;
CREATE DATABASE rateio_turma
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE rateio_turma;

-- 1. Pessoas (antes: cadastro_pessoas)
CREATE TABLE pessoa (
    ra_pessoa INT NOT NULL,
    nome      VARCHAR(80) NOT NULL,
    email     VARCHAR(100) NOT NULL,
    CONSTRAINT pk_pessoa PRIMARY KEY (ra_pessoa),
    CONSTRAINT uq_pessoa_email UNIQUE (email)
);

-- 2. Eventos (removidos aluno_criador duplicado e vlr_evento derivado)
CREATE TABLE evento (
    id_evento  INT AUTO_INCREMENT NOT NULL,
    ra_criador INT NOT NULL,
    nm_evento  VARCHAR(80) NOT NULL,
    dt_evento  DATE NOT NULL,
    lcl_evento VARCHAR(80) NOT NULL,
    CONSTRAINT pk_evento PRIMARY KEY (id_evento),
    CONSTRAINT fk_evento_criador
        FOREIGN KEY (ra_criador) REFERENCES pessoa(ra_pessoa)
);

-- 3. Participação no Evento (associativa N:N com domínio controlado em status)
CREATE TABLE participacao_evento (
    ra_pessoa      INT NOT NULL,
    id_evento      INT NOT NULL,
    status         ENUM('Confirmado', 'Pendente', 'Cancelado', 'Lista de Espera')
                       NOT NULL DEFAULT 'Pendente',
    data_inscricao DATE NOT NULL,
    CONSTRAINT pk_participacao_evento PRIMARY KEY (ra_pessoa, id_evento),
    CONSTRAINT fk_part_pessoa FOREIGN KEY (ra_pessoa) REFERENCES pessoa(ra_pessoa),
    CONSTRAINT fk_part_evento FOREIGN KEY (id_evento) REFERENCES evento(id_evento)
);

-- 4. Itens da Vaquinha do Evento
-- PK surrogate id_item permite que uma mesma pessoa contribua com mais de 1 item no mesmo evento.
-- FK composta para participacao_evento garante que só participante inscrito contribui no rateio.
CREATE TABLE vaquinha_evento_item (
    id_item     INT AUTO_INCREMENT NOT NULL,
    id_evento   INT NOT NULL,
    ra_pessoa   INT NOT NULL,
    item_evento VARCHAR(60) NOT NULL,
    valor_item  DECIMAL(10,2) NOT NULL,
    pago        BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_vaquinha_item PRIMARY KEY (id_item),
    CONSTRAINT ck_vaquinha_valor CHECK (valor_item > 0),
    CONSTRAINT fk_vaquinha_participacao
        FOREIGN KEY (ra_pessoa, id_evento)
        REFERENCES participacao_evento(ra_pessoa, id_evento)
);

-- 5. Catálogo de Serviços de Streaming (corrige violação de 1FN de tipos_streaming)
CREATE TABLE servico_streaming (
    id_servico   INT AUTO_INCREMENT NOT NULL,
    nome_servico VARCHAR(50) NOT NULL,
    valor_mensal DECIMAL(8,2) NOT NULL,
    CONSTRAINT pk_servico_streaming PRIMARY KEY (id_servico),
    CONSTRAINT uq_servico_nome UNIQUE (nome_servico),
    CONSTRAINT ck_servico_valor CHECK (valor_mensal > 0)
);

-- 6. Grupos de Rateio de Streaming (substitui vaquinha_streaming isolada)
CREATE TABLE grupo_streaming (
    id_grupo       INT AUTO_INCREMENT NOT NULL,
    id_servico     INT NOT NULL,
    ra_responsavel INT NOT NULL,
    nome_grupo     VARCHAR(60) NOT NULL,
    ativo          BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_grupo_streaming PRIMARY KEY (id_grupo),
    CONSTRAINT fk_grupo_servico
        FOREIGN KEY (id_servico) REFERENCES servico_streaming(id_servico),
    CONSTRAINT fk_grupo_responsavel
        FOREIGN KEY (ra_responsavel) REFERENCES pessoa(ra_pessoa)
);

-- 7. Participantes de cada Grupo de Streaming (substitui PK booleana de tabela_assinatura)
CREATE TABLE assinatura_participante (
    id_grupo     INT NOT NULL,
    ra_pessoa    INT NOT NULL,
    data_entrada DATE NOT NULL,
    ativo        BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_assinatura_part PRIMARY KEY (id_grupo, ra_pessoa),
    CONSTRAINT fk_ass_grupo FOREIGN KEY (id_grupo) REFERENCES grupo_streaming(id_grupo),
    CONSTRAINT fk_ass_pessoa FOREIGN KEY (ra_pessoa) REFERENCES pessoa(ra_pessoa)
);

-- 8. Cobranças Mensais de Streaming (rateio por competência YYYY-MM)
CREATE TABLE cobranca_streaming (
    id_cobranca INT AUTO_INCREMENT NOT NULL,
    id_grupo    INT NOT NULL,
    ra_pessoa   INT NOT NULL,
    competencia CHAR(7) NOT NULL, -- formato YYYY-MM
    valor_cota  DECIMAL(8,2) NOT NULL,
    pago        BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cobranca_streaming PRIMARY KEY (id_cobranca),
    CONSTRAINT uq_cobranca_competencia UNIQUE (id_grupo, ra_pessoa, competencia),
    CONSTRAINT ck_cobranca_valor CHECK (valor_cota > 0),
    CONSTRAINT ck_cobranca_competencia CHECK (competencia REGEXP '^[0-9]{4}-[0-9]{2}$'),
    CONSTRAINT fk_cobranca_participante
        FOREIGN KEY (id_grupo, ra_pessoa)
        REFERENCES assinatura_participante(id_grupo, ra_pessoa)
);

-- 9. Solução para tabela_devedores_evento: VIEW sem redundância e sem FK polimórfica
CREATE OR REPLACE VIEW vw_devedores AS
SELECT
    'EVENTO'           AS origem,
    e.id_evento        AS id_referencia,
    e.nm_evento        AS titulo,
    p.ra_pessoa,
    p.nome             AS devedor,
    v.item_evento      AS descricao_pendencia,
    v.valor_item       AS valor_devido
FROM vaquinha_evento_item v
INNER JOIN evento e ON e.id_evento = v.id_evento
INNER JOIN pessoa p ON p.ra_pessoa = v.ra_pessoa
WHERE v.pago = FALSE

UNION ALL

SELECT
    'STREAMING'        AS origem,
    g.id_grupo         AS id_referencia,
    CONCAT(s.nome_servico, ' - ', g.nome_grupo) AS titulo,
    p.ra_pessoa,
    p.nome             AS devedor,
    CONCAT('Competencia ', c.competencia) AS descricao_pendencia,
    c.valor_cota       AS valor_devido
FROM cobranca_streaming c
INNER JOIN grupo_streaming g   ON g.id_grupo = c.id_grupo
INNER JOIN servico_streaming s ON s.id_servico = g.id_servico
INNER JOIN pessoa p            ON p.ra_pessoa = c.ra_pessoa
WHERE c.pago = FALSE;
```

### 4.5 Testando o Modelo Corrigido com Dados de Exemplo

```sql
INSERT INTO pessoa (ra_pessoa, nome, email) VALUES
    (101, 'Lucas Almeida', 'lucas@faculdade.br'),
    (102, 'Mariana Costa', 'mariana@faculdade.br');

INSERT INTO evento (ra_criador, nm_evento, dt_evento, lcl_evento) VALUES
    (101, 'Churrasco Fim de Semestre', '2026-11-28', 'Chacara Recanto');

INSERT INTO participacao_evento (ra_pessoa, id_evento, status, data_inscricao) VALUES
    (101, 1, 'Confirmado', '2026-11-10'),
    (102, 1, 'Confirmado', '2026-11-11');

-- Agora Mariana consegue contribuir com DOIS itens diferentes no mesmo evento:
INSERT INTO vaquinha_evento_item (id_evento, ra_pessoa, item_evento, valor_item, pago) VALUES
    (1, 102, 'Carvao 5kg', 35.00, FALSE),
    (1, 102, 'Refrigerante 6x2L', 54.00, TRUE);

INSERT INTO servico_streaming (nome_servico, valor_mensal) VALUES
    ('Netflix 4K', 59.90),
    ('HBO Max', 39.90);

INSERT INTO grupo_streaming (id_servico, ra_responsavel, nome_grupo) VALUES
    (1, 101, 'Familia ADS');

INSERT INTO assinatura_participante (id_grupo, ra_pessoa, data_entrada) VALUES
    (1, 101, '2026-01-10'),
    (1, 102, '2026-01-10');

INSERT INTO cobranca_streaming (id_grupo, ra_pessoa, competencia, valor_cota, pago) VALUES
    (1, 101, '2026-11', 29.95, TRUE),
    (1, 102, '2026-11', 29.95, FALSE);

-- Consulta os devedores consolidados (sem duplicar dados):
SELECT * FROM vw_devedores;
```

---

## 5. Atenção na Prova

1. **PK composta não impede 2FN — mas exige checagem:** se uma tabela associativa tem PK `(A, B)`, qualquer coluna extra que dependa *só de A* ou *só de B* viola a **2FN**.
2. **Atributo booleano quase nunca deve fazer parte de PK:** `BOOLEAN` só possui 2 valores distintos (`0` e `1`). Colocá-lo na PK limita o histórico e a cardinalidade artificialmente (como em `tabela_assinatura`).
3. **Evite FK polimórfica:** nunca crie um par `(tipo_entidade, id_entidade)` tentando apontar uma única coluna para duas tabelas diferentes. O banco não consegue aplicar `FOREIGN KEY` nativa nisso. Use tabelas separadas + `VIEW` com `UNION ALL` (ou supertype/subtype).
4. **Valores derivados:** nunca crie tabela física só para guardar um filtro de outra (como `tabela_devedores` quando já existe `pago = FALSE`). Use `VIEW`.

---

## 6. Erros Comuns (Checklist de Diagnóstico)

- **Confundir 2FN com 3FN:**
  - *2FN:* atributo não-chave depende só de **parte da PK composta**.
  - *3FN:* atributo não-chave depende de **outro atributo não-chave** (mesmo com PK simples!).
- **Criar colunas `item1, item2, item3` ou `netflix, prime, hbo`:** violação clássica de **1FN** (grupos repetitivos).
- **Esquecer tabela associativa em `N:N`:** colocar lista de IDs separados por vírgula em um `VARCHAR` viola a 1FN e impossibilita `FOREIGN KEY` e `JOIN` eficientes.
- **Usar PK composta restritiva demais:** `(id_evento, ra_pessoa)` em `vaquinha_evento` impede múltiplos itens por pessoa no mesmo evento — se a ocorrência pode se repetir, use `id_item` surrogate ou inclua o discriminador na PK.

---

> **Próximo passo:** [02 — DDL, Tipos de Dados e Constraints →](./02-ddl-tipos-dados-e-constraints.md)
