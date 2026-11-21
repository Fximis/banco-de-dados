# 01 — Fundamentos NoSQL e Arquitetura MongoDB

> **Guia de Estudo — Frente NoSQL/MongoDB** · Parte da trilha [NoSQL / MongoDB](../README.md)  
> **Foco de prova:** conceitos teóricos de NoSQL, Teorema CAP, ACID vs BASE, JSON vs BSON, anatomia do `ObjectId`, hierarquia do MongoDB e comandos modernos do `mongosh`.

---

## 1. O que é NoSQL e por que surgiu?

**NoSQL** significa ***Not Only SQL*** ("Não Apenas SQL") — não é sinônimo de "anti-SQL", mas sim de bancos projetados para cenários onde o modelo relacional rígido (tabelas fixas, normalização estrita e escala vertical) se torna um gargalo.

Principais motivações para adotar bancos NoSQL:
- **Esquema flexível (*Schema-less* / *Schema-on-read*):** documentos na mesma coleção não precisam ter exatamente os mesmos campos (embora seja possível impor regras com [`$jsonSchema`](./04-validacao-schema-e-indices.md)).
- **Escalabilidade horizontal (*Scale-out*):** facilidade de distribuir dados entre vários servidores (*sharding* / particionamento) em vez de apenas comprar uma máquina maior (*scale-up*).
- **Aderência a objetos da aplicação:** estruturas hierárquicas (arrays, objetos aninhados) são armazenadas diretamente sem dezenas de `JOIN`s.
- **Alta disponibilidade e baixa latência:** replicação nativa e leitura rápida para grandes volumes de dados.

---

## 2. Os 4 Modelos Principais de Bancos NoSQL

| Modelo | Como armazena os dados | Exemplos | Casos de uso típicos |
|---|---|---|---|
| **Chave-Valor (*Key-Value*)** | Pares simples `chave -> valor` (opaco para o banco) | **Redis**, DynamoDB, Memcached | Cache, sessões de usuário, carrinhos temporários, *rate limiting* |
| **Documentos (*Document*)** | Documentos estruturados (JSON/BSON) com campos aninhados e arrays | **MongoDB**, CouchDB, Firestore | Catálogos de produtos, perfis de usuário, pedidos, CMS, APIs REST |
| **Colunar / Família de Colunas (*Wide-Column*)** | Linhas com famílias dinâmicas de colunas distribuídas por chave de partição | **Apache Cassandra**, HBase, ScyllaDB | Séries temporais, IoT, logs em altíssima taxa de escrita |
| **Grafos (*Graph*)** | Nós (vértices), arestas (relacionamentos) e propriedades | **Neo4j**, Amazon Neptune | Redes sociais, recomendação, detecção de fraudes, rotas |

---

## 3. SQL (Relacional) vs NoSQL (Documentos / MongoDB)

| Critério | Banco Relacional (MySQL / PostgreSQL) | Banco de Documentos (MongoDB) |
|---|---|---|
| **Estrutura** | Tabelas, linhas (tuplas) e colunas fixas | Coleções (*collections*) e documentos (*documents*) BSON |
| **Esquema** | Rígido (*Schema-on-write*): `CREATE TABLE` prévio | Flexível por padrão; validável via [`$jsonSchema`](./04-validacao-schema-e-indices.md) |
| **Relacionamentos** | Normalizados com Chaves Estrangeiras (`FK`) e `JOIN` | Embutidos (*embedding*) ou referenciados (`$lookup`) — veja [Guia 05](./05-modelagem-transacoes-e-escala.md) |
| **Transações** | ACID nativo em múltiplas tabelas | Atômico por documento; ACID multi-documento via *sessions* |
| **Escalabilidade** | Predominantemente vertical (*scale-up*) | Horizontal nativa (*sharding* + *Replica Sets*) |
| **Linguagem** | SQL declarativo | MQL (*MongoDB Query Language* — objetos JS/JSON no `mongosh`) |

---

## 4. Teorema CAP e ACID vs BASE

### 4.1 Teorema CAP (Brewer)

Em um sistema distribuído de banco de dados, existem três garantias desejáveis, mas em caso de **partição de rede (`P`)** só é possível garantir simultaneamente **uma** das outras duas:

- **C — Consistency (*Consistência*):** toda leitura retorna a escrita mais recente (ou erro).
- **A — Availability (*Disponibilidade*):** todo nó não falho responde a qualquer requisição (mesmo que com dado desatualizado).
- **P — Partition Tolerance (*Tolerância a Partição*):** o sistema continua operando mesmo quando há queda/atraso de comunicação entre nós da rede.

