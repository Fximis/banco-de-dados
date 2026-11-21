# 03 — Aggregation Pipeline (Pipeline de Agregação)

> **Guia de Estudo — Frente NoSQL/MongoDB** · Parte da trilha [NoSQL / MongoDB](../README.md)  
> **Bases usadas nos exemplos:** [`Base-Gamezone-Revisao.js`](../bases/Base-Gamezone-Revisao.js) (`gamezone_revisao`) e coleções das aulas em [`Bases_Aula21102026.rar`](../bases/Bases_Aula21102026.rar) (`pokemon`, `campeoes`, `regioes_info`).

---

## 1. Conceito de Pipeline e Ordem dos Estágios

O **Aggregation Pipeline** (`db.colecao.aggregate([ estagio1, estagio2, ... ])`) funciona como uma **linha de montagem** (fila de etapas):
- A coleção entra no **Estágio 1**.
- A **saída de um estágio é a entrada do próximo**.
- **A ordem importa drasticamente:** trocar estágios de posição muda o resultado e a performance.

### Exemplo Corrigido: Top 5 Pokémon Mais Fortes, Ordenados por Nome

No rascunho de aula havia dois erros: faltava vírgula após `{ $limit: 5 }` e faltava `$` em `$sort`. Veja o pipeline corrigido e o porquê da ordem:

```javascript
// 1º ordena todos do maior ataque para o menor
// 2º corta ficando APENAS com os 5 maiores
// 3º reordena SOMENTE esses 5 em ordem alfabética (A -> Z)
db.pokemon.aggregate([
  { $sort: { attack: -1 } },
  { $limit: 5 },
  { $sort: { name: 1 } }
]);
```

> **Regra de performance:** Coloque `$match` e `$sort` o mais no **início** possível do pipeline, pois eles conseguem aproveitar índices da coleção e reduzem a quantidade de documentos que trafegam pelos estágios seguintes.

---

## 2. Filtragem, Projeção e Expressões (`$match`, `$project`, `$addFields`, `$expr`)

### 2.1 `$match` — Filtrar Documentos

O `$match` usa a mesma sintaxe de filtro do `find()`, mas dentro do pipeline pode aparecer em **dois momentos distintos**:
1. **Pré-`$group` (estilo `WHERE` do SQL):** filtra os documentos brutos antes de agrupar.
2. **Pós-`$group` (estilo `HAVING` do SQL):** filtra grupos já agregados usando campos criados pelo `$group` (comumente usando `$expr`).

Exemplo corrigido da aula de Pokémon (removido espaço indevido no operador, chaves fechadas, vírgula entre campos e dentro de `aggregate([...])`):

```javascript
// Filtra Pokémon com defense > 60 E speed < 50, depois projeta só name e attack
db.pokemon.aggregate([
  {
    $match: {
      defense: { $gt: 60 },
      speed: { $lt: 50 }
    }
  },
  {
    $project: {
      _id: 0,
      name: 1,
      attack: 1
    }
  }
]);
```

### 2.2 `$project` vs `$addFields` / `$set`

| Estágio | Comportamento com campos não listados | Quando usar |
|---|---|---|
| **`$project`** | **Exclui** tudo o que não foi explicitamente marcado com `1` ou calculado (exceto `_id`, que precisa de `_id: 0` para sumir) | Moldar saída final, renomear, ocultar `_id` |
| **`$addFields`** (ou alias **`$set`**) | **Mantém todos** os campos originais e apenas adiciona/sobrescreve os informados | Enriquecer documentos no meio do pipeline sem perder campos |

### 2.3 Operadores de Expressão Mais Cobrados em Prova

Dentro de `$project`, `$addFields` e `$expr`, referenciamos valores de campos usando `"$nomeDoCampo"` (com cifrão e entre aspas):

| Operador | Função | Exemplo |
|---|---|---|
| `$multiply` | Multiplicação | `{ $multiply: ["$preco", 0.9] }` |
| `$add` | Soma | `{ $add: ["$preco", "$frete"] }` |
| `$subtract` | Subtração | `{ $subtract: ["$estoqueMin", "$estoque"] }` |
| `$divide` | Divisão | `{ $divide: ["$valorTotal", "$qtd"] }` |
| `$concat` + `$toString` | Junta strings (`$concat` **só aceita string** — converta números com `$toString`!) | `{ $concat: ["R$ ", { $toString: "$preco" }] }` |
| `$cond` | `if / then / else` binário | `{ $cond: { if: { $eq: ["$estoque", 0] }, then: "Esgotado", else: "Disponivel" } }` |
| `$switch` | Múltiplas condições em ordem + `default` | Classificar faixas de preço |
| `$size` | Tamanho de um array (dentro de `$expr` no `$match`) | `{ $expr: { $gte: [{ $size: "$tags" }, 3] } }` |

