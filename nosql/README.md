# Frente NoSQL & MongoDB — Guia Central de Estudos para Prova

Este diretório reúne todo o material organizado, corrigido e expandido da frente **NoSQL / MongoDB**, com foco direto na revisão para a prova prática e teórica.

---

## Mapa Completo do Diretório `nosql/`

### 1. Guias de Estudo (`anotacoes/`)

| Ordem | Guia | Conteúdo Principal |
|---|---|---|
| 01 | [Fundamentos NoSQL e Arquitetura MongoDB](anotacoes/01-fundamentos-nosql-e-arquitetura-mongodb.md) | 4 modelos NoSQL, SQL vs NoSQL, Teorema CAP, ACID vs BASE, JSON vs BSON, `ObjectId`, comandos de shell e métodos modernos vs depreciados |
| 02 | [CRUD Completo e Operadores](anotacoes/02-crud-completo-e-operadores.md) | `insertOne`/`insertMany`, `find`, projeção, `updateOne`/`updateMany`/`replaceOne`, `deleteOne`/`deleteMany`, dot notation, operadores de comparação, lógicos, elementos e arrays |
| 03 | [Aggregation Pipeline](anotacoes/03-aggregation-pipeline.md) | Ordem dos estágios, `$match`, `$project`, `$addFields`, `$group`, `$unwind`, `$sort`, `$limit`, `$lookup`, `$expr`, `$switch`, `$bucket`/`$bucketAuto`, `$facet`, `$out` vs `$merge` e tabela SQL → Aggregation |
| 04 | [Validação `$jsonSchema` e Índices](anotacoes/04-validacao-schema-e-indices.md) | Escada progressiva (níveis 1–10), `required`, `properties`, `bsonType`, `enum`, `items`, `pattern`, `additionalProperties`, `validationLevel`, `validationAction`, `collMod`, índices (ESR, único, multikey, TTL, texto) e `explain()` |
| 05 | [Modelagem, Transações e Escala](anotacoes/05-modelagem-transacoes-e-escala.md) | Embedding vs Referencing, limite de 16 MB, 1:1 / 1:N / N:N, transações ACID multi-documento, Replica Set (*oplog*, *Write Concern*) e Sharding (*Shard Key*) |

### 2. Exercícios e Simulado (`exercicios/`)

| Arquivo | Descrição |
|---|---|
| [Gabaritos Comentados: GameZone (29) e Validação LoL (14)](exercicios/01-gabaritos-gamezone-e-validacao-lol.md) | Resolução completa e comentada em `mongosh` dos 29 exercícios de revisão GameZone (alinhados à base real) e dos 14 exercícios progressivos de `$jsonSchema` / `collMod` em LoL |
| [Simulado de Prova MongoDB / NoSQL](exercicios/02-simulado-prova-mongodb.md) | 10 questões teóricas + 5 questões práticas `mongosh` + gabarito comentado passo a passo |

### 3. Bases de Dados e Scripts (`bases/`)

| Arquivo | Conteúdo e Observações |
|---|---|
| [`Base-Gamezone-Revisao.js`](bases/Base-Gamezone-Revisao.js) | Script `mongosh` que cria o banco `gamezone_revisao` com 3 coleções: `jogos` (9 docs), `clientes` (6 docs) e `vendas` (8 docs) |
| [`Bases_Aula21102026.rar`](bases/Bases_Aula21102026.rar) | Arquivo `.rar` original preservado intacto (R1) contendo os 6 datasets abaixo |

**Datasets internos de `Bases_Aula21102026.rar`:**

