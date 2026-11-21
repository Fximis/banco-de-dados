# Simulado de Prova — Banco de Dados NoSQL / MongoDB

> **Navegação rápida:** [Índice NoSQL](../README.md) · [01 Fundamentos](../anotacoes/01-fundamentos-nosql-e-arquitetura-mongodb.md) · [02 CRUD](../anotacoes/02-crud-completo-e-operadores.md) · [03 Aggregation](../anotacoes/03-aggregation-pipeline.md) · [04 Validação e Índices](../anotacoes/04-validacao-schema-e-indices.md) · [05 Modelagem e Escala](../anotacoes/05-modelagem-transacoes-e-escala.md) · [Gabaritos GameZone & LoL](01-gabaritos-gamezone-e-validacao-lol.md)

**Instruções para treino:**
- Tente resolver as **15 questões** (10 teóricas + 5 práticas) sem consultar o gabarito na **Parte 3**.
- Tempo sugerido de prova: **90 minutos** (30 min Parte 1 + 60 min Parte 2).
- Nas questões práticas, considere o banco `gamezone_revisao` ([`Base-Gamezone-Revisao.js`](../bases/Base-Gamezone-Revisao.js)) e o domínio *League of Legends* quando especificado.

---

## Parte 1 — Questões Teóricas (Q1 a Q10)

### Questão 1 — Os 4 Modelos NoSQL (Múltipla Escolha)
Uma plataforma de streaming precisa atender três requisitos distintos:
1. Armazenar sessões de login em memória com acesso ultra-rápido por token (`token -> dados_usuario`).
2. Recomendar amizades ("amigos de amigos em comum que gostam do mesmo gênero").
3. Gravar catálogos de séries com temporadas, episódios e metadados variados em um único registro flexível.

Assinale a alternativa que associa **corretamente** os modelos NoSQL adequados aos cenários 1, 2 e 3, respectivamente:
- **A)** Colunar · Documentos · Chave-Valor
- **B)** Chave-Valor · Grafos · Documentos
- **C)** Documentos · Colunar · Grafos
- **D)** Grafos · Chave-Valor · Colunar

---

### Questão 2 — Teorema CAP e BASE vs ACID (Discursiva Curta)
Um sistema bancário tradicional prioriza transações ACID em um SGBD relacional. Já um cluster MongoDB configurado como Replica Set padrão (leitura e escrita no *Primary*) é classificado no Teorema CAP como **CP** (Consistência + Tolerância a Particionamento).
- **a)** Explique por que, na ocorrência de uma partição de rede (*Partition*), é impossível garantir simultaneamente **Consistência (C)** e **Disponibilidade (A)** segundo o Teorema CAP.
- **b)** Diferencie resumidamente as garantias **ACID** do modelo **BASE**.

---

### Questão 3 — BSON, `ObjectId` e Tipagem Numérica no `mongosh` (Múltipla Escolha)
Sobre o formato BSON utilizado internamente pelo MongoDB e o comportamento do shell `mongosh`, assinale a alternativa **CORRETA**:
- **A)** O `ObjectId` padrão possui 16 bytes e é gerado exclusivamente por uma sequência autoincremental centralizada no servidor.
- **B)** O formato BSON armazena dados em texto puro idêntico ao JSON, sem suporte a tipos como `Date` ou `BinData`.
- **C)** No `mongosh`, o literal numérico `8.0` é serializado em BSON como inteiro de 32 bits (`"int"`), podendo falhar em uma validação que exija estritamente `bsonType: "double"`.
- **D)** O comando `db.colecao.insertOne()` exige que o usuário informe manualmente o campo `_id`, caso contrário a inserção é rejeitada.

---

### Questão 4 — Embedding vs Referencing e Limite de 16 MB (Discursiva Curta)
Você está modelando um sistema de e-commerce em MongoDB com duas necessidades:
1. Cada `pedido` possui de 1 a 15 `itens` (nome do produto, quantidade, preço unitário no momento da compra).
2. Cada `produto` recebe milhares de `avaliacoes` ao longo dos anos (podendo ultrapassar 50.000 comentários).

