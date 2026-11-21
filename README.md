# Banco de Dados — Fonte de Estudos Completa (MySQL & NoSQL / MongoDB)

Repositório de anotações de aula, guias teóricos revisados, gabaritos comentados e simulados práticos da disciplina de **Banco de Dados**, organizado em **duas frentes independentes**:

1. **[`mysql/`](./mysql/README.md) — Frente Relacional (MySQL 8.x / SQL):** Modelagem relacional, normalização (1FN–3FN/BCNF), DDL, tipos de dados, constraints (`PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK`, `DEFAULT`), DML e transações ACID, DQL e funções nativas, agregações (`GROUP BY`, `HAVING`, Window Functions), `JOIN`s, Subqueries, CTEs (`WITH` / `WITH RECURSIVE`), Views, Stored Procedures, Functions, Triggers, Índices, `EXPLAIN`, DCL e comparativo Oracle (`SCOTT`) → MySQL.
2. **[`nosql/`](./nosql/README.md) — Frente Não-Relacional (MongoDB / NoSQL — Foco em Prova):** Fundamentos NoSQL (Teorema CAP, BASE vs ACID, 4 modelos NoSQL, JSON vs BSON, `ObjectId`), CRUD completo e operadores no `mongosh`, Aggregation Pipeline (`$match`, `$group`, `$project`, `$unwind`, `$lookup`, `$bucket`, `$facet`, `$out`, `$merge`), Validação de Esquema (`$jsonSchema` do Nível 1 ao 10, `collMod`, `validationLevel`, `validationAction`, armadilha `additionalProperties: false` com `_id`), Índices (`createIndex`, regra ESR, `explain()`), Modelagem de Documentos (*Embedding* vs *Referencing*), Transações Multi-Documento, Replica Sets, Sharding, gabaritos comentados (GameZone + League of Legends) e simulado completo de prova.

---

## Navegação Rápida por Frente

| Frente | Índice Principal | Conteúdo Principal | Foco de Estudo |
| :--- | :--- | :--- | :--- |
| **NoSQL / MongoDB** | [`nosql/README.md`](./nosql/README.md) | 5 guias teóricos/práticos + 43 exercícios resolvidos (29 GameZone + 14 LoL) + Simulado de Prova + Bases e PDFs | **Prova de MongoDB (NoSQL)** (`mongosh`, CRUD, operadores, Aggregation Pipeline e `$jsonSchema`) |
| **MySQL / SQL** | [`mysql/README.md`](./mysql/README.md) | 8 guias teóricos/práticos + 65 exercícios DDL/PK/FK + Lista E-commerce (29 questões) + Guia Oracle `SCOTT` → MySQL | **Banco Relacional / SQL** (DDL, DML, DQL, `JOIN`s, `GROUP BY`/`HAVING`, Window Functions e objetos de banco) |

---

## Estrutura Completa do Repositório