> **Regra de prova:** Como falhas de rede (**P**) são inevitáveis em sistemas distribuídos, a escolha prática é **CP** ou **AP**.
> - **MongoDB é `CP` por padrão:** em um *Replica Set*, há apenas um nó **Primary** que recebe escritas. Se uma partição isolar o Primary em minoria, ele deixa de aceitar escritas até que a maioria eleja um novo Primary — priorizando **Consistência** sobre Disponibilidade parcial.
> - **Cassandra** tende a **AP** (consistência eventual configurável).

### 4.2 ACID vs BASE

| Propriedade | ACID (Bancos Relacionais / Transações) | BASE (Sistemas Distribuídos NoSQL) |
|---|---|---|
| **Significado** | **A**tomicity, **C**onsistency, **I**solation, **D**urability | **B**asically **A**vailable, **S**oft state, **E**ventual consistency |
| **Foco** | Consistência imediata e rigorosa a cada transação | Alta disponibilidade e escala horizontal |
| **Convergência** | Imediata ao `COMMIT` | Eventual (réplicas convergem após propagação) |
| **No MongoDB** | Operações em um **único documento** são sempre atômicas; desde a v4.0 há transações ACID multi-documento | Leituras em *Secondaries* podem observar consistência eventual (configurável por *Read/Write Concern*) |

---

## 5. Arquitetura do MongoDB

### 5.1 Hierarquia Lógica e Equivalência com SQL

```text
Instância/Servidor: mongod (daemon do banco)
 └── Database (Banco de Dados)          ~  DATABASE / SCHEMA no SQL
      └── Collection (Coleção)          ~  TABLE no SQL
           └── Document (Documento)     ~  ROW (linha/tupla) no SQL
                └── Field (Campo)       ~  COLUMN (coluna) no SQL
```

- **`mongod`:** processo servidor principal do MongoDB (escuta por padrão na porta `27017`).
- **`mongos`:** roteador de consultas em clusters com *Sharding* (ver [Guia 05](./05-modelagem-transacoes-e-escala.md)).
- **`mongosh`:** shell interativo moderno (baseado em JavaScript/Node) que substitui o antigo binário `mongo`.

> **Correção de anotação antiga:** Diferente do que constava em rascunhos de aula (*"todo comando começa com `db.Nome_da_colecao`"*), existem **três categorias de comandos** no `mongosh`:
> 1. **Comandos de shell:** `use <banco>`, `show dbs`, `show collections`, `cls`, `exit` (não usam `db.`).
> 2. **Métodos de banco (`db.<metodo>`):** `db.createCollection(...)`, `db.dropDatabase()`, `db.runCommand(...)`, `db.stats()`.
> 3. **Métodos de coleção (`db.<colecao>.<metodo>`):** `db.jogos.find()`, `db.clientes.insertOne(...)`, `db.vendas.aggregate(...)`.

---

## 6. JSON vs BSON e Tipos de Dados BSON

O desenvolvedor escreve documentos em sintaxe **JSON** (ou objetos JavaScript no `mongosh`), mas o MongoDB armazena e trafega internamente em **BSON (*Binary JSON*)**.

Por que **BSON** e não JSON puro?
1. **Mais rápido para percorrer (*parse*):** formato binário com prefixos de tamanho.
2. **Mais tipos de dados:** JSON só possui `string`, `number`, `boolean`, `null`, `array` e `object`. O BSON adiciona `ObjectId`, `Date`, `Int32`, `Int64`, `Decimal128`, `BinData`, etc.

### Tabela Completa de Tipos BSON (para `bsonType` e consultas `$type`)

| Tipo BSON (`bsonType`) | Nome / Helper no `mongosh` | Exemplo | Observação de Prova |
|---|---|---|---|
| `"string"` | `String` | `"Dragao Eterno"` | Sempre **minúsculo** em `$jsonSchema` |
| `"int"` | `Int32` (32 bits) | `10`, `Int32(10)` | Inteiros comuns em `mongosh` (`10`, `10.0`) viram `int` |
| `"long"` | `Long` / `Int64` (64 bits) | `Long("9000000000")` | Inteiros muito grandes |
| `"double"` | `Double` (64 bits float) | `9.8`, `Double(10)` | Armadilha: `10.0` em JS vira `int`, **não** `double`! |
| `"decimal"` | `Decimal128` | `Decimal128("199.90")` | Precisão exata financeira (evita erro de ponto flutuante) |
| `"number"` | Qualquer tipo numérico | `10` ou `9.8` | Aceita `int`, `long`, `double` e `decimal` — **preferido em `$jsonSchema`!** |
| `"bool"` | `Boolean` | `true`, `false` | Atenção: em `$jsonSchema` é `"bool"`, não `"boolean"` |
| `"date"` | `ISODate` / `Date` | `ISODate("2024-03-02T00:00:00Z")` | Data/hora em UTC (milissegundos desde Epoch) |
| `"objectId"` | `ObjectId` | `ObjectId("65f1a2b3c4d5e6f7a8b9c0d1")` | Chave primária padrão de 12 bytes |
| `"array"` | `Array` | `["indie", "3D"]` | Lista ordenada delimitada por colchetes `[]` |
| `"object"` | `Object` | `{ cidade: "Maringa", uf: "PR" }` | Subdocumento delimitado por chaves `{}` |
| `"null"` | `null` | `null` | Tipo próprio no BSON (distinto de campo ausente!) |