Indique em qual caso você aplicaria **Embedding** (subdocumentos embutidos) e em qual aplicaria **Referencing** (referência entre coleções), justificando com base no **limite de 16 MB** e no conceito de **arrays ilimitados (*unbounded*)**.

---

### Questão 5 — Replica Set e Sharding (Múltipla Escolha)
Sobre alta disponibilidade e escalabilidade horizontal no MongoDB, analise as afirmativas abaixo:
- I. Em um Replica Set, o *oplog* registra as operações de escrita do *Primary* para que os *Secondaries* possam replicá-las de forma assíncrona.
- II. Configurar `Write Concern` com `{ w: "majority" }` garante que a escrita só seja confirmada ao cliente após ser gravada na maioria dos nós votantes do Replica Set.
- III. No *Sharding*, o componente `mongos` armazena os dados reais das coleções particionadas, enquanto os *Config Servers* executam consultas diretamente nos discos dos *Shards*.
- IV. Uma *Shard Key* com baixa cardinalidade e valores monotonicamente crescentes (como um *timestamp* puro) tende a criar *hotspots* de escrita em um único *Shard*.

Estão **CORRETAS** apenas:
- **A)** I e II
- **B)** I, II e IV
- **C)** II e III
- **D)** I, III e IV

---

### Questão 6 — Índices, Regra ESR e `explain("executionStats")` (Discursiva Curta)
Considere a consulta frequente abaixo sobre uma coleção `pedidos` com 2 milhões de documentos:

```javascript
db.pedidos.find({
  status: "pago",
  valorTotal: { $gte: 200 }
}).sort({ criadoEm: -1 })
```

- **a)** Qual é o índice composto ideal aplicando a **regra ESR** (*Equality → Sort → Range*)? Escreva o comando `createIndex(...)`.
- **b)** Ao rodar `.explain("executionStats")` antes e depois do índice, qual mudança de `stage` no plano vencedor indica que a consulta deixou de varrer a coleção inteira e passou a usar o índice?

---

### Questão 7 — `validationLevel`, `validationAction` e `collMod` (Múltipla Escolha)
Uma coleção `clientes` já possui 10.000 documentos gravados, sendo que 500 documentos antigos não têm o campo `cpf`. O time quer impedir novos cadastros sem `cpf`, mas **sem bloquear** atualizações de endereço nos 500 clientes antigos enquanto eles ainda não informaram o CPF, e inicialmente quer apenas **monitorar** violações em log sem rejeitar escritas.

Qual comando `collMod` atende exatamente a esse cenário de migração gradual?
- **A)** `db.runCommand({ collMod: "clientes", validationLevel: "strict", validationAction: "error" })`
- **B)** `db.runCommand({ collMod: "clientes", validationLevel: "moderate", validationAction: "warn" })`
- **C)** `db.runCommand({ collMod: "clientes", validationLevel: "off", validationAction: "error" })`
- **D)** `db.runCommand({ collMod: "clientes", validationLevel: "moderate", validationAction: "error" })`

---

### Questão 8 — Armadilhas de `$jsonSchema` (Discursiva Curta)
Um estudante executou o comando incorreto abaixo (❌ exemplo negativo) e ficou surpreso ao ver que **todos** os `insertOne()` estão falhando com `Document failed validation`, mesmo enviando `nome` e `nota` válidos:

```javascript
db.createCollection("avaliacoes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nome", "nota"],
      additionalProperties: false,
      properties: {
        nome: { bsonType: "string" },
        nota: { bsonType: "double", minimum: 0, maximum: 10 }
      }
    }
  }
})
```

Aponte **dois erros/armadilhas** nesse `$jsonSchema`:
1. Por que **qualquer** documento inserido (mesmo `{ nome: "Ana", nota: 9.5 }`) é rejeitado imediatamente?
2. Por que, mesmo corrigindo o problema 1, inserir `{ nome: "Ana", nota: 10 }` ainda falharia?

---

