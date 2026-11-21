# 02 — CRUD Completo e Operadores

> **Guia de Estudo — Frente NoSQL/MongoDB** · Parte da trilha [NoSQL / MongoDB](../README.md)  
> **Base prática principal:** [`Base-Gamezone-Revisao.js`](../bases/Base-Gamezone-Revisao.js) (`use gamezone_revisao`) com exemplos adicionais corrigidos das aulas (`funcionarios`).

---

## 1. Terminologia Correta e Regras de Sintaxe

Antes de escrever qualquer comando no `mongosh`, domine os termos corretos (erros frequentes de anotação):

- **`{}` (Chaves):** delimitam **documentos / objetos** (ex.: `{ titulo: "Dragao Eterno", preco: 249 }`).
- **`[]` (Colchetes):** delimitam **arrays / listas** (ex.: `tags: ["indie", "3D"]`).
- **Campo (*Field*):** par `chave: valor` dentro de um documento (não chame de "coluna" nem de "documento").
- **Case-sensitive:** operadores e nomes de campos diferenciam maiúsculas de minúsculas — o correto é **`$set`** (nunca com `S` maiúsculo), e `"Maringa"` é diferente de `"maringa"`.
- **Tipo de dado importa:** valores numéricos e monetários devem ser gravados como número (`preco: 249`, `salario: 7800.00`), **nunca** como string (`"7800.00"`), pois strings não somam em `$inc`/`$sum` e ordenam de forma alfabética (`"99" > "249"` é `true`, e `"1000" < "249"` também é `true`!).

> **Atenção na Base GameZone ([`Base-Gamezone-Revisao.js`](../bases/Base-Gamezone-Revisao.js)):**
> - Textos no script estão **sem acento/cedilha**: `"Dragao Eterno"`, `"acao"`, `"simulacao"`, `"Quebra-Cabeca Magico"`, `"Maringa"`, `"basico"`.
> - Em `clientes`, **não existe** campo `cidade` na raiz — apenas `endereco.cidade`!
> - O cliente de teste se chama `"Cliente Teste"` (`_id: 106`).

---

## 2. Glossário Rápido de Métodos CRUD

| Operação | Método `mongosh` | O que faz |
|---|---|---|
| **Create** | `insertOne(doc)` | Insere 1 documento; gera `_id` (`ObjectId`) se omitido |
| **Create** | `insertMany([docs], { ordered })` | Insere vários documentos de um array |
| **Read** | `find(filtro, projecao)` | Retorna um **cursor** com todos os documentos que casam |
| **Read** | `findOne(filtro, projecao)` | Retorna diretamente **1 documento** (o primeiro que casar) ou `null` |
| **Update** | `updateOne(filtro, update, opcoes)` | Atualiza o **primeiro** documento que casa |
| **Update** | `updateMany(filtro, update, opcoes)` | Atualiza **todos** os documentos que casam |
| **Update** | `replaceOne(filtro, novoDoc, opcoes)` | Substitui o documento inteiro (preservando `_id`) |
| **Delete** | `deleteOne(filtro)` | Remove o **primeiro** documento que casa |
| **Delete** | `deleteMany(filtro)` | Remove **todos** os documentos que casam |
| **Count** | `countDocuments(filtro)` | Conta documentos que atendem ao filtro |

---

## 3. Create — `insertOne` e `insertMany`

### 3.1 `insertOne`

```javascript
use gamezone_revisao

// Insere 1 jogo com tipos corretos (números como number, tags como array)
db.jogos.insertOne({
  titulo: "Horizonte Perdido",
  categoria: "aventura",
  preco: 159.90,
  estoque: 10,
  estoqueMin: 4,
  nota: 8.9,
  desenvolvedora: "PixelLab",
  tags: ["aventura", "singleplayer"]
});
```

### 3.2 `insertMany` e opção `ordered`

```javascript
// Insere vários clientes de uma vez (note o subdocumento endereco aninhado!)
db.clientes.insertMany([
  {
    nome: "Lucas Prado",
    plano: "basico",
    ativo: true,
    endereco: { rua: "Rua Parana, 50", cidade: "Maringa", uf: "PR" }
  },
  {
    nome: "Mariana Rocha",
    plano: "premium",
    ativo: true,
    endereco: { rua: "Av. Higienopolis, 300", cidade: "Londrina", uf: "PR" }
  }
], { ordered: false });
```

