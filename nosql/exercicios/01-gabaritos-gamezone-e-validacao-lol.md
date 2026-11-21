# Gabaritos Comentados — GameZone (29) e Validação LoL (14)

> **Navegação rápida:** [Índice NoSQL](../README.md) · [CRUD e Operadores](../anotacoes/02-crud-completo-e-operadores.md) · [Aggregation Pipeline](../anotacoes/03-aggregation-pipeline.md) · [Validação `$jsonSchema` e Índices](../anotacoes/04-validacao-schema-e-indices.md)

Este caderno traz o gabarito completo, testado logicamente contra os dados reais e comentado passo a passo para as duas listas oficiais da disciplina:
- **Parte A (29 exercícios):** [`Lista-Exercicios-Revisao-MongoDB-GameZone_Alunos.docx`](../materiais-aula/Lista-Exercicios-Revisao-MongoDB-GameZone_Alunos.docx) sobre [`Base-Gamezone-Revisao.js`](../bases/Base-Gamezone-Revisao.js).
- **Parte B (14 exercícios):** [`Lista-Exercicios-Validacao-MongoDB-ALUNOS.pdf`](../materiais-aula/validacao-de-esquema/Lista-Exercicios-Validacao-MongoDB-ALUNOS.pdf) no domínio *League of Legends*.

---

## Parte A — Gabarito Comentado: Revisão Geral GameZone (29 Exercícios)

> **Atenção na Base Real ([`Base-Gamezone-Revisao.js`](../bases/Base-Gamezone-Revisao.js)):**
> Os slides de revisão e alguns enunciados usam grafias diferentes dos documentos realmente gravados pelo script `Base-Gamezone-Revisao.js`. Para suas consultas não retornarem `0` documentos na prática, observe **4 divergências reais**:
> 1. **Textos sem acentos/til/cedilha:** `"Dragao Eterno"` (sem til), `"Maringa"` (sem acento), `"basico"` (sem acento), `"acao"` (sem cedilha/til), `"simulacao"`, `"Quebra-Cabeca Magico"`.
> 2. **`clientes` NÃO tem campo `cidade` na raiz:** o script grava apenas `endereco: { rua, cidade, uf }`. Filtrar ou agrupar por `"cidade"` na raiz retorna vazio (`0` docs) — use sempre `"endereco.cidade"`.
> 3. **Exercício 8 (`"Cliente Teste"` vs `"Teste"`):** na coleção `clientes`, o documento `_id: 106` chama-se `"Cliente Teste"`, e não `"Teste"`.
> 4. **Notas inteiras em JS (`8.0`, `9.0`, `5.0`):** no `mongosh`, `8.0` é serializado como `Int32` (`"int"`), não `"double"`. Por isso, use `bsonType: "number"` em validações de preço e nota.

Antes de executar os comandos no `mongosh`, carregue a base e selecione o banco:

```javascript
use gamezone_revisao
```

---

### Parte 1 — CRUD: Find, Insert, Update, Delete (Exercícios 1 a 8)

#### Exercício 1
**Enunciado:** Liste jogos da categoria `'acao'` com `preco >= 100`, ordenados por `preco` desc.

```javascript
db.jogos.find(
  { categoria: "acao", preco: { $gte: 100 } }
).sort({ preco: -1 })
```

- **Resultado esperado na base real (2 documentos):**
  1. `{ _id: 1, titulo: "Dragao Eterno", categoria: "acao", preco: 249, ... }`
  2. `{ _id: 8, titulo: "Guerra Espacial", categoria: "acao", preco: 229, ... }`
- **Comentário didático:** Quando duas condições estão no mesmo objeto `{ campo1: ..., campo2: ... }`, o MongoDB aplica `AND` implícito. `sort({ preco: -1 })` ordena do maior para o menor (`1` = crescente, `-1` = decrescente). Note que `"acao"` não tem cedilha nem til na base.

#### Exercício 2
**Enunciado:** Liste clientes ativos da cidade `'Maringa'`. *(Dica original citava `endereco.cidade` ou `cidade`.)*

> **Divergência na base real:** `clientes` só possui `endereco.cidade` (não existe `cidade` na raiz). Além disso, `"Maringa"` não tem acento.

```javascript
db.clientes.find({
  ativo: true,
  "endereco.cidade": "Maringa"
})
```

- **Resultado esperado na base real (3 documentos):**
  - `_id: 101` (`"Ana Souza"`)
  - `_id: 102` (`"Bruno Lima"`)
  - `_id: 106` (`"Cliente Teste"`)
  - *(Fica de fora `_id: 104` `"Diego Costa"`, que mora em `"Maringa"`, mas tem `ativo: false`.)*
- **Comentário didático:** Para acessar campos de um subdocumento em `find`, o uso de notação de ponto (*dot notation*) exige aspas obrigatórias na chave: `"endereco.cidade"`. Se você rodar `{ ativo: true, cidade: "Maringa" }`, o resultado será **vazio**.

#### Exercício 3
**Enunciado:** Insira um jogo novo: `titulo` `'Teste Final'`, `categoria` `'puzzle'`, `preco` `89`, `estoque` `10`, `tags` `['indie']`.

```javascript
db.jogos.insertOne({
  titulo: "Teste Final",
  categoria: "puzzle",
  preco: 89,
  estoque: 10,
  tags: ["indie"]
})
```

- **Resultado esperado na base real:** `{ acknowledged: true, insertedId: ObjectId("...") }`.
- **Comentário didático:** `preco` (`89`) e `estoque` (`10`) são números sem aspas (se gravados como `"89"`, falham em ordenação numérica e em `$inc`), e `tags` já nasce como array `["indie"]`. Sem `_id` explícito, o MongoDB gera um `ObjectId`.

#### Exercício 4
**Enunciado:** Insira 2 clientes novos de uma vez.

```javascript
db.clientes.insertMany([
  {
    nome: "Lucas Pereira",
    plano: "basico",
    ativo: true,
    endereco: { rua: "Rua Paranagua, 250", cidade: "Maringa", uf: "PR" }
  },
  {
    nome: "Mariana Alves",
    plano: "premium",
    ativo: true,
    endereco: { rua: "Av. Higienopolis, 500", cidade: "Londrina", uf: "PR" }
  }
])
```

- **Resultado esperado na base real:** `{ acknowledged: true, insertedIds: { "0": ObjectId("..."), "1": ObjectId("...") } }`.
- **Comentário didático:** `insertMany` recebe obrigatoriamente um **array** (`[ ... ]`) de documentos. No `insertOne`/`insertMany`, o subdocumento `endereco` é escrito como objeto aninhado `{ rua, cidade, uf }` — **nunca** com dot notation na inserção.

#### Exercício 5
**Enunciado:** Aumente em 10 o `preco` de TODOS os jogos de `'esporte'`.

```javascript
db.jogos.updateMany(
  { categoria: "esporte" },
  { $inc: { preco: 10 } }
)
```

- **Resultado esperado na base real:** `{ acknowledged: true, matchedCount: 2, modifiedCount: 2, ... }`.
  - `_id: 4` (`"Gol de Ouro"`): `preco` vai de `129` para `139`.
  - `_id: 6` (`"Corrida Turbo"`): `preco` vai de `149` para `159`.
- **Comentário didático:** `$inc` **soma** ao valor existente (para diminuir, use valor negativo como `-10`). Usar `$set: { preco: 10 }` seria erro grave porque substituiria o preço por `10`. Usar `updateOne` alteraria só o primeiro jogo de esporte.

#### Exercício 6
**Enunciado:** Troque o `plano` de um cliente específico para `'premium'`.

```javascript
db.clientes.updateOne(
  { nome: "Ana Souza" },
  { $set: { plano: "premium" } }
)
```

- **Resultado esperado na base real:** `{ acknowledged: true, matchedCount: 1, modifiedCount: 1, ... }`. (`_id: 101` passa de `"basico"` para `"premium"`.)
- **Comentário didático:** O 2º argumento de `updateOne` precisa sempre de um operador de atualização (`$set`, `$inc`, etc.). Passar `{ plano: "premium" }` sem `$set` gera erro em `updateOne`.

#### Exercício 7
**Enunciado:** Apague jogos com `estoque = 0` e `categoria = 'teste'`.