### Questão 9 — Ordem de Estágios no Aggregation Pipeline (Múltipla Escolha)
Sobre a construção e o comportamento do Aggregation Pipeline no MongoDB, assinale a alternativa **INCORRETA**:
- **A)** Posicionar `$match` logo no início do pipeline reduz o volume de documentos processados nos estágios seguintes e pode aproveitar índices da coleção.
- **B)** Quando um campo é um array (ex.: `tags`), deve-se usar `$unwind: "$tags"` **antes** do `$group` para contar ocorrências de cada item individualmente.
- **C)** Inverter a ordem de `{ $sort: { preco: -1 } }` e `{ $limit: 5 }` não altera o resultado final, pois o otimizador do MongoDB sempre ordena antes de limitar.
- **D)** Para filtrar documentos após um `$group` comparando o campo agregado criado (ex.: `mediaPreco > 100`), o estágio `$match` deve vir depois do `$group` (podendo usar `$expr`).

---

### Questão 10 — `$out` vs `$merge` no Aggregation Pipeline (Discursiva Curta)
Explique a diferença prática entre encerrar um Aggregation Pipeline com `{ $out: "relatorio_vendas" }` versus `{ $merge: { into: "relatorio_vendas", on: "_id", whenMatched: "merge", whenNotMatched: "insert" } }`, destacando o que acontece caso a coleção `"relatorio_vendas"` já contenha outros documentos históricos.

---

## Parte 2 — Questões Práticas `mongosh` (Q11 a Q15)

### Questão 11 — CRUD, Subdocumentos e Arrays (`gamezone_revisao`)
Considere as coleções `clientes` e `jogos` de [`Base-Gamezone-Revisao.js`](../bases/Base-Gamezone-Revisao.js):
- `clientes`: `{ _id: 101, nome: "Ana Souza", plano: "basico", ativo: true, endereco: { rua: "Av. Brasil, 100", cidade: "Maringa", uf: "PR" } }`
- `jogos`: `{ _id: 1, titulo: "Dragao Eterno", categoria: "acao", preco: 249, estoque: 5, estoqueMin: 10, nota: 9.8, desenvolvedora: "StarWorks", tags: ["indie", "3D", "multiplayer"] }`

Escreva **três comandos `mongosh` distintos** para:
- **a)** Alterar apenas a cidade de `"Ana Souza"` para `"Londrina"`, preservando `rua` e `uf` intactas.
- **b)** Adicionar a tag `"destaque"` em `"Dragao Eterno"` **sem permitir duplicação** caso já exista.
- **c)** Aumentar o `estoque` em `5` unidades em todos os jogos em que `estoque < estoqueMin` (usando filtro com `$expr`).

---

### Questão 12 — Aggregation Pipeline com `$lookup`, `$unwind`, `$group` e `$expr`
Usando `vendas` e `jogos` da base `gamezone_revisao`, escreva um único pipeline `db.vendas.aggregate([...])` que:
1. Considere apenas vendas realizadas no `canal: "online"`.
2. Faça junção (`$lookup`) com a coleção `jogos` (`jogoId` → `_id`).
3. Exploda o array gerado com `$unwind`.
4. Agrupe por **categoria do jogo** (`categoria`), calculando `faturamento` (soma de `valorTotal`) e `unidadesVendidas` (soma de `qtd`).
5. Filtre apenas as categorias cujo `faturamento` seja `>= 200` usando `$match` com `$expr`.
6. Ordene por `faturamento` decrescente e projete `{ _id: 0, categoria: "$_id", faturamento: 1, unidadesVendidas: 1 }`.

---

### Questão 13 — Classificação com `$switch` e Relatório Paralelo com `$facet`
Escreva um pipeline `db.jogos.aggregate([...])` usando `$facet` para retornar em **um único documento** dois relatórios paralelos sobre a coleção `jogos`:
- **`resumoFaixas`:** classifique cada jogo com `$switch` em `"Caro"` (`preco >= 200`), `"Medio"` (`preco >= 100`) ou `"Barato"` (demais) e agrupe pela faixa criada contando quantos jogos há em cada faixa e a nota média (`notaMedia`).
- **`rankingDisponiveis`:** filtre apenas jogos com `estoque > 0`, ordene por `nota` decrescente (e `preco` crescente em empate), limite aos `3` primeiros e projete apenas `titulo`, `nota` e `preco` (sem `_id`).