- **`ordered: true` (padrão):** se o 1º documento falhar (ex.: `_id` duplicado ou erro de validação), o MongoDB interrompe e não insere os seguintes.
- **`ordered: false`:** tenta inserir todos os documentos do array, reportando erros apenas dos que falharem.

---

## 4. Read — `find`, `findOne`, Projeção e Cursores

Assinatura oficial:

```javascript
db.colecao.find({ filtro }, { projecao })
```

- **Filtro `{}` (vazio):** significa "sem filtro" — retorna **todos** os documentos da coleção.
- **`campo: valor`:** igualdade implícita (equivale a `{ campo: { $eq: valor } }`).

### 4.1 Projeção e a Regra de Ouro (`1` vs `0`)

A projeção usa valores binários (`1` para incluir, `0` para excluir):
- **Inclusão:** `{ titulo: 1, preco: 1 }` mostra `titulo`, `preco` **e `_id`** (que sempre vem por padrão).
- **Exclusão:** `{ tags: 0, desenvolvedora: 0 }` mostra todos os campos **exceto** `tags` e `desenvolvedora`.
- **Regra de ouro:** **NÃO** é permitido misturar `1` e `0` no mesmo objeto de projeção (dá erro `Cannot do exclusion on field ... in inclusion projection`), **com uma única exceção: `_id: 0`**.

```javascript
// Pesquisa de todos os jogos mostrando apenas titulo e preco (sem _id)
db.jogos.find({}, { _id: 0, titulo: 1, preco: 1 });

// Pesquisa com filtro implícito de igualdade + projeção
db.funcionarios.find({ nome: "Ana Silva" }, { _id: 0, nome: 1, idade: 1 });

// findOne retorna apenas 1 documento (não um cursor)
db.jogos.findOne({ _id: 1 });
```

### 4.2 Ordenação, Limite e Paginação no Cursor

O `find()` retorna um cursor no qual podemos encadear `.sort()`, `.skip()` e `.limit()`:

```javascript
// Jogos da categoria "acao" com preco >= 100, ordenados do maior preço para o menor
db.jogos.find({
  categoria: "acao",
  preco: { $gte: 100 }
}).sort({ preco: -1 });

// Paginação: pula os 2 primeiros e pega os próximos 3 (1 = crescente, -1 = decrescente)
db.jogos.find({}, { _id: 0, titulo: 1, preco: 1 })
  .sort({ preco: 1 })
  .skip(2)
  .limit(3);
```

---

## 5. Operadores de Consulta (*Query Operators*)

### 5.1 Operadores de Comparação

| Operador | Significado | Exemplo |
|---|---|---|
| `$eq` | Igual a (opcional na forma direta) | `{ categoria: { $eq: "acao" } }` ou `{ categoria: "acao" }` |
| `$ne` | Diferente de | `{ categoria: { $ne: "teste" } }` |
| `$gt` | Maior que (`>`) | `{ preco: { $gt: 150 } }` |
| `$gte` | Maior ou igual (`>=`) | `{ preco: { $gte: 100 } }` |
| `$lt` | Menor que (`<`) | `{ estoque: { $lt: 5 } }` |
| `$lte` | Menor ou igual (`<=`) | `{ nota: { $lte: 8.5 } }` |
| `$in` | Está na lista (equivale a `IN` do SQL) | `{ categoria: { $in: ["acao", "aventura"] } }` |
| `$nin` | Não está na lista (`NOT IN` do SQL) | `{ categoria: { $nin: ["teste", "puzzle"] } }` |

### 5.2 Operadores Lógicos

| Operador | Comportamento | Exemplo |
|---|---|---|
| `$and` | Todas as condições verdadeiras (implícito ao separar por vírgula!) | `{ $and: [{ preco: { $gte: 100 } }, { estoque: { $gt: 0 } }] }` |
| `$or` | Pelo menos uma condição verdadeira | `{ $or: [{ categoria: "acao" }, { categoria: "aventura" }] }` |
| `$nor` | Nenhuma das condições verdadeira | `{ $nor: [{ categoria: "teste" }, { estoque: 0 }] }` |
| `$not` | Inverte o operador de um campo | `{ preco: { $not: { $gt: 200 } } }` |