```text
Repositorio/
├── README.md                                                     # Visão geral, estrutura das duas frentes e mapeamento completo
├── mysql/                                                        # FRENTE 1: MYSQL / SQL RELACIONAL
│   ├── README.md                                                 # Índice, trilha de estudos e cola rápida de MySQL 8.x
│   ├── anotacoes/
│   │   ├── 01-modelagem-relacional-e-normalizacao.md             # MER/DER, cardinalidades, 1FN/2FN/3FN/BCNF e análise do .architect
│   │   ├── 02-ddl-tipos-dados-e-constraints.md                   # CREATE/ALTER/DROP/TRUNCATE, tipos MySQL 8.x, PK, FK, UNIQUE, CHECK
│   │   ├── 03-dml-crud-e-transacoes.md                           # INSERT, UPDATE, DELETE, SQL_SAFE_UPDATES e transações ACID
│   │   ├── 04-dql-filtros-e-funcoes.md                           # SELECT, WHERE, operadores, CASE e funções de string/data/número
│   │   ├── 05-agregacao-groupby-e-window-functions.md            # COUNT/SUM/AVG/MIN/MAX, GROUP BY, HAVING e Window Functions (OVER)
│   │   ├── 06-joins-subqueries-e-ctes.md                         # INNER/LEFT/RIGHT/CROSS/SELF JOIN, UNION, Subqueries e CTEs (WITH)
│   │   ├── 07-views-procedures-functions-e-triggers.md           # Views, Stored Procedures, Functions e Triggers (OLD/NEW)
│   │   └── 08-indices-otimizacao-e-dcl.md                        # Índices B-Tree, EXPLAIN e controle de acesso DCL (GRANT/REVOKE)
│   ├── exercicios/
│   │   ├── 01-caderno-ddl-tipos-pks-fks.md                       # 65 exercícios resolvidos (Blocos 1 a 4: Tipos, PKs, Constraints e FKs)
│   │   ├── 02-lista-ecommerce-completa.md                        # Exercício realocado do README antigo: DDL + INSERTs + 29 questões + desafio gerente
│   │   └── 03-guia-oracle-para-mysql-scott.md                    # Auditoria linha a linha de segundo-bimestre.sql (Oracle SCOTT -> MySQL)
│   └── arquivos-originais/
│       ├── segundo-bimestre.sql                                  # Script SQL original preservado intacto (hash Git idêntico à main)
│       └── aula-cidao-qua.architect                              # Projeto SQL Power Architect preservado intacto
└── nosql/                                                        # FRENTE 2: NOSQL / MONGODB (FOCO NA PROVA)
    ├── README.md                                                 # Mapa de estudos para a prova, cola rápida mongosh e armadilhas
    ├── anotacoes/
    │   ├── 01-fundamentos-nosql-e-arquitetura-mongodb.md         # Teorema CAP, BASE vs ACID, 4 tipos NoSQL, BSON, ObjectId e mongosh
    │   ├── 02-crud-completo-e-operadores.md                      # CRUD completo, projeção, dot notation e todos os operadores
    │   ├── 03-aggregation-pipeline.md                            # Pipeline completo ($match, $group, $unwind, $lookup, $bucket, $facet)
    │   ├── 04-validacao-schema-e-indices.md                      # $jsonSchema (Níveis 1 a 10 corrigidos), collMod, ESR e explain()
    │   └── 05-modelagem-transacoes-e-escala.md                   # Embedding vs Referencing, padrões 1:1/1:N/N:N, Transações, Replica Set e Sharding
    ├── exercicios/
    │   ├── 01-gabaritos-gamezone-e-validacao-lol.md              # Gabarito comentado: 29 exercícios GameZone + 14 exercícios Validação LoL
    │   └── 02-simulado-prova-mongodb.md                          # Simulado de prova (12 questões teóricas + 8 práticas + gabarito comentado)
    ├── bases/
    │   ├── Base-Gamezone-Revisao.js                              # Script original da base GameZone preservado intacto
    │   └── Bases_Aula21102026.rar                                # Arquivo .rar com 6 datasets JSON preservado intacto (hash Git idêntico à main)
    └── materiais-aula/
        ├── Revisão-Geral-MongoDB.pdf                             # Apostila de revisão geral de MongoDB
        ├── Lista-Exercicios-Revisao-MongoDB-GameZone_Alunos.docx # Lista original de 29 exercícios GameZone
        └── validacao-de-esquema/
            ├── Aula_02_MongoDB_Restricoes_Progressiva.pdf        # Slides dos 10 níveis progressivos de $jsonSchema
            ├── Lista-Exercicios-Validacao-MongoDB-ALUNOS.pdf     # Lista original de 14 exercícios de validação (League of Legends)
            └── Validação-de-Esquema-no-MongoDB.pdf               # Material teórico de validação de esquema no MongoDB
```

---

## Mapeamento do Conteúdo (Origem na `main` → Destino na Branch `organização`)