---

### Questão 14 — `$jsonSchema` Completo e Evolução Segura com `collMod`
Crie a coleção `pedidos_validados` com validação estrita (`strict` + `error`) que imponha:
- Campos obrigatórios na raiz: `clienteId`, `itens`, `total`, `status`.
- `additionalProperties: false` na raiz **sem bloquear** a inserção de documentos com `_id` inteiro ou `ObjectId`.
- `clienteId`: inteiro (`"int"`).
- `total`: numérico (`"number"`), mínimo `0`.
- `status`: `"string"` aceitando apenas `"aberto"`, `"pago"` ou `"cancelado"`.
- `itens`: `"array"` com no mínimo `1` item, onde cada item é um `"object"` com `jogoId` (`"int"`) e `qtd` (`"int"`, mínimo `1`), ambos obrigatórios.

Em seguida, escreva o comando `collMod` correto para **adicionar** a exigência do campo opcional `observacao` (`"string"`, `minLength: 3`) em `properties` **sem apagar nenhuma das regras anteriores**.

---

### Questão 15 — Regra ESR e Interpretação de `explain("executionStats")`
Considere a consulta abaixo sobre uma coleção `vendas_historico` (500.000 documentos):

```javascript
db.vendas_historico.find({
  canal: "online",
  valorTotal: { $gte: 100, $lte: 500 }
}).sort({ data: -1 })
```

- **a)** Crie o índice composto ótimo seguindo a regra **ESR**.
- **b)** Analise o trecho fictício de `explain("executionStats")` abaixo (obtido **antes** do índice) e responda: qual é o gargalo e qual métrica comprova a ineficiência?

```json
{
  "executionStats": {
    "executionSuccess": true,
    "nReturned": 420,
    "executionTimeMillis": 680,
    "totalKeysExamined": 0,
    "totalDocsExamined": 500000,
    "executionStages": {
      "stage": "SORT",
      "sortPattern": { "data": -1 },
      "inputStage": {
        "stage": "COLLSCAN"
      }
    }
  }
}
```

---

## Parte 3 — Gabarito Comentado Passo a Passo

### Gabarito das Questões Teóricas (Q1 a Q10)

#### Resposta Q1 — **Alternativa B**
- **Sessão em memória por token:** modelo **Chave-Valor** (ex.: Redis), ideal para `lookup` O(1) por chave única.
- **Recomendações e conexões sociais ("amigos de amigos"):** modelo **Grafos** (ex.: Neo4j), especializado em travessia de relacionamentos complexos.
- **Catálogo flexível com episódios aninhados:** modelo **Documentos** (ex.: MongoDB), que armazena estruturas hierárquicas (JSON/BSON) em um único documento.

#### Resposta Q2 — Teorema CAP e ACID vs BASE
- **a)** Em uma partição de rede (os nós não conseguem se comunicar), o sistema precisa escolher entre duas opções:
  1. **Recusar escritas/leituras** nos nós isolados para não servir nem gravar dados divergentes → preserva **Consistência (C)**, sacrificando **Disponibilidade (A)** (**sistema CP**, padrão do MongoDB).
  2. **Continuar aceitando escritas/leituras** nos nós isolados mesmo sem sincronizar → preserva **Disponibilidade (A)**, sacrificando **Consistência imediata (C)** (**sistema AP**).
- **b)** **ACID** (*Atomicity, Consistency, Isolation, Durability*) prioriza consistência imediata e isolamento forte em transações. **BASE** (*Basically Available, Soft state, Eventually consistent*) aceita consistência eventual em favor de alta disponibilidade e escalabilidade horizontal contínua.