```javascript
// 1. Sempre confira antes com find() usando o mesmo filtro!
db.jogos.find({ estoque: 0, categoria: "teste" })

// (Opcional para preservar a base original: gere uma cópia antes)
db.jogos.aggregate([{ $out: "jogos_teste" }])
db.jogos_teste.deleteMany({ estoque: 0, categoria: "teste" })

// 2. Comando definitivo na coleção alvo:
db.jogos.deleteMany({ estoque: 0, categoria: "teste" })
```

- **Resultado esperado na base real:** `{ acknowledged: true, deletedCount: 1 }`.
  - Remove apenas `_id: 9` (`"Jogo Teste"`, único que tem simultaneamente `estoque: 0` e `categoria: "teste"`). Note que `_id: 8` (`"Guerra Espacial"`) tem `estoque: 0`, mas `categoria: "acao"`, então permanece intacto.
- **Comentário didático:** Nunca rode `deleteMany({})` sem filtro (apagaria a coleção inteira). A conferência prévia com `find` evita exclusões acidentais em prova e produção.

#### Exercício 8
**Enunciado:** Apague UM cliente com nome `'Teste'`. Por que `deleteOne` e não `deleteMany` aqui?

> **Divergência na base real:** Em `Base-Gamezone-Revisao.js`, o cliente `_id: 106` chama-se **`"Cliente Teste"`**, não `"Teste"`. `{ nome: "Teste" }` apagaria `0` documentos.

```javascript
// Conferência prévia:
db.clientes.find({ nome: "Cliente Teste" })

// Exclusão exata pelo nome na base real:
db.clientes.deleteOne({ nome: "Cliente Teste" })

// Alternativa se houver vários nomes contendo "Teste" e quiser apagar apenas 1:
// db.clientes.deleteOne({ nome: /Teste/ })
```

- **Resultado esperado na base real:** `{ acknowledged: true, deletedCount: 1 }` (remove `_id: 106`, `"Cliente Teste"`).
- **Por que `deleteOne` e não `deleteMany`?** Porque `deleteOne` interrompe a operação assim que apaga **no máximo 1 documento** (o primeiro que casar com o filtro), protegendo contra exclusão em massa caso existam homônimos ou um filtro parcial como regex `/Teste/`. Já `deleteMany` removeria todos os documentos correspondentes.

---

### Parte 2 — Arrays: `$push`, `$addToSet`, `$pop`, `$pull` (Exercícios 9 a 12)

#### Exercício 9
**Enunciado:** Adicione a tag `'promocao'` em um jogo que já tem `tags`.

> **Divergência na base real:** Nos slides aparece `"Dragão Eterno"` (com til), mas na base real o título é **`"Dragao Eterno"`** (sem til) e suas tags iniciais são `["indie", "3D", "multiplayer"]`.

```javascript
db.jogos.updateOne(
  { titulo: "Dragao Eterno" },
  { $push: { tags: "promocao" } }
)
```

- **Resultado esperado na base real:** `{ acknowledged: true, matchedCount: 1, modifiedCount: 1 }`.
  - `tags` de `_id: 1` passa para `["indie", "3D", "multiplayer", "promocao"]`.
- **Comentário didático:** `$push` sempre insere ao final do array, **mesmo que o valor já exista** (permite duplicatas). Se precisar inserir vários itens de uma vez, use `$push: { tags: { $each: ["a", "b"] } }`.

#### Exercício 10
**Enunciado:** Adicione a tag `'indie'` sem duplicar se ela já existir.

```javascript
// Caso 1: em "Dragao Eterno" (_id: 1), "indie" já existe -> não duplica
db.jogos.updateOne(
  { titulo: "Dragao Eterno" },
  { $addToSet: { tags: "indie" } }
)

// Caso 2: em "Cidade Neon" (_id: 2), "indie" não existe -> adiciona ao final
db.jogos.updateOne(
  { titulo: "Cidade Neon" },
  { $addToSet: { tags: "indie" } }
)
```

- **Resultado esperado na base real:**
  - Caso 1 (`"Dragao Eterno"`): `matchedCount: 1, modifiedCount: 0` — o array permanece `["indie", "3D", "multiplayer", ...]` sem duplicar `"indie"`.
  - Caso 2 (`"Cidade Neon"`): `matchedCount: 1, modifiedCount: 1` — `tags` passa de `["3D", "mundo-aberto"]` para `["3D", "mundo-aberto", "indie"]`.
- **Comentário didático:** Em prova, sempre que o enunciado pedir *"adicionar sem duplicar"*, a resposta é `$addToSet`.

#### Exercício 11
**Enunciado:** Remova a tag `'3D'` de um jogo.

```javascript
db.jogos.updateOne(
  { titulo: "Dragao Eterno" },
  { $pull: { tags: "3D" } }
)
```

- **Resultado esperado na base real:** `matchedCount: 1, modifiedCount: 1`.
  - Considerando o estado original `["indie", "3D", "multiplayer"]`, `tags` vira `["indie", "multiplayer"]`.
- **Comentário didático:** `$pull` remove **por valor** (todas as ocorrências daquele valor ou que satisfaçam uma condição dentro do array).

#### Exercício 12
**Enunciado:** Remova a última tag de um jogo e depois a primeira tag de outro.

```javascript
// Remove a ÚLTIMA tag de "Cidade Neon" (_id: 2)
db.jogos.updateOne(
  { titulo: "Cidade Neon" },
  { $pop: { tags: 1 } }
)

// Remove a PRIMEIRA tag de "Fazenda Feliz" (_id: 3)
db.jogos.updateOne(
  { titulo: "Fazenda Feliz" },
  { $pop: { tags: -1 } }
)
```

- **Resultado esperado na base real (partindo da base inicial):**
  - `"Cidade Neon"` (`["3D", "mundo-aberto"]` → `$pop: 1`): vira `["3D"]`.
  - `"Fazenda Feliz"` (`["indie", "relax"]` → `$pop: -1`): vira `["relax"]`.
- **Comentário didático:** `$pop` remove **por posição** nas extremidades: `1` tira do **fim** (último elemento) e `-1` tira do **início** (primeiro elemento).

---

### Parte 3 — Subdocumentos (Exercícios 13 a 15)

#### Exercício 13
**Enunciado:** Liste clientes que moram em `'Maringa'` usando o subdocumento `endereco`.

```javascript
db.clientes.find({ "endereco.cidade": "Maringa" })
```

- **Resultado esperado na base real (4 documentos):**
  - `_id: 101` (`"Ana Souza"`), `_id: 102` (`"Bruno Lima"`), `_id: 104` (`"Diego Costa"` — note que aqui não filtramos `ativo: true`) e `_id: 106` (`"Cliente Teste"`, caso ainda não tenha sido apagado no Ex. 8).
- **Comentário didático:** Sem as aspas em `"endereco.cidade"`, o JavaScript dá `SyntaxError`.

#### Exercício 14
**Enunciado:** Mude SÓ a cidade do `endereco` de um cliente para `'Sarandi'`, sem apagar `rua` e `uf`.

```javascript
db.clientes.updateOne(
  { _id: 101 },
  { $set: { "endereco.cidade": "Sarandi" } }
)
```

- **Resultado esperado na base real:** `matchedCount: 1, modifiedCount: 1`.
  - `endereco` de `_id: 101` passa a ser `{ rua: "Av. Brasil, 100", cidade: "Sarandi", uf: "PR" }` — `rua` e `uf` ficam intactas.
- **Comentário didático:** Usar `"endereco.cidade"` no `$set` altera exclusivamente a propriedade interna `cidade`, preservando todas as demais chaves do subdocumento `endereco`.

#### Exercício 15
**Enunciado:** Explique por que `db.clientes.updateOne({ _id: 101 }, { $set: { endereco: { cidade: "X" } } })` é perigoso.

- **Resposta completa:**
  - Porque `$set` substitui o **valor inteiro** do campo informado (`endereco`). Ao passar um novo objeto `{ cidade: "X" }` para a chave `endereco` (em vez de `"endereco.cidade"`), o MongoDB sobrescreve todo o subdocumento antigo e **apaga permanentemente `rua` e `uf`**.
  - O documento passaria a ficar `{ ..., endereco: { cidade: "X" } }`. Para atualizar apenas um campo interno preservando os irmãos, use sempre dot notation: `{ $set: { "endereco.cidade": "X" } }`.