| Arquivo Interno | Coleção / Estrutura | Qtd. Docs | Observações Importantes |
|---|---|---|---|
| `Pokemon-Clean.json` | Array JSON (`_id`, `name`, `hp`, `attack`, `defense`, `speed`, `generation`, `types`) | 800 | `generation` vai de `1` a `4`; `types` é array (ex.: `_id: 15`, `Beedrill`, `["Dragon", "Dark"]`) |
| `Campeoes-Clean.json` | Array JSON (`_id`, `nome`, `funcao`, `regiao`, `estatisticas: { vida, dano_ataque, armadura }`) | 41 | 6 valores de `funcao` e 9 valores distintos de `regiao` |
| `Geracoes-Info-Pokemon.json` | Script `db.geracoes_info.insertMany([...])` | 4 | `_id` de `1` a `4` (Kanto, Johto, Hoenn, Sinnoh). Junção com Pokémon via `localField: "generation"` → `foreignField: "_id"` |
| `Faixas-Ataque-Pokemon.json` | Script `db.faixas_ataque.insertMany([...])` | 5 | `_id`: `0, 50, 80, 100, 200` (`min`, `max`, `classe`, `dica`, `cor`). Feito para `$bucket` + `$lookup` |
| `Regioes-Info-Lol.json` | Script `db.regioes_info.insertMany([...])` | 5 | `_id`: `"Demacia"`, `"Noxus"`, `"Ionia"`, `"Freljord"`, `"Bandópolis"`. **Atenção:** `Shurima`, `Targon`, `Vazio` e `Zaun` existem em `Campeoes-Clean.json`, mas faltam aqui (caso clássico para `preserveNullAndEmptyArrays: true`) |
| `Faixas-Vida-Lol.json` | Script `db.faixa_vida.insertMany([...])` | 4 | `_id`: `0, 550, 600, 650`. Atenção ao nome singular da coleção no script (`db.faixa_vida`) |

### 4. Materiais Originais de Aula (`materiais-aula/`)

| Arquivo | Tema |
|---|---|
| [`Revisão-Geral-MongoDB.pdf`](materiais-aula/Revisão-Geral-MongoDB.pdf) | Slides da revisão geral (19 slides: CRUD, arrays, subdocumentos, Aggregation e validação) |
| [`Lista-Exercicios-Revisao-MongoDB-GameZone_Alunos.docx`](materiais-aula/Lista-Exercicios-Revisao-MongoDB-GameZone_Alunos.docx) | Lista original com os 29 exercícios da base GameZone |
| [`Aula_02_MongoDB_Restricoes_Progressiva.pdf`](materiais-aula/validacao-de-esquema/Aula_02_MongoDB_Restricoes_Progressiva.pdf) | Escada progressiva de validação (16 slides, níveis 1 a 10 + correlação SQL) |
| [`Validação-de-Esquema-no-MongoDB.pdf`](materiais-aula/validacao-de-esquema/Validação-de-Esquema-no-MongoDB.pdf) | Anatomia `$jsonSchema`, `validationLevel`, `validationAction`, `collMod` e os 7 erros comuns (18 slides) |
| [`Lista-Exercicios-Validacao-MongoDB-ALUNOS.pdf`](materiais-aula/validacao-de-esquema/Lista-Exercicios-Validacao-MongoDB-ALUNOS.pdf) | Lista original com os 14 exercícios práticos de validação no domínio League of Legends |

---

## Roteiro de Revisão por Prioridade para a Prova

Se estiver com pouco tempo antes da prova, estude exatamente nesta ordem:

1. **Prioridade 1 — Aggregation Pipeline e `$expr` (peso máximo na prova):**
   - Estude [03-aggregation-pipeline.md](anotacoes/03-aggregation-pipeline.md) e resolva os exercícios **16 a 24, 28 e 29** em [01-gabaritos-gamezone-e-validacao-lol.md](exercicios/01-gabaritos-gamezone-e-validacao-lol.md).
   - Domine a receita `$lookup` → `$unwind` → `$group` → `$match` (`$expr`) → `$sort`.
2. **Prioridade 2 — Validação `$jsonSchema`, `collMod` e `validationLevel`/`validationAction`:**
   - Estude [04-validacao-schema-e-indices.md](anotacoes/04-validacao-schema-e-indices.md) e revise os **14 exercícios de LoL** na Parte B de [01-gabaritos-gamezone-e-validacao-lol.md](exercicios/01-gabaritos-gamezone-e-validacao-lol.md).
3. **Prioridade 3 — CRUD, Arrays e Subdocumentos (Dot Notation):**
   - Estude [02-crud-completo-e-operadores.md](anotacoes/02-crud-completo-e-operadores.md) e faça os exercícios **1 a 15** da GameZone.