#### Resposta Q3 — **Alternativa C**
- **A) Incorreta:** `ObjectId` tem **12 bytes** (4 bytes timestamp + 5 bytes valor aleatório por processo/máquina + 3 bytes contador incremental), não é autoincremento centralizado.
- **B) Incorreta:** BSON é **binário** (*Binary JSON*) e suporta tipos extras ausentes no JSON puro, como `Date`, `ObjectId`, `Int32`, `Int64`, `Decimal128` e `BinData`.
- **C) Correta:** Em JS/`mongosh`, `8.0 === 8`, portanto o driver serializa como `Int32` (`"int"`). Um schema com `bsonType: "double"` rejeitaria `8.0`, por isso recomenda-se `bsonType: "number"`.
- **D) Incorreta:** Se `_id` for omitido, o MongoDB gera automaticamente um `ObjectId`.

#### Resposta Q4 — Embedding vs Referencing
- **1. `itens` dentro de `pedido` → Embedding:** A quantidade de itens por pedido é pequena e limitada (1 a 15 itens — *bounded array*), os dados pertencem exclusivamente àquele pedido e costumam ser lidos juntos na tela de detalhes do pedido.
- **2. `avaliacoes` de um `produto` → Referencing:** As avaliações crescem indefinidamente ao longo dos anos (*unbounded array*). Embuti-las dentro do documento do produto causaria crescimento contínuo do documento em disco, realocações constantes e risco real de atingir o **limite máximo de 16 MB por documento** do MongoDB. O ideal é uma coleção `avaliacoes` referenciando `produtoId`.

#### Resposta Q5 — **Alternativa B (I, II e IV)**
- **I. Correta:** O *oplog* (*operations log*) é a coleção *capped* no *Primary* consumida pelos *Secondaries* para replicação.
- **II. Correta:** `w: "majority"` confirma a escrita somente após persistência na maioria dos membros votantes, evitando rollback em caso de failover.
- **III. Incorreta (inverteu os papéis):** Quem armazena os dados reais são os **Shards**; os **Config Servers** guardam os metadados de roteamento (*chunks*/faixas), e o **`mongos`** é apenas o roteador sem estado (*stateless*).
- **IV. Correta:** Chaves monotônicas (ex.: timestamp crescente) enviam todas as novas inserções para o último *chunk* em um único *Shard* (*hotspot*), e baixa cardinalidade impede dividir os dados em muitos *chunks*.

#### Resposta Q6 — Regra ESR e `explain()`
- **a)** Aplicando **E**quality (`status`) → **S**ort (`criadoEm: -1`) → **R**ange (`valorTotal`):
  ```javascript
  db.pedidos.createIndex({ status: 1, criadoEm: -1, valorTotal: 1 })
  ```
  *(Se colocasse `valorTotal` antes de `criadoEm`, o índice resolveria o filtro, mas o MongoDB ainda precisaria ordenar em memória — `SORT` — porque a faixa de `valorTotal` quebra a ordenação por `criadoEm`.)*
- **b)** Antes do índice, o plano mostra **`COLLSCAN`** (varredura completa da coleção) seguido de **`SORT`** em memória. Depois do índice, o plano passa a mostrar **`IXSCAN`** (leitura ordenada pelo índice, eliminando o estágio `SORT` em memória) seguido de **`FETCH`** (busca dos documentos completos).

#### Resposta Q7 — **Alternativa B**
- `validationLevel: "moderate"` valida novos `insert`s e `update`s em documentos que **já eram válidos**, mas **permite atualizar os 500 clientes antigos** que já não tinham `cpf`.
- `validationAction: "warn"` aceita as escritas e registra o aviso no log do servidor em vez de rejeitá-las com erro.

#### Resposta Q8 — Armadilhas de `$jsonSchema`
1. **Falta `_id` em `properties` com `additionalProperties: false` na raiz:** Todo documento no MongoDB recebe `_id` (enviado ou gerado como `ObjectId`). Como `_id` não foi listado em `properties`, `additionalProperties: false` trata `_id` como campo proibido e rejeita 100% dos inserts. Correção: incluir `_id: { bsonType: ["objectId", "int"] }` (ou `_id: {}`) em `properties`.
2. **`nota: { bsonType: "double" }` rejeita `10` no `mongosh`:** O literal `10` (e até `10.0`) vira BSON `Int32` (`"int"`), não `"double"`. Correção: usar `bsonType: "number"`, que aceita inteiros e decimais.