---

### Parte 4 — Aggregate: `$match`, `$group`, `$limit`, `$project`, `$sort`, `$lookup`, `$unwind` (Exercícios 16 a 24)

#### Exercício 16
**Enunciado:** Por categoria: total de jogos e média de `preco`. Filtre só categorias com média > 100. Ordene por média desc.

```javascript
db.jogos.aggregate([
  {
    $group: {
      _id: "$categoria",
      total: { $sum: 1 },
      mediaPreco: { $avg: "$preco" }
    }
  },
  {
    $match: {
      $expr: { $gt: ["$mediaPreco", 100] }
    }
  },
  {
    $sort: { mediaPreco: -1 }
  }
])
```

- **Resultado esperado na base real (3 categorias, partindo dos dados originais):**
  1. `{ _id: "acao", total: 2, mediaPreco: 239 }`
  2. `{ _id: "aventura", total: 2, mediaPreco: 189 }`
  3. `{ _id: "esporte", total: 2, mediaPreco: 139 }`
  - *(Ficam de fora: `"simulacao"` = `89`, `"puzzle"` = `59`, `"teste"` = `10`.)*
- **Comentário didático:** O 2º `$match` vem **depois** do `$group` (equivalente ao `HAVING` do SQL) porque `mediaPreco` não existe na coleção original — é um campo criado pelo `$group`. A forma `{ $match: { mediaPreco: { $gt: 100 } } }` também funciona no MongoDB, mas o material da disciplina cobra explicitamente o padrão com `$expr: { $gt: ["$mediaPreco", 100] }` após `$group`.

#### Exercício 17
**Enunciado:** TOP 3 jogos mais bem avaliados. Em empate na `nota`, o mais barato primeiro.

```javascript
db.jogos.aggregate([
  { $sort: { nota: -1, preco: 1 } },
  { $limit: 3 }
])
```

- **Resultado esperado na base real (3 documentos):**
  1. `_id: 1` — `"Dragao Eterno"` (`nota: 9.8, preco: 249`)
  2. `_id: 8` — `"Guerra Espacial"` (`nota: 9.5, preco: 229`)
  3. `_id: 2` — `"Cidade Neon"` (`nota: 9.2, preco: 179`)
- **Comentário didático:** Padrão TOP N = `$sort` antes de `$limit`. O critério secundário de desempate vai no mesmo objeto do `$sort` (`preco: 1` = crescente).

#### Exercício 18
**Enunciado:** Crie `precoComDesconto = preco * 0.9` e `faixa` com `$switch` (`preco >= 200` `"Premium"`, `>= 100` `"Intermediario"`, senão `"Popular"`). Mostre só `titulo`, `precoComDesconto` e `faixa`.

```javascript
db.jogos.aggregate([
  {
    $project: {
      _id: 0,
      titulo: 1,
      precoComDesconto: { $multiply: ["$preco", 0.9] },
      faixa: {
        $switch: {
          branches: [
            { case: { $gte: ["$preco", 200] }, then: "Premium" },
            { case: { $gte: ["$preco", 100] }, then: "Intermediario" }
          ],
          default: "Popular"
        }
      }
    }
  }
])
```

- **Resultado esperado na base real (9 documentos):**
  - `"Dragao Eterno"` → `precoComDesconto: 224.1`, `faixa: "Premium"`
  - `"Guerra Espacial"` → `precoComDesconto: 206.1`, `faixa: "Premium"`
  - `"Ilha Misteriosa"` → `precoComDesconto: 179.1`, `faixa: "Intermediario"`
  - `"Cidade Neon"` → `precoComDesconto: 161.1`, `faixa: "Intermediario"`
  - `"Corrida Turbo"` → `precoComDesconto: 134.1`, `faixa: "Intermediario"`
  - `"Gol de Ouro"` → `precoComDesconto: 116.1`, `faixa: "Intermediario"`
  - `"Fazenda Feliz"` → `precoComDesconto: 80.1`, `faixa: "Popular"`
  - `"Quebra-Cabeca Magico"` → `precoComDesconto: 53.1`, `faixa: "Popular"`
  - `"Jogo Teste"` → `precoComDesconto: 9`, `faixa: "Popular"`
- **Comentário didático:**
  - Não esqueça de `_id: 0` (no `$project`, `_id` vem por padrão mesmo quando você não o lista).
  - No `$switch`, a **ordem dos `branches` importa**: teste `>= 200` antes de `>= 100`, senão um jogo de `249` cairia na primeira condição (`>= 100`) e receberia `"Intermediario"`.

#### Exercício 19
**Enunciado:** Para cada jogo, total vendido: `$lookup` `vendas` + `$unwind` + `$group` somando `qtd` + `$sort` desc.

```javascript
// Versão padrão da receita (retorna apenas jogos que tiveram vendas)
db.jogos.aggregate([
  {
    $lookup: {
      from: "vendas",
      localField: "_id",
      foreignField: "jogoId",
      as: "vendas"
    }
  },
  { $unwind: "$vendas" },
  {
    $group: {
      _id: "$_id",
      titulo: { $first: "$titulo" },
      totalVendido: { $sum: "$vendas.qtd" }
    }
  },
  { $sort: { totalVendido: -1, _id: 1 } }
])
```

**Variante completa com `preserveNullAndEmptyArrays: true` (incluindo jogos com `0` vendas):**

```javascript
db.jogos.aggregate([
  {
    $lookup: {
      from: "vendas",
      localField: "_id",
      foreignField: "jogoId",
      as: "vendas"
    }
  },
  {
    $unwind: {
      path: "$vendas",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $group: {
      _id: "$_id",
      titulo: { $first: "$titulo" },
      totalVendido: { $sum: { $ifNull: ["$vendas.qtd", 0] } }
    }
  },
  { $sort: { totalVendido: -1, _id: 1 } }
])
```

- **Resultado esperado na base real:**
  - **Versão padrão (7 documentos):**
    1. `_id: 1` (`"Dragao Eterno"`): `totalVendido: 2` *(vendas `1001` e `1004`)*
    2. `_id: 4` (`"Gol de Ouro"`): `totalVendido: 2` *(venda `1003` com `qtd: 2`)*
    3. `_id: 2` (`"Cidade Neon"`): `totalVendido: 1`
    4. `_id: 3` (`"Fazenda Feliz"`): `totalVendido: 1`
    5. `_id: 6` (`"Corrida Turbo"`): `totalVendido: 1`
    6. `_id: 7` (`"Ilha Misteriosa"`): `totalVendido: 1`
    7. `_id: 8` (`"Guerra Espacial"`): `totalVendido: 1`
  - **Variante `preserveNullAndEmptyArrays: true` (9 documentos):** inclui também `_id: 5` (`"Quebra-Cabeca Magico"`, `0`) e `_id: 9` (`"Jogo Teste"`, `0`).
- **Comentário didático:** `$lookup` sempre gera um **array** no campo `as`. Sem `$unwind` antes do `$group`, `"$vendas.qtd"` seria um array e `$sum` falharia/retornaria `0`. Já `preserveNullAndEmptyArrays: true` funciona como um `LEFT JOIN`, impedindo que documentos com array `vendas: []` sejam descartados pelo `$unwind`.

#### Exercício 20
**Enunciado:** Conte quantos jogos tem cada tag.

```javascript
db.jogos.aggregate([
  { $unwind: "$tags" },
  {
    $group: {
      _id: "$tags",
      totalJogos: { $sum: 1 }
    }
  },
  { $sort: { totalJogos: -1, _id: 1 } }
])
```

- **Resultado esperado na base real (11 tags distintas):**
  - `"3D"`: `4`, `"multiplayer"`: `4`, `"indie"`: `3`, e `1` para cada uma das 8 tags restantes (`"acao"`, `"aventura"`, `"corrida"`, `"esporte"`, `"mundo-aberto"`, `"puzzle"`, `"relax"`, `"teste"`).
- **Comentário didático:** Regra de ouro das aulas: quando o campo de agrupamento é um array (`tags`), `$unwind` **sempre** antecede `$group`.

#### Exercício 21
**Enunciado:** Faixas fixas de `preco` `[0, 100, 200, 300]` com `$bucket`. Depois faixas automáticas com `$bucketAuto` em 3 faixas. Qual a diferença?

