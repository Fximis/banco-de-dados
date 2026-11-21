# Banco de Dados — Fonte de Estudos Completa (MySQL & NoSQL / MongoDB)

Repositório de anotações de aula, guias teóricos revisados, gabaritos comentados e simulados práticos da disciplina de **Banco de Dados**, ministrado pelo prof. Cidão :

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

Se o seu foco imediato é a **prova de MongoDB**, siga esta ordem enxuta em [`nosql/`](./nosql/README.md):

1. **Revisão Rápida e Armadilhas de Prova:** Leia o [`nosql/README.md`](./nosql/README.md) para a tabela de operadores e os 10 erros mais cobrados em prova.
2. **CRUD e Operadores (`mongosh`):** Estude [`02-crud-completo-e-operadores.md`](./nosql/anotacoes/02-crud-completo-e-operadores.md) (`$set`, `$unset`, `$inc`, `$mul`, `$rename`, `$push`, `$addToSet`, `$pull`, `$pop`, `$elemMatch` e *dot notation* com aspas).
3. **Aggregation Pipeline:** Estude [`03-aggregation-pipeline.md`](./nosql/anotacoes/03-aggregation-pipeline.md) (ordem dos estágios `$match` → `$unwind` → `$group` → `$project` → `$sort`, além de `$lookup` com `as`).
4. **Validação de Esquema (`$jsonSchema`):** Estude [`04-validacao-schema-e-indices.md`](./nosql/anotacoes/04-validacao-schema-e-indices.md) (os 10 níveis progressivos corrigidos, `bsonType` sempre minúsculo, e a regra obrigatória de incluir `_id` em `properties` quando `additionalProperties: false` estiver na raiz).
5. **Treino Prático (Listas da Aula + Simulado):**
   - Confira as resoluções comentadas em [`01-gabaritos-gamezone-e-validacao-lol.md`](./nosql/exercicios/01-gabaritos-gamezone-e-validacao-lol.md).
   - Resolva o [`02-simulado-prova-mongodb.md`](./nosql/exercicios/02-simulado-prova-mongodb.md) antes de olhar o gabarito no final do arquivo.