### Exemplo Completo de Vitrine (GameZone — Slide 13)

```javascript
use gamezone_revisao

db.jogos.aggregate([
  {
    $project: {
      _id: 0,
      titulo: 1,
      nota: 1,
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
  },
  { $sort: { nota: -1, preco: 1 } },
  { $limit: 3 }
]);
```

### 2.4 Os Dois Usos Obrigatórios de `$expr`

1. **Comparar campo com campo** (no `find` ou no `$match`):
   ```javascript
   db.jogos.aggregate([
     { $match: { $expr: { $lt: ["$estoque", "$estoqueMin"] } } }
   ]);
   ```
2. **Filtrar campo recém-criado pelo `$group`** (estilo `HAVING`):
   ```javascript
   db.jogos.aggregate([
     { $match: { categoria: { $in: ["acao", "aventura"] } } },
     {
       $group: {
         _id: "$categoria",
         total: { $sum: 1 },
         mediaPreco: { $avg: "$preco" }
       }
     },
     { $match: { $expr: { $gt: ["$mediaPreco", 100] } } },
     { $sort: { mediaPreco: -1 } }
   ]);
   ```

---

## 3. Ordenação, Limite, Paginação e Contagem (`$sort`, `$limit`, `$skip`, `$count`)

```javascript
// Padrão TOP N com critério de desempate múltiplo: maior nota, depois menor preço
db.jogos.aggregate([
  { $sort: { nota: -1, preco: 1 } },
  { $skip: 0 },
  { $limit: 3 }
]);

// Estágio $count: conta quantos documentos chegaram até este ponto do pipeline
db.clientes.aggregate([
  { $match: { ativo: true } },
  { $count: "totalClientesAtivos" }
]);
// Saída: [ { totalClientesAtivos: 5 } ]
```

> **Atenção na prova:** `$limit` sem `$sort` prévio devolve documentos em ordem arbitrária!

---

## 4. Explosão de Arrays: `$unwind`

> **expande (desnormaliza)** 1 documento com `N` elementos no array em `N` documentos na memória do pipeline! Por isso, filtre com `$match` **antes** do `$unwind` sempre que possível.

### Exemplo Real Corrigido (`Pokemon-Clean.json`, `_id: 15` = Beedrill)

Beedrill possui `types: ["Dragon", "Dark"]`. O `$unwind` gera **2 documentos** (um para `"Dragon"` e outro para `"Dark"`):

```javascript
db.pokemon.aggregate([
  { $match: { _id: 15 } },
  { $unwind: "$types" }
]);
```

### Opção Vital: `preserveNullAndEmptyArrays: true`

Por padrão, se o array estiver vazio (`[]`), ausente ou `null`, o `$unwind` **descarta o documento inteiro** (comportamento estilo `INNER JOIN`). Para manter o documento mesmo sem itens no array (estilo `LEFT JOIN`), use a forma em objeto:

```javascript
db.campeoes.aggregate([
  {
    $lookup: {
      from: "regioes_info",
      localField: "regiao",
      foreignField: "_id",
      as: "infoRegiao"
    }
  },
  {
    $unwind: {
      path: "$infoRegiao",
      preserveNullAndEmptyArrays: true
    }
  }
]);
```

> **Por que isso cai em prova?** Na base de LoL do arquivo [`Bases_Aula21102026.rar`](../bases/Bases_Aula21102026.rar), `Campeoes-Clean.json` tem campeões de 9 regiões, mas `Regioes-Info-Lol.json` (`regioes_info`) só cadastra 5 regiões (`Demacia`, `Noxus`, `Ionia`, `Freljord`, `Bandópolis`). Sem `preserveNullAndEmptyArrays: true`, os campeões de `Shurima`, `Targon`, `Vazio` e `Zaun` desaparecem do resultado!

---

## 5. Agrupamento e Acumuladores: `$group`

No `$group`, o campo **`_id` define a chave de agrupamento** (equivale ao `GROUP BY` do SQL):
- `_id: "$funcao"` → agrupa por função (note o **`$`** indicando referência ao valor do campo; o nome de saída `qtde_funcoes` **não** leva `$`).
- `_id: null` → agrupa **toda a coleção** em um único grupo (ex.: média geral de preços).
- `_id: { cat: "$categoria", dev: "$desenvolvedora" }` → chave composta por múltiplos campos.