```javascript
// 1. $bucket — limites manuais definidos por você
db.jogos.aggregate([
  {
    $bucket: {
      groupBy: "$preco",
      boundaries: [0, 100, 200, 300],
      default: "Acima de 300",
      output: {
        quantidade: { $sum: 1 },
        jogos: { $push: "$titulo" }
      }
    }
  }
])

// 2. $bucketAuto — o MongoDB calcula os intervalos para balancear N faixas
db.jogos.aggregate([
  {
    $bucketAuto: {
      groupBy: "$preco",
      buckets: 3,
      output: {
        quantidade: { $sum: 1 },
        jogos: { $push: "$titulo" }
      }
    }
  }
])
```

- **Resultado esperado na base real:**
  - **`$bucket` (`boundaries: [0, 100, 200, 300]`):** intervalo fechado no início e aberto no fim `[min, max)`:
    - `_id: 0` (`0 <= preco < 100`): `3` jogos (`"Fazenda Feliz"`, `"Quebra-Cabeca Magico"`, `"Jogo Teste"`).
    - `_id: 100` (`100 <= preco < 200`): `4` jogos (`"Cidade Neon"`, `"Gol de Ouro"`, `"Corrida Turbo"`, `"Ilha Misteriosa"`).
    - `_id: 200` (`200 <= preco < 300`): `2` jogos (`"Dragao Eterno"`, `"Guerra Espacial"`).
  - **`$bucketAuto` (`buckets: 3`):** cria 3 faixas tentando colocar quantidade semelhante de documentos em cada grupo (ex.: `_id: { min: 10, max: 129 }` com 3 docs, `{ min: 129, max: 199 }` com 3 docs, `{ min: 199, max: 249 }` com 3 docs).
- **Qual a diferença?** No **`$bucket`**, **você** define exatamente os pontos de corte (`boundaries`) e um `default` obrigatório para valores fora dos limites. No **`$bucketAuto`**, você informa apenas a **quantidade de faixas (`buckets`)** desejada e o MongoDB calcula os limites automaticamente para distribuir os documentos de modo equilibrado.

#### Exercício 22
**Enunciado:** Um relatório com `$facet`: total por categoria + top 3 por nota + média geral de preço.

```javascript
db.jogos.aggregate([
  {
    $facet: {
      porCategoria: [
        { $group: { _id: "$categoria", total: { $sum: 1 } } },
        { $sort: { total: -1, _id: 1 } }
      ],
      top3Nota: [
        { $sort: { nota: -1, preco: 1 } },
        { $limit: 3 },
        { $project: { _id: 0, titulo: 1, nota: 1, preco: 1 } }
      ],
      mediaGeral: [
        { $group: { _id: null, mediaPreco: { $avg: "$preco" } } },
        { $project: { _id: 0, mediaPreco: { $round: ["$mediaPreco", 2] } } }
      ]
    }
  }
])
```

- **Resultado esperado na base real (1 documento contendo os 3 arrays):**
  - `porCategoria`: `acao` (2), `aventura` (2), `esporte` (2), `puzzle` (1), `simulacao` (1), `teste` (1).
  - `top3Nota`: `Dragao Eterno` (9.8), `Guerra Espacial` (9.5), `Cidade Neon` (9.2).
  - `mediaGeral`: `[{ mediaPreco: 143.56 }]` (média exata `143.5555...`).
- **Comentário didático:** `$facet` executa múltiplos sub-pipelines independentes em paralelo sobre o mesmo conjunto de documentos de entrada, devolvendo tudo consolidado em um único documento. No sub-pipeline `mediaGeral`, `_id: null` agrupa toda a coleção em um único resumo.

#### Exercício 23
**Enunciado:** Liste jogos onde `estoque < estoqueMin` (campo vs campo).

```javascript
// Forma 1: usando find() com $expr
db.jogos.find({
  $expr: { $lt: ["$estoque", "$estoqueMin"] }
})

// Forma 2: equivalente dentro de aggregate()
db.jogos.aggregate([
  { $match: { $expr: { $lt: ["$estoque", "$estoqueMin"] } } }
])
```

- **Resultado esperado na base real (3 documentos):**
  1. `_id: 1` — `"Dragao Eterno"` (`estoque: 5 < estoqueMin: 10`)
  2. `_id: 6` — `"Corrida Turbo"` (`estoque: 3 < estoqueMin: 8`)
  3. `_id: 8` — `"Guerra Espacial"` (`estoque: 0 < estoqueMin: 5`)
- **Comentário didático:** Sem `$expr`, escrever `{ estoque: { $lt: "$estoqueMin" } }` compara o número do campo `estoque` com a **string literal** `"$estoqueMin"`, retornando `0` resultados. `$expr` habilita operadores de expressão de agregação (`$lt: ["$campo1", "$campo2"]`) dentro de filtros.

#### Exercício 24
**Enunciado:** Liste jogos onde `preco > nota * 20`.

```javascript
// Com find() + $expr:
db.jogos.find({
  $expr: {
    $gt: ["$preco", { $multiply: ["$nota", 20] }]
  }
})

// Equivalente em aggregate():
db.jogos.aggregate([
  {
    $match: {
      $expr: {
        $gt: ["$preco", { $multiply: ["$nota", 20] }]
      }
    }
  }
])
```

- **Resultado esperado na base real (3 documentos):**
  1. `_id: 1` — `"Dragao Eterno"`: `249 > 9.8 * 20 (196)`
  2. `_id: 7` — `"Ilha Misteriosa"`: `199 > 9.0 * 20 (180)`
  3. `_id: 8` — `"Guerra Espacial"`: `229 > 9.5 * 20 (190)`
- **Comentário didático:** Dentro de `$expr`, podemos combinar operações aritméticas (`$multiply`, `$add`, `$subtract`, `$divide`) e comparações (`$gt`, `$lt`, `$eq`).

---

### Parte 5 — `createCollection` e `collMod` (Exercícios 25 a 27)

#### Exercício 25
**Enunciado:** Crie a coleção `jogos_novos` com validação: `titulo` obrigatório (`string`), `preco >= 0` (`number`), `categoria` obrigatória.

```javascript
db.createCollection("jogos_novos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["titulo", "categoria", "preco"],
      properties: {
        titulo: { bsonType: "string" },
        categoria: { bsonType: "string" },
        preco: { bsonType: "number", minimum: 0 }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})
```

- **Resultado esperado:** `{ ok: 1 }`.
- **Comentário didático:**
  - `bsonType: "number"` é essencial para `preco` (aceita tanto inteiros como `89` quanto decimais como `89.90`). Se fosse `"double"`, inserir `89` no `mongosh` falharia!
  - Como o enunciado pede `preco >= 0`, incluímos `"preco"` em `required` e `minimum: 0` em `properties`.

#### Exercício 26
**Enunciado:** Tente inserir um jogo com `preco: -10` em `jogos_novos`. O que acontece? Por quê?

```javascript
db.jogos_novos.insertOne({
  titulo: "Jogo Invalido",
  categoria: "acao",
  preco: -10
})
```

- **Resultado esperado:** **Erro (`MongoServerError: Document failed validation`, código 121)**. O documento **não** é inserido.
- **Por quê?** Porque o `$jsonSchema` exige `preco` com `minimum: 0`, e `validationAction` está configurado como `"error"` (junto de `validationLevel: "strict"`), o que bloqueia qualquer escrita que viole a regra. Se `validationAction` fosse `"warn"`, o documento seria gravado e o servidor apenas registraria um aviso no log.

#### Exercício 27
**Enunciado:** Use `collMod` para passar a exigir `estoqueMin >= 0` em `jogos_novos`.

> **Armadilha Crítica do `collMod` (Slide 17):** O comando `collMod` **substitui o objeto `validator` inteiro** — ele **não** faz *merge* com o schema anterior! Se você enviar apenas `estoqueMin`, apagará a obrigatoriedade de `titulo`, `categoria` e `preco`. Por isso, reenvie o `$jsonSchema` completo somando a nova regra.

```javascript
db.runCommand({
  collMod: "jogos_novos",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["titulo", "categoria", "preco", "estoqueMin"],
      properties: {
        titulo: { bsonType: "string" },
        categoria: { bsonType: "string" },
        preco: { bsonType: "number", minimum: 0 },
        estoqueMin: { bsonType: "int", minimum: 0 }
      }
    }
  }
})
```