#### Resposta Q9 — **Alternativa C (Incorreta)**
- `$sort` seguido de `$limit` ordena toda a entrada e pega os 5 maiores/menores (**TOP 5 global**).
- `$limit` seguido de `$sort` pega 5 documentos quaisquer primeiro e só depois ordena esses 5 — resultado completamente diferente! As alternativas A, B e D estão corretas.

#### Resposta Q10 — `$out` vs `$merge`
- **`{ $out: "relatorio_vendas" }`:** Grava o resultado em uma coleção temporária e, ao final do pipeline, **substitui atomicamente a coleção inteira** `"relatorio_vendas"`. Todos os documentos históricos que existiam antes são **descartados**.
- **`{ $merge: { into: "relatorio_vendas", on: "_id", whenMatched: "merge", whenNotMatched: "insert" } }`:** Faz **atualização/mesclagem incremental**. Documentos históricos antigos que não apareceram no pipeline atual são **preservados**, documentos com mesmo `_id` são mesclados e novos `_id` são inseridos.

---

### Gabarito das Questões Práticas (Q11 a Q15)

#### Resposta Q11 — CRUD, Subdocumentos e Arrays
```javascript
// a) Atualizar só endereco.cidade sem apagar rua e uf (dot notation!)
db.clientes.updateOne(
  { nome: "Ana Souza" },
  { $set: { "endereco.cidade": "Londrina" } }
)

// b) Adicionar tag "destaque" sem duplicar ($addToSet) — atente para "Dragao Eterno" sem til!
db.jogos.updateOne(
  { titulo: "Dragao Eterno" },
  { $addToSet: { tags: "destaque" } }
)

// c) Aumentar estoque em 5 onde estoque < estoqueMin ($expr + updateMany + $inc)
db.jogos.updateMany(
  { $expr: { $lt: ["$estoque", "$estoqueMin"] } },
  { $inc: { estoque: 5 } }
)
```
- **Resultado na base original:**
  - **(a)** `Ana Souza` (`_id: 101`) passa a ter `endereco: { rua: "Av. Brasil, 100", cidade: "Londrina", uf: "PR" }`.
  - **(b)** `Dragao Eterno` (`_id: 1`) passa a ter `tags: ["indie", "3D", "multiplayer", "destaque"]`.
  - **(c)** Altera 3 jogos (`_id: 1` vai de `5` para `10`; `_id: 6` de `3` para `8`; `_id: 8` de `0` para `5`).

#### Resposta Q12 — Aggregation Pipeline com `$lookup`, `$unwind`, `$group` e `$expr`
```javascript
db.vendas.aggregate([
  {
    $match: { canal: "online" }
  },
  {
    $lookup: {
      from: "jogos",
      localField: "jogoId",
      foreignField: "_id",
      as: "jogo"
    }
  },
  {
    $unwind: "$jogo"
  },
  {
    $group: {
      _id: "$jogo.categoria",
      faturamento: { $sum: "$valorTotal" },
      unidadesVendidas: { $sum: "$qtd" }
    }
  },
  {
    $match: {
      $expr: { $gte: ["$faturamento", 200] }
    }
  },
  {
    $sort: { faturamento: -1 }
  },
  {
    $project: {
      _id: 0,
      categoria: "$_id",
      faturamento: 1,
      unidadesVendidas: 1
    }
  }
])
```
- **Passo a passo na base `gamezone_revisao`:**
  - Vendas `online`: `1002` (`jogoId: 2`, aventura, `179`), `1004` (`jogoId: 1`, acao, `249`), `1005` (`jogoId: 3`, simulacao, `89`), `1008` (`jogoId: 8`, acao, `229`).
  - Após `$group`: `acao` (`faturamento: 478, unidadesVendidas: 2`), `aventura` (`179, 1`), `simulacao` (`89, 1`).
  - Após `$match` (`>= 200`) e `$project`: **`{ faturamento: 478, unidadesVendidas: 2, categoria: "acao" }`**.