4. **Prioridade 4 — Fundamentos, Modelagem, Índices (ESR), Transações e Escala:**
   - Estude [01-fundamentos-nosql-e-arquitetura-mongodb.md](anotacoes/01-fundamentos-nosql-e-arquitetura-mongodb.md), a parte de índices em [04-validacao-schema-e-indices.md](anotacoes/04-validacao-schema-e-indices.md) e [05-modelagem-transacoes-e-escala.md](anotacoes/05-modelagem-transacoes-e-escala.md).
5. **Prioridade 5 — Teste Final Cronometrado:**
   - Resolva o [Simulado de Prova MongoDB / NoSQL](exercicios/02-simulado-prova-mongodb.md) sem olhar o gabarito e depois confira cada erro.

---

## As 6 Armadilhas Mais Cobradas (Resumo de Sobrevivência)

1. **Divergências da base real [`Base-Gamezone-Revisao.js`](bases/Base-Gamezone-Revisao.js) vs slides:**
   - Textos estão **sem acento/til/cedilha**: `"Dragao Eterno"`, `"Maringa"`, `"basico"`, `"acao"`, `"simulacao"`, `"Quebra-Cabeca Magico"`.
   - `clientes` **não** possui `cidade` na raiz — apenas `endereco.cidade`.
   - No exercício 8, o documento na base chama-se `"Cliente Teste"` (não `"Teste"`).
2. **`$expr` é obrigatório em dois cenários:**
   - Comparar **campo com campo** no mesmo documento (`{ $expr: { $lt: ["$estoque", "$estoqueMin"] } }`). Sem `$expr`, `"$estoqueMin"` é lido como string literal.
   - Filtrar um **campo calculado/agregado** no 2º `$match` após `$group` (ex.: `{ $match: { $expr: { $gt: ["$mediaPreco", 100] } } }`) ou comparar tamanho de array com `$size`.
3. **`$unwind` antes de `$group` e ordem do pipeline:**
   - `$group` não soma nem agrupa itens dentro de um array diretamente; é obrigatório explodir o array com `$unwind` antes.
   - `$sort` + `$limit` é diferente de `$limit` + `$sort`; `$match` inicial deve vir o quanto antes.
4. **`_id` obrigatório em `properties` quando `additionalProperties: false` está na raiz:**
   - Todo documento no MongoDB tem `_id`. Se a raiz tiver `additionalProperties: false` e `_id` não estiver listado em `properties`, **100% dos `insertOne` falham**.
5. **`bsonType: "number"` vs `"double"` / `"int"` no `mongosh`:**
   - No JavaScript do `mongosh`, `10` e `8.0` são gravados como `Int32` (`"int"`), e não `"double"`. Se você colocar `bsonType: "double"` em `preco` ou `nota`, inserir `10` ou `8.0` **falha**. Use `bsonType: "number"` para aceitar inteiros e decimais.
6. **`collMod` faz substituição total do `validator`:**
   - Enviar apenas o campo novo dentro de `validator: { $jsonSchema: { ... } }` no `collMod` **apaga** todo o schema anterior (não faz merge!). Reenvie sempre o `$jsonSchema` completo — ou envie apenas `validationLevel` / `validationAction` se quiser manter o `validator` intacto. Além disso, `collMod` **não corrige nem revalida documentos antigos** já gravados.

---

## Cola Rápida (`mongosh` Cheat Sheet)

### Shell e Banco

```javascript
use gamezone_revisao              // Seleciona (ou cria ao inserir) o banco
show dbs                          // Lista bancos com dados gravados
show collections                  // Lista coleções do banco atual
db.jogos.countDocuments()         // Conta documentos (substitui o antigo .count())
db.jogos.drop()                   // Apaga a coleção inteira
```

### CRUD Essencial