- **Resultado esperado:** `{ ok: 1 }`.
- **Comentário didático:** Após o `collMod`, novos inserts/updates passam a exigir `estoqueMin` inteiro `>= 0` **sem perder** nenhuma das regras do Ex. 25. Documentos já existentes na coleção não são reescritos nem apagados automaticamente.

---

### Parte 6 — Desafios (Exercícios 28 e 29)

#### Exercício 28
**Enunciado:** Vendas com `valorTotal > 150`: faça `$lookup` com `jogos`, agrupe por `canal` somando `total` e contando vendas, ordene por `total` desc. *(Dica original: `$lookup + $match $expr + $group + $sort`.)*

```javascript
// Seguindo exatamente a ordem da dica da lista:
db.vendas.aggregate([
  {
    $lookup: {
      from: "jogos",
      localField: "jogoId",
      foreignField: "_id",
      as: "jogo"
    }
  },
  {
    $match: {
      $expr: { $gt: ["$valorTotal", 150] }
    }
  },
  {
    $group: {
      _id: "$canal",
      total: { $sum: "$valorTotal" },
      qtdVendas: { $sum: 1 }
    }
  },
  {
    $sort: { total: -1 }
  }
])
```

- **Nota de boas práticas (performance):** Em pipelines de produção, colocar `{ $match: { valorTotal: { $gt: 150 } } }` **antes** do `$lookup` reduz a quantidade de documentos que precisam fazer junção com `jogos` (e permite aproveitar índice em `valorTotal`), produzindo o **mesmo** resultado final.
- **Resultado esperado na base real (2 grupos):**
  - Vendas com `valorTotal > 150` (6 de 8): `1001` (249, loja), `1002` (179, online), `1003` (258, loja), `1004` (249, online), `1007` (199, loja), `1008` (229, online). *(Excluídas: `1005` = 89 e `1006` = 149.)*
  - Saída final:
    1. `{ _id: "loja", total: 706, qtdVendas: 3 }`
    2. `{ _id: "online", total: 657, qtdVendas: 3 }`

#### Exercício 29
**Enunciado:** Clientes ativos: agrupe por cidade, conte total, filtre cidades com `total >= 2`, projete só `cidade` e `total` sem `_id`.

> **Armadilha dupla na base real:** Em `clientes`, `cidade` não está na raiz — deve-se agrupar por **`"$endereco.cidade"`**! Depois, no `$project`, renomeia-se `"$_id"` para `cidade` ocultando `_id: 0`.

```javascript
db.clientes.aggregate([
  {
    $match: { ativo: true }
  },
  {
    $group: {
      _id: "$endereco.cidade",
      total: { $sum: 1 }
    }
  },
  {
    $match: {
      $expr: { $gte: ["$total", 2] }
    }
  },
  {
    $project: {
      _id: 0,
      cidade: "$_id",
      total: 1
    }
  }
])
```

- **Resultado esperado na base real (1 documento):**
  - Clientes ativos (`ativo: true`): `101` (Maringa), `102` (Maringa), `103` (Sarandi), `105` (Londrina), `106` (Maringa). *(`104` Diego Costa tem `ativo: false` e sai no 1º `$match`.)*
  - Contagens após `$group`: `Maringa: 3`, `Sarandi: 1`, `Londrina: 1`.
  - Após `$match` (`total >= 2`) e `$project`: **`{ total: 3, cidade: "Maringa" }`**.

---

## Parte B — Gabarito Comentado: Validação de Esquema LoL (14 Exercícios)

Esta seção resolve os 14 exercícios de [`Lista-Exercicios-Validacao-MongoDB-ALUNOS.pdf`](../materiais-aula/validacao-de-esquema/Lista-Exercicios-Validacao-MongoDB-ALUNOS.pdf), utilizando coleções de teste (`campeoes_teste`, `regioes_teste`, etc.) sem alterar bases originais.

**Modelo de referência da lista:**
- **Funções válidas (6):** `"Mago"`, `"Lutador"`, `"Tanque"`, `"Suporte"`, `"Atirador"`, `"Assassino"`.
- **Regiões válidas (13):** `"Águas de Sentina"`, `"Bandópolis"`, `"Demacia"`, `"Freljord"`, `"Icathia"`, `"Ilha das Sombras"`, `"Ionia"`, `"Ixtal"`, `"Noxus"`, `"Piltover"`, `"Shurima"`, `"Targon"`, `"Zaun"`.
- **Campeão modelo (`Annie`):** `{ _id: 1, name: "Annie", title: "a Criança Sombria", role: "Mago", secondary_role: "Suporte", region: "Noxus", stats: { hp: 560, attack: 50, armor: 23, move_speed: 335 }, data_dragon_version: "16.20.1" }`.

---

### Parte 1 — `createCollection` com `validator` (Exercícios 1 a 5)

#### Exercício 1 (LoL) — Coleção simples, só com `required`
**Enunciado:** Crie `campeoes_teste` exigindo `name`, `role`, `region` e `stats`, com `validationLevel: "strict"` e `validationAction: "error"`. Teste um insert completo (passa) e um sem `region` (falha).

```javascript
// 1. Criação da coleção
db.createCollection("campeoes_teste", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "role", "region", "stats"]
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

// 2. Teste válido (PASSA)
db.campeoes_teste.insertOne({
  name: "Annie",
  role: "Mago",
  region: "Noxus",
  stats: { hp: 560 }
})

// 3. Teste inválido — falta region (FALHA)
db.campeoes_teste.insertOne({
  name: "Annie",
  role: "Mago",
  stats: { hp: 560 }
})
```

- **Resultado observado:**
  - Insert válido: `{ acknowledged: true, insertedId: ObjectId("...") }`.
  - Insert inválido: `MongoServerError: Document failed validation` (código `121`).
- **Explicação técnica:** `required` verifica apenas a **presença da chave** no documento, e não o seu tipo nem se o valor é não nulo (`region: null` ainda passaria em `required` sem `properties`).

#### Exercício 2 (LoL) — `string` e `int`
**Enunciado:** Crie `campeoes_tipos` com `name`, `title`, `role`, `region` como `string` e `stats.hp`, `stats.attack`, `stats.armor`, `stats.move_speed` como `int`. Teste `hp = 560` (passa) e `hp = "560"` (falha).

```javascript
// 1. Criação da coleção
db.createCollection("campeoes_tipos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "title", "role", "region", "stats"],
      properties: {
        name: { bsonType: "string" },
        title: { bsonType: "string" },
        role: { bsonType: "string" },
        region: { bsonType: "string" },
        stats: {
          bsonType: "object",
          properties: {
            hp: { bsonType: "int" },
            attack: { bsonType: "int" },
            armor: { bsonType: "int" },
            move_speed: { bsonType: "int" }
          }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

// 2. Teste válido — hp numérico inteiro (PASSA)
db.campeoes_tipos.insertOne({
  name: "Annie",
  title: "a Criança Sombria",
  role: "Mago",
  region: "Noxus",
  stats: { hp: 560, attack: 50, armor: 23, move_speed: 335 }
})

// 3. Teste inválido — hp como string "560" (FALHA)
db.campeoes_tipos.insertOne({
  name: "Annie",
  title: "a Criança Sombria",
  role: "Mago",
  region: "Noxus",
  stats: { hp: "560", attack: 50, armor: 23, move_speed: 335 }
})
```

- **Resultado observado:**
  - `hp: 560`: `{ acknowledged: true, insertedId: ObjectId("...") }`.
  - `hp: "560"`: `MongoServerError: Document failed validation`.
- **Explicação técnica:** Nomes de `bsonType` são sempre em minúsculas (`"string"`, `"int"`, `"object"`). Como `stats` é um subdocumento, sua validação é feita declarando `bsonType: "object"` e abrindo `properties` internas.

#### Exercício 3 (LoL) — `enum` de função
**Enunciado:** Crie `campeoes_enum` onde `role` deve ser `string` e estar no `enum` das 6 funções. Teste `role: "Mago"` (passa) e `role: "Guerreiro"` (falha).