### Exemplo Corrigido da Aula (`Campeoes-Clean.json`)

Corrigindo o fechamento de chaves que faltava no rascunho original e esclarecendo sobre `count`:

```javascript
db.campeoes.aggregate([
  {
    $group: {
      _id: "$funcao",
      qtde_funcoes: { $sum: 1 }
    }
  }
]);
```

> **Nota sobre contagem no MongoDB:** Em versões antigas não havia acumulador `$count` dentro do `$group`, por isso usa-se o padrão universal `{ $sum: 1 }`. A partir do MongoDB 5.0+, existe também o acumulador `{ $count: {} }` dentro do `$group`, além do estágio separado `$count` visto na Seção 3.

### Tabela de Acumuladores do `$group`

| Acumulador | O que faz | Exemplo |
|---|---|---|
| `$sum` | Soma valores (ou `1` para contar documentos) | `totalVendido: { $sum: "$qtd" }` |
| `$avg` | Média aritmética | `mediaPreco: { $avg: "$preco" }` |
| `$min` / `$max` | Menor / maior valor do grupo | `menorPreco: { $min: "$preco" }` |
| `$first` / `$last` | Primeiro / último valor encontrado (útil após `$sort`) | `titulo: { $first: "$titulo" }` |
| `$push` | Junta valores em um array (**permite repetidos**) | `titulos: { $push: "$titulo" }` |
| `$addToSet` | Junta valores em um array (**sem repetição**) | `categorias: { $addToSet: "$categoria" }` |
| `$count` | Conta documentos no grupo (MongoDB 5.0+) | `qtd: { $count: {} }` |

### Regra de Ouro: `$unwind` antes de `$group` ao agrupar por array

```javascript
// Conta quantos jogos existem em cada tag (GameZone Ex. 20)
db.jogos.aggregate([
  { $unwind: "$tags" },
  { $group: { _id: "$tags", totalJogos: { $sum: 1 } } },
  { $sort: { totalJogos: -1 } }
]);
```

---

## 6. Junção entre Coleções: `$lookup`

*(Seção criada para preencher a lacuna deixada vazia em `Bloco-notas.md`.)*

O `$lookup` realiza um **LEFT OUTER JOIN** entre a coleção atual e outra coleção (`from`) do mesmo banco de dados.

### 6.1 Anatomia Básica

```javascript
db.colecao.aggregate([
  {
    $lookup: {
      from: "outra_colecao",      // Coleção alvo do join
      localField: "campo_local",  // Campo na coleção de entrada
      foreignField: "campo_alvo", // Campo correspondente na coleção "from"
      as: "nome_array_saida"      // Nome do NOVO campo (sempre criado como ARRAY!)
    }
  }
]);
```

### 6.2 Receita Clássica de Prova: `$lookup` + `$unwind` + `$group`

Usando `jogos` e `vendas` de [`Base-Gamezone-Revisao.js`](../bases/Base-Gamezone-Revisao.js):

```javascript
use gamezone_revisao

// Total de unidades vendidas por jogo (descartando jogos sem venda)
db.jogos.aggregate([
  {
    $lookup: {
      from: "vendas",
      localField: "_id",
      foreignField: "jogoId",
      as: "vendas"
    }
  },
  { $unwind: "$vendas" }, // Troque por { path: "$vendas", preserveNullAndEmptyArrays: true } para manter jogos com 0 vendas!
  {
    $group: {
      _id: "$_id",
      titulo: { $first: "$titulo" },
      totalVendido: { $sum: "$vendas.qtd" }
    }
  },
  { $sort: { totalVendido: -1 } }
]);
```

### 6.3 `$lookup` com Sub-pipeline (`pipeline` + `let`)

Quando o join exige condição além de igualdade simples (ex.: filtrar apenas vendas `"online"` durante a junção):

```javascript
db.clientes.aggregate([
  {
    $lookup: {
      from: "vendas",
      let: { idCliente: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$clienteId", "$$idCliente"] },
                { $eq: ["$canal", "online"] }
              ]
            }
          }
        }
      ],
      as: "vendasOnline"
    }
  }
]);
```

*(Note o duplo cifrão `$$idCliente` para acessar variáveis declaradas em `let`.)*

---

## 7. Estágios Avançados de Prova (`$bucket`, `$bucketAuto`, `$facet`, `$out` vs `$merge`)

### 7.1 `$bucket` vs `$bucketAuto`