> **Atenção na prova:** Nunca armazene preços, salários ou quantidades como texto (`"249"` ou `"7800.00"`). Strings não somam corretamente em `$inc`/`$sum` e ordenam lexicograficamente (`"100" < "20"`!).

---

## 7. Anatomia do `_id` e do `ObjectId`

Todo documento em uma coleção MongoDB possui obrigatoriamente o campo **`_id`**:
- Atua como **chave primária** da coleção (existe um índice único automático `_id_` que não pode ser removido).
- É **imutável**: após inserido, o valor de `_id` de um documento não pode ser alterado via `updateOne`.
- Se o usuário não informar `_id` no `insertOne`/`insertMany`, o MongoDB gera automaticamente um **`ObjectId`** de **12 bytes** (24 caracteres hexadecimais):

```text
ObjectId (12 bytes = 24 hex chars)
├── 4 bytes (8 hex)  : Timestamp Unix em segundos (data/hora da criação)
├── 5 bytes (10 hex) : Valor aleatório único por máquina e processo
└── 3 bytes (6 hex)  : Contador incremental (iniciado aleatoriamente)
```

**Consequências práticas cobradas em prova:**
- É possível extrair a data de criação de um documento a partir do `ObjectId` com `doc._id.getTimestamp()`.
- Um `_id` pode ser de qualquer tipo BSON (exceto `array`), como `int` (`_id: 1` em `Base-Gamezone-Revisao.js`) ou `string` (`_id: "Demacia"` em `regioes_info`).

---

## 8. Comandos Essenciais do `mongosh` e Tabela Depreciados vs Modernos

### 8.1 Comandos Básicos de Navegação e Coleção

```javascript
// Seleciona (ou prepara para criar) o banco de dados
use gamezone_revisao

// Lista bancos existentes no servidor (só aparece após inserir ao menos 1 documento)
show dbs

// Lista coleções do banco atual
show collections

// Cria coleção explícita (útil para anexar validator — veja Guia 04)
db.createCollection("jogos_teste");

// Conta documentos da coleção (método moderno)
db.jogos.countDocuments();

// Conta documentos que atendem a um filtro
db.jogos.countDocuments({ categoria: "acao" });

// Remove a coleção inteira (dados + índices)
db.jogos_teste.drop();
```

> **Nota:** `use gamezone_revisao` não cria o banco fisicamente no disco imediatamente; o MongoDB materializa o banco e a coleção apenas quando o primeiro documento é inserido (ou quando `createCollection` é executado).

### 8.2 Comandos Depreciados (`mongo` legado) vs Modernos (`mongosh`)

Em provas atualizadas, usar comandos depreciados pode descontar pontos ou causar erro no `mongosh`:

| Depreciado (NÃO usar) | Moderno (`mongosh`) | Observação |
|---|---|---|
| `db.col.insert(...)` | `db.col.insertOne(...)` / `db.col.insertMany([...])` | Separação clara entre 1 e N documentos |
| `db.col.update(...)` | `db.col.updateOne(...)` / `db.col.updateMany(...)` / `db.col.replaceOne(...)` | `update` antigo podia substituir o doc inteiro por acidente |
| `db.col.remove(...)` | `db.col.deleteOne(...)` / `db.col.deleteMany(...)` | `remove` sem flag apagava tudo por padrão |
| `db.col.count(...)` | `db.col.countDocuments({ filtro })` / `db.col.estimatedDocumentCount()` | `count()` antigo usava metadados imprecisos |
| `db.col.ensureIndex(...)` | `db.col.createIndex(...)` | Substituído desde o MongoDB 3.0 |
| `db.col.save(...)` | `insertOne(...)` ou `replaceOne(..., { upsert: true })` | Removido do `mongosh` |

---

## 9. Links Oficiais para Prática e Certificação

Preservados e corrigidos das anotações de aula:
- **Treino interativo de queries e Aggregation Pipeline:** <https://querydrill.dev/practice/#several-accumulators>
- **MongoDB University (cursos e badges/mini certificados gratuitos):** <https://learn.mongodb.com/>

---

## Próximos Passos
- Continue para [02 — CRUD Completo e Operadores](./02-crud-completo-e-operadores.md) para dominar `insert`, `find`, `update`, `delete`, arrays e *dot notation*.
- Explore a base de revisão em [Base-Gamezone-Revisao.js](../bases/Base-Gamezone-Revisao.js) e o [Simulado de Prova](../exercicios/02-simulado-prova-mongodb.md).