```javascript
// 1. Criação da coleção
db.createCollection("campeoes_enum", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "role"],
      properties: {
        name: { bsonType: "string" },
        role: {
          bsonType: "string",
          enum: ["Mago", "Lutador", "Tanque", "Suporte", "Atirador", "Assassino"]
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

// 2. Teste válido (PASSA)
db.campeoes_enum.insertOne({ name: "Annie", role: "Mago" })

// 3. Teste inválido — fora do enum (FALHA)
db.campeoes_enum.insertOne({ name: "Yasuo", role: "Guerreiro" })
```

- **Resultado observado:**
  - `"Mago"`: `{ acknowledged: true, insertedId: ObjectId("...") }`.
  - `"Guerreiro"` (ou `"mago"` minúsculo): `MongoServerError: Document failed validation`.
- **Explicação técnica:** `enum` compara valores de forma exata (*case-sensitive* e sensível a acentos/espaços). Combiná-lo com `bsonType: "string"` é boa prática para explicitar o tipo esperado.

#### Exercício 4 (LoL) — `object` aninhado + faixas numéricas
**Enunciado:** Crie `campeoes_stats` com `stats` `object` obrigatório, `hp` int `[1, 2000]`, `attack` int `[0, 200]`, `armor` int `[0, 200]`. Teste `hp = 560` (passa), `hp = 0` (falha) e `stats` sem `armor` (falha).

```javascript
// 1. Criação da coleção
db.createCollection("campeoes_stats", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "stats"],
      properties: {
        name: { bsonType: "string" },
        stats: {
          bsonType: "object",
          required: ["hp", "attack", "armor"],
          properties: {
            hp: { bsonType: "int", minimum: 1, maximum: 2000 },
            attack: { bsonType: "int", minimum: 0, maximum: 200 },
            armor: { bsonType: "int", minimum: 0, maximum: 200 }
          }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

// 2. Teste válido (PASSA)
db.campeoes_stats.insertOne({
  name: "Annie",
  stats: { hp: 560, attack: 50, armor: 23 }
})

// 3. Teste inválido 1 — hp = 0 viola minimum: 1 (FALHA)
db.campeoes_stats.insertOne({
  name: "Annie",
  stats: { hp: 0, attack: 50, armor: 23 }
})

// 4. Teste inválido 2 — falta armor no required interno de stats (FALHA)
db.campeoes_stats.insertOne({
  name: "Annie",
  stats: { hp: 560, attack: 50 }
})
```

- **Resultado observado:** Primeiro insert aceito (`acknowledged: true`); segundo e terceiro rejeitados com `Document failed validation`.
- **Explicação técnica:** Cada subdocumento (`bsonType: "object"`) possui seu próprio escopo de `required` e `properties`. Por padrão, `minimum` e `maximum` são **inclusivos** (`1 <= hp <= 2000`).

#### Exercício 5 (LoL) — `array` de strings
**Enunciado:** Crie `campeoes_tags` com `name` (`string`, obrigatório) e `tags` (`array`, mínimo 1 item, cada item `string`). Teste `["fogo", "magia"]` (passa), `["fogo", 10]` (falha) e `[]` (falha).

```javascript
// 1. Criação da coleção
db.createCollection("campeoes_tags", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "tags"],
      properties: {
        name: { bsonType: "string" },
        tags: {
          bsonType: "array",
          minItems: 1,
          items: { bsonType: "string" }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

// 2. Teste válido (PASSA)
db.campeoes_tags.insertOne({ name: "Annie", tags: ["fogo", "magia"] })

// 3. Teste inválido 1 — elemento 10 não é string (FALHA)
db.campeoes_tags.insertOne({ name: "Annie", tags: ["fogo", 10] })

// 4. Teste inválido 2 — array vazio viola minItems: 1 (FALHA)
db.campeoes_tags.insertOne({ name: "Annie", tags: [] })
```

- **Resultado observado:** Apenas `["fogo", "magia"]` é inserido (`acknowledged: true`); os outros dois retornam `Document failed validation`.
- **Explicação técnica:** Sem a cláusula `items`, `bsonType: "array"` validaria apenas se o campo é uma lista, permitindo números e objetos misturados dentro dela.

---

### Parte 2 — `collMod`: mudar a regra (Exercícios 6 a 9)

#### Exercício 6 (LoL) — Apertar a regra com `collMod`
**Enunciado:** Partindo de `campeoes_teste` (Ex. 1), use `collMod` para acrescentar `role` com `enum` das 6 funções, **mantendo** o `required` anterior. Teste `role: "Mago"` (passa) e `role: "Guerreiro"` (falha).

```javascript
// 1. collMod completo (reenviando required anterior + properties novas!)
db.runCommand({
  collMod: "campeoes_teste",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "role", "region", "stats"],
      properties: {
        role: {
          bsonType: "string",
          enum: ["Mago", "Lutador", "Tanque", "Suporte", "Atirador", "Assassino"]
        }
      }
    }
  }
})

// 2. Teste válido (PASSA)
db.campeoes_teste.insertOne({
  name: "Ahri",
  role: "Mago",
  region: "Ionia",
  stats: { hp: 590 }
})

// 3. Teste inválido — role fora do enum (FALHA)
db.campeoes_teste.insertOne({
  name: "Yasuo",
  role: "Guerreiro",
  region: "Ionia",
  stats: { hp: 590 }
})
```

- **Resultado observado:** `collMod` retorna `{ ok: 1 }`; `Ahri` passa (`acknowledged: true`); `Yasuo` falha (`Document failed validation`).
- **Explicação técnica (Armadilha `collMod`):** Sempre que você passa `validator` dentro de `collMod`, o MongoDB **substitui o `validator` inteiro anterior** (não mescla). Se omitíssemos `required: ["name", "role", "region", "stats"]`, os quatro campos deixariam de ser obrigatórios!

#### Exercício 7 (LoL) — Afrouxar com `moderate`
**Enunciado:** Em `campeoes_teste`: (a) desligue temporariamente a validação e insira um documento inválido (sem `region`); (b) mude `validationLevel` para `"moderate"` e atualize esse documento inválido sem corrigi-lo — o que acontece? (c) tente inserir um novo documento inválido — o que acontece?

```javascript
// (a) Desligar temporariamente SEM apagar o validator atual (omita "validator"!)
db.runCommand({
  collMod: "campeoes_teste",
  validationLevel: "off"
})

// Inserir documento legado inválido (sem region) -> PASSA porque está off
db.campeoes_teste.insertOne({
  name: "Lux",
  role: "Mago",
  stats: { hp: 560 }
})

// (b) Ligar validationLevel: "moderate" (o validator completo do Ex. 6 continua ativo)
db.runCommand({
  collMod: "campeoes_teste",
  validationLevel: "moderate"
})

// Atualizar o documento que JÁ era inválido sem adicionar region -> PASSA!
db.campeoes_teste.updateOne(
  { name: "Lux" },
  { $set: { title: "a Dama da Luz" } }
)

// (c) Tentar inserir um NOVO documento inválido (sem region) -> FALHA!
db.campeoes_teste.insertOne({
  name: "Veigar",
  role: "Mago",
  stats: { hp: 550 }
})
```

- **Resultado observado:**
  - Em `(a)`: `Lux` é aceita (`acknowledged: true`).
  - Em `(b)`: o `updateOne` em `Lux` **PASSA** (`matchedCount: 1, modifiedCount: 1`), mesmo ela continuando sem `region`.
  - Em `(c)`: o `insertOne` de `Veigar` **FALHA** (`Document failed validation`).
- **Explicação técnica:**
  - Observe que ao passar **apenas** `validationLevel: "off"` (e depois `"moderate"`) sem a chave `validator`, o `$jsonSchema` do Ex. 6 permanece preservado na coleção! (Se você tivesse passado `validator: {}` no passo `a`, precisaria reenviar o `$jsonSchema` completo no passo `b`.)
  - Em `moderate`, **novos inserts são sempre validados**, mas updates só são validados se o documento **já atendia às regras antes do update** — ideal para migrações graduais sem travar correções parciais em dados legados.

#### Exercício 8 (LoL) — Testar com `warn` antes de travar
**Enunciado:** Em `campeoes_enum`, mude `validationAction` para `"warn"` (mantendo `"strict"`). Teste um insert com `role` inválida e depois volte para `"error"`.