Todos os **16 arquivos originais** da branch `main` foram auditados, mapeados, deduplicados e organizados nas duas frentes, mantendo os arquivos `.rar` e `.sql` (além dos binários/scripts de referência) com **conteúdo 100% intacto**:

| # | Arquivo Original (`main`) | Frente | Destino na Branch `organização` | Ação Realizada (Auditoria, Deduplicação e Reescrita) |
| :-: | :--- | :---: | :--- | :--- |
| 1 | `README.md` (original) | MySQL | [`mysql/exercicios/02-lista-ecommerce-completa.md`](./mysql/exercicios/02-lista-ecommerce-completa.md) | **Realocado e corrigido (R4):** diagrama ER preservado, `INSERT`s gerados, duplicata de `CREATE TABLE CATEGORIA` removida, locale `'pt_BR'` em `FORMAT()`, notas `COUNT`/`SUM`/`AVG` ajustadas e `LEFT JOIN` do gerente corrigido. |
| 2 | `exc` | MySQL | [`mysql/exercicios/01-caderno-ddl-tipos-pks-fks.md`](./mysql/exercicios/01-caderno-ddl-tipos-pks-fks.md) e [`mysql/anotacoes/02-ddl-tipos-dados-e-constraints.md`](./mysql/anotacoes/02-ddl-tipos-dados-e-constraints.md) | **Reescrito e expandido:** adicionadas PKs nas 20 tabelas do Bloco 1, corrigidos tipos (`DECIMAL`, `INT UNSIGNED`, `TEXT`, typo `notificao`) e consolidado com os Blocos 2, 3 e 4. |
| 3 | `Anotações de coisas que fui errando.md` | MySQL | [`mysql/anotacoes/02-ddl-tipos-dados-e-constraints.md`](./mysql/anotacoes/02-ddl-tipos-dados-e-constraints.md) e [`mysql/exercicios/01-caderno-ddl-tipos-pks-fks.md`](./mysql/exercicios/01-caderno-ddl-tipos-pks-fks.md) | **Corrigido e completado:** corrigidos os bugs críticos de `CHECK` com `OR` dentro de `IN` e de comparação booleana incompleta, tabela `DELETE` vs `TRUNCATE` vs `DROP` e completados os 15 exercícios do Bloco 4 (`FOREIGN KEY`, itens 51 a 65). |
| 4 | `Aula 26-08 DDL` | MySQL | [`mysql/anotacoes/03-dml-crud-e-transacoes.md`](./mysql/anotacoes/03-dml-crud-e-transacoes.md), [`04-dql-filtros-e-funcoes.md`](./mysql/anotacoes/04-dql-filtros-e-funcoes.md), [`05-agregacao-groupby-e-window-functions.md`](./mysql/anotacoes/05-agregacao-groupby-e-window-functions.md) e [`06-joins-subqueries-e-ctes.md`](./mysql/anotacoes/06-joins-subqueries-e-ctes.md) | **Deduplicado e corrigido:** removida a duplicação integral da lista `ECOMMERCE` e de `Aula 26-8 DML`; corrigidos valores trocados no `INSERT`, erro de `UPDATE` após `DROP COLUMN`, erros de digitação em nomes de coluna e adicionados `GROUP BY` nos `SELECT` com `SUM`/`AVG`. |
| 5 | `Aula 26-8 DML` | MySQL | [`mysql/anotacoes/03-dml-crud-e-transacoes.md`](./mysql/anotacoes/03-dml-crud-e-transacoes.md) | **Deduplicado e expandido:** era subconjunto exato das linhas 1–91 de `Aula 26-08 DDL`; consolidado no Guia 03 com `INSERT`, `UPDATE`, `DELETE`, `SQL_SAFE_UPDATES` e transações ACID. |
| 6 | `segundo-bimestre.sql` | MySQL | [`mysql/arquivos-originais/segundo-bimestre.sql`](./mysql/arquivos-originais/segundo-bimestre.sql) + guia em [`mysql/exercicios/03-guia-oracle-para-mysql-scott.md`](./mysql/exercicios/03-guia-oracle-para-mysql-scott.md) | **Preservado intacto (R1 — blob `89e5b444`):** arquivo original movido sem alterações; criado guia dedicado corrigindo o nome do schema `scott.emp`, o `;` antes de `HAVING`, a omissão do operador `IN`, o espaço indevido antes dos parênteses em `COUNT(e.empno)` e o script `SCOTT` para MySQL 8.x. |
| 7 | `aula cidao qua.architect` | MySQL | [`mysql/arquivos-originais/aula-cidao-qua.architect`](./mysql/arquivos-originais/aula-cidao-qua.architect) + análise em [`mysql/anotacoes/01-modelagem-relacional-e-normalizacao.md`](./mysql/anotacoes/01-modelagem-relacional-e-normalizacao.md) | **Preservado intacto (blob `eee38e27`):** arquivo XML do SQL Power Architect movido intacto e documentado no Guia 01 (corrigindo o relacionamento `1:N` vs `N:N` entre `filme` e `tipos_streaming`). |
| 8 | `Aula 10 nov.md` | NoSQL | [`nosql/anotacoes/04-validacao-schema-e-indices.md`](./nosql/anotacoes/04-validacao-schema-e-indices.md) e [`02-crud-completo-e-operadores.md`](./nosql/anotacoes/02-crud-completo-e-operadores.md) | **Reescrito e corrigido:** preservadas todas as 6 imagens; corrigidos todos os erros de sintaxe dos 10 níveis de `$jsonSchema` (`createCollection`, `validator`, `bsonType: "object"`, `minLength` sem `$`, `bsonType: "string"` em minúsculas, chaves malformadas e armadilha de `additionalProperties: false` sem `_id`). |
| 9 | `Bloco-notas.md` | NoSQL | [`nosql/anotacoes/02-crud-completo-e-operadores.md`](./nosql/anotacoes/02-crud-completo-e-operadores.md) e [`03-aggregation-pipeline.md`](./nosql/anotacoes/03-aggregation-pipeline.md) | **Reescrito e expandido:** removidos os 14 diagramas Mermaid genéricos desconexos do final; corrigidos exemplos de `$inc`/`$mul`, tipos string vs número, `$pop`, direção de `$sort`, `$unwind` e `$lookup`. |
| 10 | `Base-Gamezone-Revisao.js` | NoSQL | [`nosql/bases/Base-Gamezone-Revisao.js`](./nosql/bases/Base-Gamezone-Revisao.js) | **Preservado intacto (blob `dade2027`):** base das coleções `jogos`, `clientes` e `vendas` documentada e usada no gabarito das 29 questões GameZone. |
| 11 | `Bases_Aula21102026.rar` | NoSQL | [`nosql/bases/Bases_Aula21102026.rar`](./nosql/bases/Bases_Aula21102026.rar) | **Preservado intacto (R1 — blob `9847af83`):** pacote `.rar` com os 6 datasets JSON (`clientes`, `cursos`, `filmes`, `funcionarios`, `produtos`, `vendas`) movido sem alterações e documentado em [`nosql/README.md`](./nosql/README.md). |
| 12 | `Revisão-Geral-MongoDB.pdf` | NoSQL | [`nosql/materiais-aula/Revisão-Geral-MongoDB.pdf`](./nosql/materiais-aula/Revisão-Geral-MongoDB.pdf) | **Preservado intacto (blob `dfdee0ee`):** apostila de referência para os guias 02 e 03 de MongoDB. |
| 13 | `Lista-Exercicios-Revisao-MongoDB-GameZone_Alunos.docx` | NoSQL | [`nosql/materiais-aula/Lista-Exercicios-Revisao-MongoDB-GameZone_Alunos.docx`](./nosql/materiais-aula/Lista-Exercicios-Revisao-MongoDB-GameZone_Alunos.docx) | **Preservado intacto (blob `19ee9fc6`):** todas as 29 questões foram resolvidas e comentadas em [`nosql/exercicios/01-gabaritos-gamezone-e-validacao-lol.md`](./nosql/exercicios/01-gabaritos-gamezone-e-validacao-lol.md). |
| 14 | `Aula_02_MongoDB_Restricoes_Progressiva.pdf` | NoSQL | [`nosql/materiais-aula/validacao-de-esquema/Aula_02_MongoDB_Restricoes_Progressiva.pdf`](./nosql/materiais-aula/validacao-de-esquema/Aula_02_MongoDB_Restricoes_Progressiva.pdf) | **Preservado intacto (blob `5a97338f`):** todos os 10 níveis progressivos foram transcritos e explicados sem erros em [`nosql/anotacoes/04-validacao-schema-e-indices.md`](./nosql/anotacoes/04-validacao-schema-e-indices.md). |
| 15 | `Lista-Exercicios-Validacao-MongoDB-ALUNOS.pdf` | NoSQL | [`nosql/materiais-aula/validacao-de-esquema/Lista-Exercicios-Validacao-MongoDB-ALUNOS.pdf`](./nosql/materiais-aula/validacao-de-esquema/Lista-Exercicios-Validacao-MongoDB-ALUNOS.pdf) | **Preservado intacto (blob `163402fd`):** todos os 14 exercícios (temática League of Legends) foram resolvidos e comentados em [`nosql/exercicios/01-gabaritos-gamezone-e-validacao-lol.md`](./nosql/exercicios/01-gabaritos-gamezone-e-validacao-lol.md). |
| 16 | `Validação-de-Esquema-no-MongoDB.pdf` | NoSQL | [`nosql/materiais-aula/validacao-de-esquema/Validação-de-Esquema-no-MongoDB.pdf`](./nosql/materiais-aula/validacao-de-esquema/Validação-de-Esquema-no-MongoDB.pdf) | **Preservado intacto (blob `4561b844`):** consolidado com exemplos extras de `collMod`, `validationLevel` e `validationAction` em [`nosql/anotacoes/04-validacao-schema-e-indices.md`](./nosql/anotacoes/04-validacao-schema-e-indices.md). |