```javascript
// CREATE
db.jogos.insertOne({ titulo: "Novo", preco: 99, tags: ["indie"] })
db.clientes.insertMany([ { nome: "A" }, { nome: "B" } ])

// READ (filtro + projeção + cursor)
db.jogos.find(
  { categoria: "acao", preco: { $gte: 100 } },
  { _id: 0, titulo: 1, preco: 1 }   // Regra: não misturar 1 e 0, exceto _id: 0
).sort({ preco: -1, titulo: 1 }).limit(5)

// UPDATE (sempre com operador; sem operador, replaceOne!)
db.jogos.updateMany({ categoria: "esporte" }, { $inc: { preco: 10 } })
db.clientes.updateOne({ _id: 101 }, { $set: { "endereco.cidade": "Sarandi" } })
db.jogos.updateOne({ _id: 1 }, { $unset: { campoAntigo: "" } })

// DELETE (sempre confira com find() antes!)
db.jogos.deleteOne({ _id: 9 })
db.jogos.deleteMany({ categoria: "teste" })
```

### Operadores Mais Cobrados

| Categoria | Operadores | Exemplo Rápido |
|---|---|---|
| Comparação | `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin` | `{ categoria: { $in: ["acao", "aventura"] } }` |
| Lógicos | `$and`, `$or`, `$nor`, `$not` | `{ $or: [{ preco: { $lt: 60 } }, { nota: { $gte: 9.5 } }] }` |
| Elemento / Expressão | `$exists`, `$type`, `$regex`, `$expr` | `{ $expr: { $lt: ["$estoque", "$estoqueMin"] } }` |
| Atualização | `$set`, `$unset`, `$inc`, `$mul`, `$rename`, `$min`, `$max` | `{ $inc: { estoque: -1 }, $set: { ativo: true } }` |
| Arrays (Update) | `$push`, `$addToSet`, `$pop` (`1` fim / `-1` início), `$pull` | `{ $addToSet: { tags: "indie" } }` |
| Arrays (Consulta) | `$all`, `$size`, `$elemMatch` | `{ tags: { $all: ["indie", "3D"] } }` |

### Aggregation Pipeline (Receita Rápida)

```javascript
db.jogos.aggregate([
  { $match: { categoria: { $in: ["acao", "aventura"] } } }, // 1. Filtra cedo
  { $lookup: {                                              // 2. Junta coleções
      from: "vendas",
      localField: "_id",
      foreignField: "jogoId",
      as: "vendas"
  } },
  { $unwind: "$vendas" },                                   // 3. Explode array antes do $group
  { $group: {                                               // 4. Agrupa e acumula
      _id: "$_id",
      titulo: { $first: "$titulo" },
      totalVendido: { $sum: "$vendas.qtd" }
  } },
  { $match: { $expr: { $gte: ["$totalVendido", 2] } } },    // 5. Filtra campo agregado
  { $sort: { totalVendido: -1 } },                          // 6. Ordena
  { $project: { _id: 0, titulo: 1, totalVendido: 1 } }      // 7. Molda saída
])
```

### Validação `$jsonSchema` e `collMod`

```javascript
db.createCollection("jogos_validados", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["titulo", "preco"],
      additionalProperties: false,
      properties: {
        _id: { bsonType: ["objectId", "int"] }, // Obrigatório com additionalProperties: false!
        titulo: { bsonType: "string", minLength: 2 },
        preco: { bsonType: "number", minimum: 0 }
      }
    }
  },
  validationLevel: "strict",   // "strict" | "moderate" | "off"
  validationAction: "error"    // "error" | "warn"
})

// Alterar apenas level/action (preserva o validator atual)
db.runCommand({ collMod: "jogos_validados", validationLevel: "moderate", validationAction: "warn" })
```

### Índices (Regra ESR) e `explain()`

```javascript
// Regra ESR: Equality -> Sort -> Range
db.jogos.createIndex({ categoria: 1, nota: -1, preco: 1 })
db.clientes.createIndex({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true } } })
db.jogos.find({ categoria: "acao", preco: { $gte: 100 } }).sort({ nota: -1 }).explain("executionStats")
// Verificar no explain: IXSCAN (bom) vs COLLSCAN (lento); nReturned próximo de totalDocsExamined
```

---

## Links Externos de Estudo (Preservados das Aulas)

- Prática interativa de queries e acumuladores no MongoDB: [QueryDrill — Several Accumulators](https://querydrill.dev/practice/#several-accumulators)
- Cursos e trilhas oficiais com *badges*/certificados gratuitos: [MongoDB University (Learn MongoDB)](https://learn.mongodb.com/)