```javascript
// 1. Mudar para "warn" mantendo o validator do Ex. 3 intacto
db.runCommand({
  collMod: "campeoes_enum",
  validationLevel: "strict",
  validationAction: "warn"
})

// 2. Insert inválido com warn -> É ACEITO (com aviso no log do servidor mongod)
db.campeoes_enum.insertOne({ name: "Yasuo", role: "Guerreiro" })

// 3. Voltar para "error"
db.runCommand({
  collMod: "campeoes_enum",
  validationLevel: "strict",
  validationAction: "error"
})

// 4. Mesmo insert inválido agora -> É REJEITADO!
db.campeoes_enum.insertOne({ name: "Yone", role: "Guerreiro" })
```

- **Resultado observado:**
  - Com `"warn"`: `Yasuo` retorna `{ acknowledged: true, insertedId: ObjectId("...") }` (nenhum erro é devolvido ao cliente no `mongosh`, porém o servidor `mongod` registra um alerta `Document would fail validation` no arquivo de log).
  - Após voltar para `"error"`: `Yone` dispara `MongoServerError: Document failed validation` e não entra na coleção.
- **Explicação técnica:** `validationAction: "warn"` serve para auditar o impacto de uma nova regra em produção antes de bloquear aplicações clientes.

#### Exercício 9 (LoL) — Remover a validação
**Enunciado:** Use `collMod` para desligar a validação de `campeoes_tags`. Teste um insert que antes falharia e responda: documentos antigos inválidos são corrigidos automaticamente? Por quê?

```javascript
// 1. Remover regra e desligar validação
db.runCommand({
  collMod: "campeoes_tags",
  validator: {},
  validationLevel: "off"
})

// 2. Insert que antes falhava (sem name e tags vazio) -> agora PASSA
db.campeoes_tags.insertOne({ tags: [] })
```

- **Resultado observado:** `collMod` retorna `{ ok: 1 }` e `insertOne({ tags: [] })` retorna `{ acknowledged: true, insertedId: ... }`.
- **Os documentos antigos inválidos são corrigidos automaticamente? Por quê?**
  - **Não.** Tanto `createCollection` quanto `collMod` aplicam regras **apenas nas operações de escrita futuras** (`insert` e `update`). O MongoDB nunca varre nem corrige retroativamente documentos já gravados na coleção.

---

### Parte 3 — `required` + `properties` combinados (Exercícios 10 a 13)

#### Exercício 10 (LoL) — Regiões com `enum` + `required`
**Enunciado:** Crie `regioes_teste` com `_id` (`string`, obrigatório), `identity` (`string`, obrigatório) e `climate` (`string`, obrigatório no `enum` dos 12 climas). Teste Demacia completa (passa) e uma região sem `identity` (falha).

```javascript
// 1. Criação da coleção
db.createCollection("regioes_teste", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "identity", "climate"],
      properties: {
        _id: { bsonType: "string" },
        identity: { bsonType: "string" },
        climate: {
          bsonType: "string",
          enum: [
            "Marítimo",
            "Mágico",
            "Temperado",
            "Glacial",
            "Ruínas",
            "Sobrenatural",
            "Variado",
            "Tropical",
            "Urbano",
            "Desértico",
            "Montanhoso",
            "Urbano industrial"
          ]
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

// 2. Teste válido — Demacia completa (PASSA)
db.regioes_teste.insertOne({
  _id: "Demacia",
  identity: "Reino isolado e honrado",
  climate: "Temperado"
})

// 3. Teste inválido — sem identity (FALHA)
db.regioes_teste.insertOne({
  _id: "Noxus",
  climate: "Variado"
})
```

- **Resultado observado:** `Demacia` é aceita (`acknowledged: true`, `insertedId: "Demacia"`); `Noxus` sem `identity` falha (`Document failed validation`).
- **Explicação técnica:** Assim como qualquer outro campo, `_id` pode ser validado normalmente em `required` e `properties` (aqui forçando chave natural `string` com o nome da região).

#### Exercício 11 (LoL) — Faixas de vida completas
**Enunciado:** Crie `faixas_teste` com `min` e `max` (`int` obrigatórios), `class` (`string` obrigatória no `enum` `["Baixa", "Média", "Alta", "Muito alta"]`) e `description` (`string` obrigatória). Teste válido, `class: "Extrema"` e `class: "média"`.

```javascript
// 1. Criação da coleção
db.createCollection("faixas_teste", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["min", "max", "class", "description"],
      properties: {
        min: { bsonType: "int", minimum: 0 },
        max: { bsonType: "int", minimum: 1 },
        class: {
          bsonType: "string",
          enum: ["Baixa", "Média", "Alta", "Muito alta"]
        },
        description: { bsonType: "string" }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

// 2. Teste válido (PASSA)
db.faixas_teste.insertOne({
  min: 550,
  max: 600,
  class: "Média",
  description: "Vida padrão para magos e atiradores"
})

// 3. Teste inválido 1 — fora do enum (FALHA)
db.faixas_teste.insertOne({
  min: 700,
  max: 900,
  class: "Extrema",
  description: "Fora da lista permitida"
})

// 4. Teste inválido 2 — "média" minúscula (FALHA!)
db.faixas_teste.insertOne({
  min: 550,
  max: 600,
  class: "média",
  description: "Diferença de maiúscula/minúscula"
})
```

- **Resultado observado:** Apenas `"Média"` passa. Tanto `"Extrema"` quanto `"média"` falham (`Document failed validation`).
- **Por que `"média"` falha?** Porque `enum` compara strings caractere a caractere (*case-sensitive* e sensível a acentos): `"média" !== "Média"`.

#### Exercício 12 (LoL) — Travar campos novos (`additionalProperties: false`)
**Enunciado:** Crie `campeoes_fechada` com validator completo (`required` + `role` `enum` + `stats` `object`) e `additionalProperties: false`. Teste um campeão completo (passa) e o mesmo campeão com `apelido: "X"` (falha).

> **Armadilha Obrigatória (`_id` com `additionalProperties: false`):**
> Todo documento inserido no MongoDB recebe um campo `_id` (fornecido pelo usuário ou gerado automaticamente como `ObjectId`). Quando `additionalProperties: false` está na raiz do `$jsonSchema`, **você é obrigado a declarar `_id` dentro de `properties`**! Sem `_id` em `properties`, **até o documento válido será rejeitado** porque o servidor considerará `_id` uma propriedade adicional proibida.

```javascript
// 1. Criação da coleção (COM _id declarado em properties!)
db.createCollection("campeoes_fechada", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "role", "region", "stats"],
      additionalProperties: false,
      properties: {
        _id: { bsonType: ["objectId", "int"] }, // Obrigatório quando additionalProperties: false!
        name: { bsonType: "string" },
        role: {
          bsonType: "string",
          enum: ["Mago", "Lutador", "Tanque", "Suporte", "Atirador", "Assassino"]
        },
        region: { bsonType: "string" },
        stats: {
          bsonType: "object",
          required: ["hp", "attack", "armor", "move_speed"],
          additionalProperties: false,
          properties: {
            hp: { bsonType: "int" },
            attack: { bsonType: "int" },
            armor: { bsonType: "int" },
            move_speed: { bsonType: "int" }
          }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

// 2. Teste válido — todos os campos previstos em properties (PASSA)
db.campeoes_fechada.insertOne({
  name: "Annie",
  role: "Mago",
  region: "Noxus",
  stats: { hp: 560, attack: 50, armor: 23, move_speed: 335 }
})

// 3. Teste inválido — campo extra apelido bloqueado por additionalProperties: false (FALHA)
db.campeoes_fechada.insertOne({
  name: "Annie",
  role: "Mago",
  region: "Noxus",
  stats: { hp: 560, attack: 50, armor: 23, move_speed: 335 },
  apelido: "X"
})
```

- **Resultado observado:** O primeiro insert passa (`acknowledged: true`); o segundo falha com `Document failed validation` por causa do campo extra `apelido`.
- **Explicação técnica:** Note que no subdocumento `stats` também colocamos `additionalProperties: false` — lá **não** existe `_id` automático, então basta listar `hp`, `attack`, `armor` e `move_speed`.