#### Resposta Q13 — `$facet` + `$switch` + TOP 3
```javascript
db.jogos.aggregate([
  {
    $facet: {
      resumoFaixas: [
        {
          $addFields: {
            faixa: {
              $switch: {
                branches: [
                  { case: { $gte: ["$preco", 200] }, then: "Caro" },
                  { case: { $gte: ["$preco", 100] }, then: "Medio" }
                ],
                default: "Barato"
              }
            }
          }
        },
        {
          $group: {
            _id: "$faixa",
            qtdJogos: { $sum: 1 },
            notaMedia: { $avg: "$nota" }
          }
        },
        { $sort: { notaMedia: -1 } }
      ],
      rankingDisponiveis: [
        { $match: { estoque: { $gt: 0 } } },
        { $sort: { nota: -1, preco: 1 } },
        { $limit: 3 },
        { $project: { _id: 0, titulo: 1, nota: 1, preco: 1 } }
      ]
    }
  }
])
```
- **Observação:** Em `rankingDisponiveis`, `Guerra Espacial` (`nota: 9.5`, mas `estoque: 0`) é filtrado fora antes do TOP 3, entrando `Dragao Eterno` (9.8), `Cidade Neon` (9.2) e `Ilha Misteriosa` (9.0).

#### Resposta Q14 — `$jsonSchema` Completo e `collMod` Seguro
```javascript
// 1. Criação com additionalProperties: false e _id declarado
db.createCollection("pedidos_validados", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["clienteId", "itens", "total", "status"],
      additionalProperties: false,
      properties: {
        _id: { bsonType: ["objectId", "int"] }, // Obrigatório por additionalProperties: false!
        clienteId: { bsonType: "int" },
        total: { bsonType: "number", minimum: 0 },
        status: {
          bsonType: "string",
          enum: ["aberto", "pago", "cancelado"]
        },
        itens: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["jogoId", "qtd"],
            additionalProperties: false,
            properties: {
              jogoId: { bsonType: "int" },
              qtd: { bsonType: "int", minimum: 1 }
            }
          }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

// 2. Evolução com collMod: OBRIGATÓRIO reenviar o $jsonSchema COMPLETO + observacao!
db.runCommand({
  collMod: "pedidos_validados",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["clienteId", "itens", "total", "status"], // observacao fica fora do required (opcional)
      additionalProperties: false,
      properties: {
        _id: { bsonType: ["objectId", "int"] },
        clienteId: { bsonType: "int" },
        total: { bsonType: "number", minimum: 0 },
        status: {
          bsonType: "string",
          enum: ["aberto", "pago", "cancelado"]
        },
        itens: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["jogoId", "qtd"],
            additionalProperties: false,
            properties: {
              jogoId: { bsonType: "int" },
              qtd: { bsonType: "int", minimum: 1 }
            }
          }
        },
        observacao: { bsonType: "string", minLength: 3 }
      }
    }
  }
})
```
- **Por que funciona?** O `collMod` substitui o `validator` inteiro; por isso reenviamos todas as chaves existentes acrescidas de `observacao` em `properties` (mas fora de `required`, mantendo-a opcional).

#### Resposta Q15 — Regra ESR e `explain("executionStats")`
- **a)** Seguindo **E**quality (`canal`) → **S**ort (`data: -1`) → **R**ange (`valorTotal`):
  ```javascript
  db.vendas_historico.createIndex({ canal: 1, data: -1, valorTotal: 1 })
  ```
- **b)** Interpretação do `explain("executionStats")`:
  - **Gargalo:** A consulta está fazendo **`COLLSCAN`** (leitura sequencial de toda a coleção) seguido de **`SORT` em memória** (porque não há índice entregando os dados já ordenados por `data: -1`).
  - **Métricas que comprovam a ineficiência:**
    - `totalKeysExamined: 0` (nenhum índice foi utilizado).
    - `totalDocsExamined: 500000` para `nReturned: 420` — o MongoDB precisou ler todos os **500.000 documentos** do disco/memória apenas para devolver **420** (razão ~1190 documentos examinados por documento retornado), elevando o tempo para `680 ms`.