- **`$bucket`:** **você define** manualmente os limites das faixas (`boundaries`). O limite inferior é inclusivo e o superior é exclusivo (`[min, max)`). Sempre informe `default` para não dar erro se algum documento ficar fora das faixas!
- **`$bucketAuto`:** o **MongoDB calcula** automaticamente os limites para distribuir os documentos de forma equilibrada na quantidade de `buckets` pedida.

```javascript
// $bucket manual em GameZone
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
]);

// $bucketAuto automático em 3 faixas
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
]);
```

### 7.2 `$facet` (Múltiplos Relatórios em Uma Única Consulta)

O `$facet` executa vários sub-pipelines independentes em paralelo sobre os mesmos documentos de entrada e devolve **1 único documento** com um campo array por sub-pipeline:

```javascript
db.jogos.aggregate([
  {
    $facet: {
      porCategoria: [
        { $group: { _id: "$categoria", total: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ],
      top3Nota: [
        { $sort: { nota: -1, preco: 1 } },
        { $limit: 3 },
        { $project: { _id: 0, titulo: 1, nota: 1 } }
      ],
      mediaGeral: [
        { $group: { _id: null, mediaPreco: { $avg: "$preco" } } }
      ]
    }
  }
]);
```

### 7.3 `$out` vs `$merge` (Pergunta Clássica de Prova)

Ambos devem ser o **último estágio** do pipeline e gravam o resultado em uma coleção no banco:

| Critério | `$out` | `$merge` |
|---|---|---|
| **Comportamento se a coleção destino já existir** | **Substitui a coleção inteira** atomicamente | **Mescla incrementalmente** (`merge`, `replace`, `keepExisting`, `fail`) |
| **Preserva documentos antigos não gerados no pipeline?** | **Não** (apaga tudo que não saiu do pipeline) | **Sim** (só atualiza/insere os que correspondem à chave `on`) |
| **Destino em outro banco?** | Não (mesmo banco) | Sim (`into: { db: "...", coll: "..." }`) |

```javascript
// Cria uma cópia de segurança para testes de delete (substitui se já existir)
db.jogos.aggregate([
  { $out: "jogos_teste" }
]);

// Atualiza ou insere resumo mensal sem apagar meses anteriores
db.vendas.aggregate([
  { $group: { _id: "$canal", totalVendido: { $sum: "$valorTotal" } } },
  {
    $merge: {
      into: "resumo_canais",
      on: "_id",
      whenMatched: "replace",
      whenNotMatched: "insert"
    }
  }
]);
```

---

## 8. Tabela "De SQL para Aggregation Pipeline" e Checklist de Prova

### 8.1 Equivalência SQL → MongoDB Aggregation

| SQL | Aggregation Pipeline |
|---|---|
| `WHERE ...` (antes de agrupar) | `$match` (no início) |
| `SELECT campo, expr AS alias` | `$project` / `$addFields` |
| `GROUP BY campo` + `COUNT/SUM/AVG` | `$group` (`_id: "$campo"`, `$sum`, `$avg`, `$min`, `$max`) |
| `HAVING ...` (após agrupar) | 2º `$match` (pós-`$group`, usando `$expr` se necessário) |
| `ORDER BY campo DESC` | `$sort: { campo: -1 }` |
| `LIMIT N OFFSET M` | `$skip: M` seguido de `$limit: N` |
| `LEFT JOIN ... ON ...` | `$lookup` (+ `$unwind` com `preserveNullAndEmptyArrays: true`) |
| `CREATE TABLE nova AS SELECT ...` | `$out: "nova"` |

### 8.2 Checklist Anti-Pegadinhas antes de Entregar a Prova

1. **Esquecer `$unwind` após `$lookup`:** tentar somar `"$vendas.qtd"` direto sobre um array retorna `0`!
2. **Colocar `$unwind` antes do `$lookup`:** o campo criado pelo `as:` ainda nem existe.
3. **Ordenar (`$sort`) por campo que só o `$group` cria, antes do `$group`.**
4. **Usar `$size` fora de `$expr` para comparar faixa** (ex.: tamanho `>= 2` exige `{ $expr: { $gte: [{ $size: "$tags" }, 2] } }`).
5. **Usar `$concat` com campo numérico sem `$toString`** → lança erro de tipo!
6. **Errar `from` no `$lookup`** (ex.: colocar `faixas_vida` no plural quando a coleção real é `faixa_vida`).

---

## Próximos Passos
- Siga para [04 — Validação de Schema (`$jsonSchema`) e Índices](./04-validacao-schema-e-indices.md).
- Resolva os exercícios 16–24 e 28–29 em [Gabaritos GameZone e Validação LoL](../exercicios/01-gabaritos-gamezone-e-validacao-lol.md).