#### Exercício 13 (LoL) — O documento completo (desafio)
**Enunciado:** Crie `campeoes_completa` validando todo o modelo LoL: `name`, `title`, `role` (`enum`), `secondary_role` (`string` ou `null`), `region` (`enum` das 13), `stats` (`object` com `hp`/`attack`/`armor`/`move_speed` `int` e faixas), `data_dragon_version` (`string`), com `additionalProperties: false`, `strict` e `error`. Teste 1 válido (`Annie`) e 3 inválidos.

> **Dois detalhes técnicos essenciais:**
> 1. **`_id` em `properties`:** Obrigatório na raiz por causa de `additionalProperties: false` (usamos `bsonType: ["objectId", "int"]` para aceitar tanto `_id: 1` do modelo quanto `ObjectId` gerado automaticamente).
> 2. **`secondary_role` aceitando `null`:**
>    - `bsonType: ["string", "null"]` aceita qualquer texto ou `null`.
>    - Alternativa ainda mais restritiva: `enum: ["Mago", "Lutador", "Tanque", "Suporte", "Atirador", "Assassino", null]` garante que, quando não for `null`, o valor também pertença às 6 funções válidas! (Abaixo mostramos `bsonType: ["string", "null"]` conforme sugerido na dica da lista, comentando a alternativa mais estrita.)

```javascript
// 1. Criação da coleção completa
db.createCollection("campeoes_completa", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "name",
        "title",
        "role",
        "secondary_role",
        "region",
        "stats",
        "data_dragon_version"
      ],
      additionalProperties: false,
      properties: {
        _id: { bsonType: ["objectId", "int"] }, // Obrigatório por additionalProperties: false
        name: { bsonType: "string", minLength: 1 },
        title: { bsonType: "string", minLength: 1 },
        role: {
          bsonType: "string",
          enum: ["Mago", "Lutador", "Tanque", "Suporte", "Atirador", "Assassino"]
        },
        // Aceita string ou null (alternativa ainda mais estrita:
        // enum: ["Mago", "Lutador", "Tanque", "Suporte", "Atirador", "Assassino", null])
        secondary_role: { bsonType: ["string", "null"] },
        region: {
          bsonType: "string",
          enum: [
            "Águas de Sentina",
            "Bandópolis",
            "Demacia",
            "Freljord",
            "Icathia",
            "Ilha das Sombras",
            "Ionia",
            "Ixtal",
            "Noxus",
            "Piltover",
            "Shurima",
            "Targon",
            "Zaun"
          ]
        },
        stats: {
          bsonType: "object",
          required: ["hp", "attack", "armor", "move_speed"],
          additionalProperties: false,
          properties: {
            hp: { bsonType: "int", minimum: 1, maximum: 2000 },
            attack: { bsonType: "int", minimum: 0, maximum: 200 },
            armor: { bsonType: "int", minimum: 0, maximum: 200 },
            move_speed: { bsonType: "int", minimum: 200, maximum: 500 }
          }
        },
        data_dragon_version: {
          bsonType: "string",
          pattern: "^\\d+\\.\\d+\\.\\d+$"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

// 2. Teste válido 1 — modelo Annie completo (PASSA)
db.campeoes_completa.insertOne({
  _id: 1,
  name: "Annie",
  title: "a Criança Sombria",
  role: "Mago",
  secondary_role: "Suporte",
  region: "Noxus",
  stats: { hp: 560, attack: 50, armor: 23, move_speed: 335 },
  data_dragon_version: "16.20.1"
})

// 3. Teste válido extra — secondary_role: null (PASSA)
db.campeoes_completa.insertOne({
  _id: 2,
  name: "Garen",
  title: "o Poder de Demacia",
  role: "Lutador",
  secondary_role: null,
  region: "Demacia",
  stats: { hp: 620, attack: 66, armor: 36, move_speed: 340 },
  data_dragon_version: "16.20.1"
})

// 4. Teste inválido 1 — região inexistente no enum (FALHA)
db.campeoes_completa.insertOne({
  _id: 3,
  name: "Ryze",
  title: "o Mago Rúnico",
  role: "Mago",
  secondary_role: null,
  region: "Runeterra",
  stats: { hp: 575, attack: 58, armor: 22, move_speed: 340 },
  data_dragon_version: "16.20.1"
})

// 5. Teste inválido 2 — stats.hp decimal (560.5) quebra bsonType: "int" (FALHA)
db.campeoes_completa.insertOne({
  _id: 4,
  name: "Lux",
  title: "a Dama da Luz",
  role: "Mago",
  secondary_role: "Suporte",
  region: "Demacia",
  stats: { hp: 560.5, attack: 54, armor: 21, move_speed: 330 },
  data_dragon_version: "16.20.1"
})

// 6. Teste inválido 3 — campo extra não permitido em additionalProperties: false (FALHA)
db.campeoes_completa.insertOne({
  _id: 5,
  name: "Ahri",
  title: "a Raposa de Nove Caudas",
  role: "Mago",
  secondary_role: "Assassino",
  region: "Ionia",
  stats: { hp: 590, attack: 53, armor: 21, move_speed: 330 },
  data_dragon_version: "16.20.1",
  apelido: "Raposinha"
})
```

- **Resultados observados:**
  - `Annie` e `Garen` (`secondary_role: null`) são aceitos (`acknowledged: true`).
  - `Ryze` falha por `region: "Runeterra"` estar fora do `enum` das 13 regiões.
  - `Lux` falha por `stats.hp: 560.5` ser `double` em vez de `int` (também falharia se `data_dragon_version` não batesse com `pattern: "^\\d+\\.\\d+\\.\\d+$"`).
  - `Ahri` falha por conter `apelido`, bloqueado por `additionalProperties: false`.

---

### Parte 4 — `level`: `strict` × `moderate` na prática (Exercício 14)

#### Exercício 14 (LoL) — Comparar `strict` e `moderate` na prática
**Enunciado:** Crie duas coleções com o mesmo validator (`required: ["name", "role"]`): uma `strict` e outra `moderate`. Em cada uma: (1) insira um documento válido; (2) com `collMod` em `"off"`, insira um inválido (sem `role`); (3) religue o level original e tente dar `update` nesse inválido mudando só o `name`. Em qual passa e por quê?

```javascript
// 1. Criar as duas coleções com o mesmo validator
db.createCollection("campeoes_strict", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "role"],
      properties: {
        name: { bsonType: "string" },
        role: { bsonType: "string" }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

db.createCollection("campeoes_moderate", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "role"],
      properties: {
        name: { bsonType: "string" },
        role: { bsonType: "string" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
})

// 2. Passo (1): inserir um documento válido em cada
db.campeoes_strict.insertOne({ name: "Annie", role: "Mago" })
db.campeoes_moderate.insertOne({ name: "Annie", role: "Mago" })

// 3. Passo (2): desligar temporariamente PRESERVANDO o validator (não passe validator: {})
db.runCommand({ collMod: "campeoes_strict", validationLevel: "off" })
db.runCommand({ collMod: "campeoes_moderate", validationLevel: "off" })

// Inserir documento inválido (sem role) em ambas
db.campeoes_strict.insertOne({ name: "Lux" })
db.campeoes_moderate.insertOne({ name: "Lux" })

// 4. Passo (3): religar os níveis originais e tentar atualizar "Lux"
db.runCommand({ collMod: "campeoes_strict", validationLevel: "strict" })
db.runCommand({ collMod: "campeoes_moderate", validationLevel: "moderate" })

// Em campeoes_strict -> FALHA (Document failed validation)
db.campeoes_strict.updateOne({ name: "Lux" }, { $set: { name: "Luxanna" } })

// Em campeoes_moderate -> PASSA (matchedCount: 1, modifiedCount: 1)
db.campeoes_moderate.updateOne({ name: "Lux" }, { $set: { name: "Luxanna" } })
```

- **Resultado observado:**
  - Em `campeoes_strict`: o `updateOne` **FALHA** (`MongoServerError: Document failed validation`), pois `strict` valida **todo** `insert` e **todo** `update`, mesmo quando o documento já estava inválido antes.
  - Em `campeoes_moderate`: o `updateOne` **PASSA** (`acknowledged: true, matchedCount: 1, modifiedCount: 1`), pois `moderate` **não** valida `update` em documentos que já violavam o schema antes da modificação.
  - *(Observação importante: se tentássemos dar `$unset: { role: "" }` no documento `"Annie"` — que já era válido —, **ambas** as coleções `strict` e `moderate` bloqueariam o update!)*