> **Quando o `$and` explícito é obrigatório?** Quando você precisa aplicar **duas condições no mesmo campo** ou combinar **dois `$or`s** no mesmo filtro (em JS, chaves repetidas no mesmo objeto sobrescrevem a anterior!). Ex.: `{ $and: [{ tags: "indie" }, { tags: "3D" }] }` (ou `$all`).

### 5.3 Elemento e Expressão Regular (`$exists`, `$type`, `$regex`)

```javascript
// Documentos que possuem o campo "nota" (mesmo que null)
db.jogos.find({ nota: { $exists: true } });

// Documentos em que "preco" está salvo como string (ótimo para caçar dados sujos!)
db.jogos.find({ preco: { $type: "string" } });

// Busca textual por padrão regex (i = case-insensitive)
db.clientes.find({ nome: { $regex: /^ana/i } });
db.clientes.find({ nome: { $regex: "Teste", $options: "i" } });
```

### 5.4 Comparação entre Campos do Mesmo Documento (`$expr`)

Em consultas normais, `{ estoque: { $lt: "$estoqueMin" } }` **FALHA** porque o MongoDB entende `"$estoqueMin"` como uma **string literal**, e não como referência ao outro campo! Para comparar **campo vs campo**, use **`$expr`** (com operadores de agregação em formato de array):

```javascript
// Jogos com estoque abaixo do estoqueMin (estoque < estoqueMin)
db.jogos.find({
  $expr: { $lt: ["$estoque", "$estoqueMin"] }
});

// Jogos onde preco > nota * 20
db.jogos.find({
  $expr: { $gt: ["$preco", { $multiply: ["$nota", 20] }] }
});
```

### 5.5 Consulta em Arrays (`$all`, `$size`, `$elemMatch`)

| Operador | O que faz | Exemplo |
|---|---|---|
| Valor direto | Casa se o array **contiver** o valor | `db.jogos.find({ tags: "indie" })` |
| `$all` | Casa se o array contiver **todos** os valores listados | `db.jogos.find({ tags: { $all: ["indie", "3D"] } })` |
| `$size` | Casa pelo **tamanho exato** do array (não aceita faixa; para `>=`, use `$expr`) | `db.jogos.find({ tags: { $size: 3 } })` |
| `$elemMatch` | Casa quando **um mesmo elemento** do array satisfaz todas as condições | `db.pedidos.find({ itens: { $elemMatch: { qtd: { $gte: 2 }, preco: { $lt: 100 } } } })` |

---

## 6. Update — `updateOne`, `updateMany`, `replaceOne` e `upsert`

Assinatura oficial:

```javascript
db.colecao.updateOne(
  { /* 1. filtro (quem alterar) */ },
  { /* 2. $operador: { ... } (o que alterar) */ },
  { /* 3. opções: upsert, arrayFilters, etc. */ }
)
```

> **Erro clássico de prova:** Nunca passe campos soltos sem operador no 2º argumento de `updateOne` ou `updateMany` (ex.: `db.jogos.updateOne({ _id: 1 }, { preco: 10 })` gera erro `Update document requires atomic operators`). Se quiser substituir o documento inteiro, use **`replaceOne`**.

### 6.1 `replaceOne` e `{ upsert: true }`

```javascript
// replaceOne: substitui todo o documento (mantém o mesmo _id)
db.jogos.replaceOne(
  { _id: 9 },
  {
    titulo: "Jogo Demo",
    categoria: "teste",
    preco: 15,
    estoque: 1,
    estoqueMin: 0,
    nota: 6.0,
    desenvolvedora: "Teste",
    tags: ["demo"]
  }
);

// upsert: true -> atualiza se encontrar; se NÃO encontrar, insere um novo documento
db.jogos.updateOne(
  { titulo: "Novo Lancamento" },
  { $set: { categoria: "acao", preco: 199, estoque: 10 } },
  { upsert: true }
);
```

---

## 7. Operadores de Atualização de Campos

*(Seção inteiramente corrigida em relação ao rascunho antigo que repetia `$rename` por erro de copy-paste nas seções de `$inc` e `$mul`.)*