---

## Roteiro Recomendado para a Prova de MongoDB (NoSQL)

Se o seu foco imediato é a **prova de MongoDB**, siga esta ordem enxuta em [`nosql/`](./nosql/README.md):

1. **Revisão Rápida e Armadilhas de Prova:** Leia o [`nosql/README.md`](./nosql/README.md) para a tabela de operadores e os 10 erros mais cobrados em prova.
2. **CRUD e Operadores (`mongosh`):** Estude [`02-crud-completo-e-operadores.md`](./nosql/anotacoes/02-crud-completo-e-operadores.md) (`$set`, `$unset`, `$inc`, `$mul`, `$rename`, `$push`, `$addToSet`, `$pull`, `$pop`, `$elemMatch` e *dot notation* com aspas).
3. **Aggregation Pipeline:** Estude [`03-aggregation-pipeline.md`](./nosql/anotacoes/03-aggregation-pipeline.md) (ordem dos estágios `$match` → `$unwind` → `$group` → `$project` → `$sort`, além de `$lookup` com `as`).
4. **Validação de Esquema (`$jsonSchema`):** Estude [`04-validacao-schema-e-indices.md`](./nosql/anotacoes/04-validacao-schema-e-indices.md) (os 10 níveis progressivos corrigidos, `bsonType` sempre minúsculo, e a regra obrigatória de incluir `_id` em `properties` quando `additionalProperties: false` estiver na raiz).
5. **Treino Prático (Listas da Aula + Simulado):**
   - Confira as resoluções comentadas em [`01-gabaritos-gamezone-e-validacao-lol.md`](./nosql/exercicios/01-gabaritos-gamezone-e-validacao-lol.md).
   - Resolva o [`02-simulado-prova-mongodb.md`](./nosql/exercicios/02-simulado-prova-mongodb.md) antes de olhar o gabarito no final do arquivo.