| Operador | Função | Exemplo Correto |
|---|---|---|
| **`$set`** | Define ou altera o valor de um campo (cria se não existir) | `{ $set: { cargo: "Cientista de dados", salario: 7800.00 } }` |
| **`$unset`** | Remove o campo do documento (o valor passado, como `""` ou `1`, é ignorado) | `{ $unset: { cargo: "" } }` |
| **`$rename`** | Renomeia o nome de um campo | `{ $rename: { habilidades: "competencias" } }` |
| **`$inc`** | Soma (ou subtrai com negativo) um valor numérico ao valor atual | `{ $inc: { salario: 500 } }` / `{ $inc: { preco: -10 } }` |
| **`$mul`** | Multiplica o valor numérico atual por um fator | `{ $mul: { salario: 1.1 } }` *(aumento de 10%)* |
| **`$min`** | Só atualiza se o novo valor for **menor** que o atual | `{ $min: { preco: 199 } }` |
| **`$max`** | Só atualiza se o novo valor for **maior** que o atual | `{ $max: { nota: 9.9 } }` |
| **`$currentDate`** | Grava a data/hora atual do servidor (`true` para `Date`) | `{ $currentDate: { atualizadoEm: true } }` |

Exemplos completos corrigidos:

```javascript
// $set com tipos numéricos corretos (nunca string '7800.00')
db.funcionarios.updateOne(
  { nome: "Daniel Farias" },
  { $set: { cargo: "Cientista de dados", salario: 7800.00 } }
);

// $unset removendo campo na raiz
db.funcionarios.updateOne(
  { nome: "Daniel Farias" },
  { $unset: { cargo: "" } }
);

// $rename renomeando o campo em todos os documentos
db.funcionarios.updateMany({}, { $rename: { habilidades: "competencias" } });

// $inc incrementando (+500) e decrementando (-500)
db.funcionarios.updateMany({}, { $inc: { salario: 500 } });
db.jogos.updateMany({ categoria: "esporte" }, { $inc: { preco: 10 } });

// $mul multiplicando por fator (ex.: reajuste de 10%)
db.funcionarios.updateMany({}, { $mul: { salario: 1.1 } });
```

---

## 8. Operadores de Atualização de Arrays

| Operador | Efeito | Permite duplicado? |
|---|---|---|
| **`$push`** | Adiciona elemento(s) ao **fim** do array | **Sim** |
| **`$addToSet`** | Adiciona elemento(s) **somente se não existir** no array | **Não** |
| **`$pop`** | Remove `1` (último elemento) ou `-1` (primeiro elemento) | — |
| **`$pull`** | Remove **todas** as ocorrências que casam com um valor ou condição | — |
| **`$pullAll`** | Remove todas as ocorrências que casam com qualquer item de uma lista | — |

### 8.1 Exemplos Corrigidos (`jogos` e `funcionarios`)

Considere inicialmente `{ tags: ["indie", "3D"] }`:

```javascript
// 1. $push: adiciona "promo" ao fim -> ["indie", "3D", "promo"]
db.jogos.updateOne(
  { titulo: "Dragao Eterno" },
  { $push: { tags: "promo" } }
);

// 2. $addToSet: tenta adicionar "indie" -> sem alteração se "indie" já existir
db.jogos.updateOne(
  { titulo: "Dragao Eterno" },
  { $addToSet: { tags: "indie" } }
);

// 3. $pull: remove por valor -> tira "3D"
db.jogos.updateOne(
  { titulo: "Dragao Eterno" },
  { $pull: { tags: "3D" } }
);

// 4. $pop: -1 remove o primeiro elemento; 1 remove o último
db.funcionarios.updateOne(
  { nome: "Daniel Farias" },
  { $pop: { competencias: -1 } }
);
db.jogos.updateOne(
  { titulo: "Cidade Neon" },
  { $pop: { tags: 1 } }
);

// 5. $pullAll: remove múltiplos valores específicos de uma vez
db.jogos.updateOne(
  { titulo: "Dragao Eterno" },
  { $pullAll: { tags: ["promo", "3D"] } }
);
```

### 8.2 Adicionando Vários Itens (`$each`) e Operadores Posicionais (`$` e `$[]`)

Se você passar um array direto no `$push` sem `$each`, ele insere um **array aninhado** (`["a", ["b", "c"]]`)! Para inserir cada elemento separadamente, use **`$each`**:

```javascript
// Adiciona vários itens sem criar array aninhado e sem duplicar
db.jogos.updateOne(
  { titulo: "Cidade Neon" },
  { $addToSet: { tags: { $each: ["cyberpunk", "singleplayer"] } } }
);

// Operador posicional "$": altera apenas o PRIMEIRO elemento do array que casou no filtro
db.funcionarios.updateOne(
  { nome: "Ana Silva", competencias: "JS" },
  { $set: { "competencias.$": "JavaScript" } }
);

// Operador "$[]": aplica alteração a TODOS os elementos do array (ex.: somar 5 em todas as notas)
db.turma.updateOne(
  { _id: 1 },
  { $inc: { "notas.$[]": 5 } }
);
```

---

## 9. Subdocumentos e Notação de Ponto (*Dot Notation*)

Um **subdocumento** é um objeto `{ ... }` aninhado dentro de outro documento. Ele **não** é uma `subquery` do SQL — trata-se de modelagem embutida (*embedding*).

### 9.1 Regra Crítica: `insertOne` vs `find` / `update`

> **Erro grave corrigido da aula:**
> - **Na inserção (`insertOne` / `insertMany`)**, você envia o **objeto aninhado** normal! **Não** se usa *dot notation* com chaves `"endereco.cidade"` no `insertOne`.
> - **Na consulta (`find`) e na atualização (`$set`, `$unset`)**, você usa **notação de ponto entre aspas** (`"endereco.cidade"`) para navegar até o campo interno.

### 9.2 A Armadilha da Sobrescrita de Subdocumento

```javascript
// CORRETO no insertOne: objeto aninhado
db.clientes.insertOne({
  nome: "Joao Pedro",
  plano: "basico",
  ativo: true,
  endereco: { rua: "Rua Nova, 10", cidade: "Maringa", uf: "PR" }
});

// CORRETO no find: dot notation entre aspas
db.clientes.find({ "endereco.cidade": "Maringa" });

// CORRETO no $set: altera SOMENTE a cidade, preservando rua e uf intactas!
db.clientes.updateOne(
  { _id: 101 },
  { $set: { "endereco.cidade": "Sarandi" } }
);

// ERRADO (armadilha de prova!): substitui o subdocumento inteiro e APAGA rua e uf!
db.clientes.updateOne(
  { _id: 101 },
  { $set: { endereco: { cidade: "Sarandi" } } }
);

// CORRETO no $unset: remove apenas um subcampo sem apagar o objeto todo
db.funcionarios.updateOne(
  { nome: "Daniel Farias" },
  { $unset: { "contato.telefone": "" } }
);
```

---

## 10. Delete — `deleteOne` e `deleteMany`

### Regra de Ouro Antes de Deletar
1. **Rode `find(filtro)` primeiro** com o exato mesmo filtro para ver quais documentos serão apagados.
2. **Nunca** execute `deleteMany({})` sem filtro em produção/prova (apaga todos os documentos da coleção!).
3. Confira o nome exato da coleção no plural (✅ correto: `db.funcionarios`, ❌ incorreto: `db.funcionario`).

```javascript
// 1. Conferir antes com find()
db.jogos.find({ categoria: "teste", estoque: 0 });

// 2. Apagar todos os jogos de teste sem estoque
db.jogos.deleteMany({ categoria: "teste", estoque: 0 });

// 3. Apagar apenas 1 cliente de teste (garante que nunca remove mais de 1 documento)
db.clientes.deleteOne({ nome: "Cliente Teste" });

// Exemplo corrigido da coleção funcionarios (no plural)
db.funcionarios.deleteOne({ nome: "Eduarda Lima" });
```

---

## 11. Cola Rápida de Prova (Erros Clássicos para Evitar)

- Escrever `{ preco: 10 }` sem `$set` / `$inc` no `updateOne`/`updateMany` → **falha**.
- Misturar `1` e `0` na projeção (exceto `_id: 0`) → **falha**.
- Atualizar subdocumento com `{ $set: { endereco: { cidade: "X" } } }` → **apaga `rua` e `uf`**.
- Comparar dois campos sem `$expr` (`{ estoque: { $lt: "$estoqueMin" } }`) → compara com a string `"$estoqueMin"`!
- Confundir `$push` (permite repetição) com `$addToSet` (não duplica) ou `$pop: 1` (fim) com `$pop: -1` (início).

---

## Próximos Passos
- Avance para [03 — Aggregation Pipeline](./03-aggregation-pipeline.md) para transformar, agrupar e juntar coleções.
- Pratique nos [Gabaritos GameZone (Exercícios 1–15)](../exercicios/01-gabaritos-gamezone-e-validacao-lol.md).
