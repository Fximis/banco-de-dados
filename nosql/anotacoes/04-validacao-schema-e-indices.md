# 04 — Validação de Esquema (`$jsonSchema`) e Índices

> **Guia de Estudo — Frente NoSQL/MongoDB** · Parte da trilha [NoSQL / MongoDB](../README.md)  
> **Fontes consolidadas:** anotações da aula de validação, [`Aula_02_MongoDB_Restricoes_Progressiva.pdf`](../materiais-aula/validacao-de-esquema/Aula_02_MongoDB_Restricoes_Progressiva.pdf) (Níveis 1–10) e [`Validação-de-Esquema-no-MongoDB.pdf`](../materiais-aula/validacao-de-esquema/Validação-de-Esquema-no-MongoDB.pdf).

---

## 1. Por que validar no MongoDB e Correlação com SQL

O MongoDB é flexível por padrão, mas em produção precisamos de um **contrato na coleção** para rejeitar dados errados na **escrita** (em vez de descobrir bugs tarde, na leitura).

### Correlação Direta: Relacional (SQL) → MongoDB

| Conceito no SQL | Equivalente no MongoDB | Onde fica |
|---|---|---|
| `NOT NULL` | `required: ["campo"]` | Dentro de `$jsonSchema` |
| Tipo (`VARCHAR`, `INT`, `BOOLEAN`) | `bsonType: "string" \| "int" \| "bool" \| "number"` | Dentro de `properties.<campo>` |
| `CHECK (status IN (...))` | `enum: [...]` (combinado com `bsonType`) | Dentro de `properties.<campo>` |
| `CHECK (idade >= 18)` | `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum` | Dentro de `properties.<campo>` |
| `UNIQUE` | `db.colecao.createIndex({ campo: 1 }, { unique: true })` | **Fora** do `$jsonSchema` (é índice!) |
| `FOREIGN KEY` | Decisão de modelagem: *Embedding* ou *Referencing* | Veja [Guia 05](./05-modelagem-transacoes-e-escala.md) |

---

## 2. Anatomia Oficial do `$jsonSchema`

```javascript
db.createCollection("nome_da_colecao", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      title: "Descrição opcional do contrato",
      required: ["campo1", "campo2"],
      properties: {
        campo1: { bsonType: "string", minLength: 3 },
        campo2: {
          bsonType: "string",
          enum: ["France", "United Kingdom", "United States"],
          description: "Deve ser France, United Kingdom ou United States"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
```

### Correções Importantes das Anotações Originais
1. **Palavras-chave exatas (case-sensitive):** `db.createCollection`, `validator`, `bsonType: "object"`, `bsonType: "string"` (sempre minúsculo!), `minLength` (sem `$` e com `th` no final).
2. **`required` vs `properties` e valores `null`:**
   - `required` verifica **apenas se a chave existe** no documento (`{ campo: null }` **passa** no `required` se não houver restrição de `bsonType`!).
   - `properties` valida o valor **se o campo aparecer**. Ao contrário do que foi anotado inicialmente, se `properties` definir `{ idade: { bsonType: "int" } }`, enviar `idade: null` **FALHA**, pois `null` tem tipo BSON `"null"`, e não `"int"`. Para permitir nulo, declare explicitamente união de tipos: `bsonType: ["string", "null"]`.

---

## 3. Escada Progressiva Completa (Níveis 1 a 10)

Baseada em [`Aula_02_MongoDB_Restricoes_Progressiva.pdf`](../materiais-aula/validacao-de-esquema/Aula_02_MongoDB_Restricoes_Progressiva.pdf) — coleção `alunos` corrigida e padronizada sem acento em identificadores (`endereco`):

### Nível 1 — Campos Obrigatórios (`required`)

```javascript
db.createCollection("alunosv1", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nome", "email", "idade", "ativo"]
    }
  }
});
```

### Nível 2 — Tipagem BSON (`bsonType`) e Múltiplos Tipos

```javascript
db.createCollection("alunosv2", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nome", "email", "idade", "ativo"],
      properties: {
        nome: { bsonType: "string" },
        email: { bsonType: "string" },
        idade: { bsonType: "int" },
        ativo: { bsonType: "bool" },
        apelido: { bsonType: ["string", "null"] } // União de tipos: aceita texto ou null
      }
    }
  }
});

db.alunosv2.insertOne({
  nome: "Joao",
  email: "teste@teste.com",
  idade: 14,
  ativo: true
});
```

> **Armadilha Crítica no `mongosh`: `"number"` vs `"int"` vs `"double"`**  
> No JavaScript do `mongosh`, números sem parte fracionária (incluindo `10` e `10.0`, já que `10.0 === 10` em JS!) são serializados como BSON **Int32 (`"int"`)**, enquanto `1.10` vira **Double (`"double"`)**.  
> - Se você definir `nota: { bsonType: "double" }` e alguém enviar `nota: 10`, **o insert FALHA**!  
> - Use `bsonType: "int"` quando quiser barrar decimais (ex.: `idade`, `hp`, `estoque`).  
> - Use **`bsonType: "number"`** quando o campo puder receber inteiros e decimais livremente (ex.: `nota`, `preco`).

### Nível 3 — Lista Fechada de Valores (`enum`)

Combine sempre `enum` com `bsonType: "string"` (comparação exata e sensível a maiúsculas/acentos: `"ativo"` ≠ `"Ativo"`):

```javascript
db.createCollection("alunosv3", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nome", "email", "idade", "ativo"],
      properties: {
        nome: { bsonType: "string" },
        email: { bsonType: "string" },
        idade: { bsonType: "int" },
        ativo: { bsonType: "bool" },
        status: {
          bsonType: "string",
          enum: ["ativo", "inativo", "trancado"]
        }
      }
    }
  }
});

db.alunosv3.insertOne({
  nome: "Lia",
  email: "lia@teste.com",
  idade: 20,
  ativo: true,
  status: "ativo"
});
```

### Nível 4 — Intervalos Numéricos e Tamanho de Texto

- Números: `minimum`, `maximum`, `exclusiveMinimum: true/false` (no Draft 4 usado pelo MongoDB, `exclusiveMinimum` é booleano junto a `minimum`), `exclusiveMaximum`.
- Strings: `minLength`, `maxLength`.

```javascript
db.createCollection("alunosv4", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nome", "email", "idade", "ativo"],
      properties: {
        nome: { bsonType: "string", minLength: 3 },
        email: { bsonType: "string" },
        idade: { bsonType: "int", minimum: 18 },
        ativo: { bsonType: "bool" },
        status: { bsonType: "string", enum: ["ativo", "inativo", "trancado"] },
        nota: { bsonType: "number", minimum: 0, maximum: 10 }
      }
    }
  }
});

db.alunosv4.insertOne({
  nome: "Joao",
  email: "teste@teste.com",
  idade: 18,
  ativo: true,
  nota: 1.10,
  status: "trancado"
});
```

### Nível 5 — Unicidade (`unique`) via Índice

Unicidade **não** faz parte do `$jsonSchema` porque exige comparar um documento contra todos os outros da coleção:

```javascript
// 1 = ordem crescente, -1 = ordem decrescente
db.alunosv4.createIndex({ email: 1 }, { unique: true });
```

### Nível 6 — Arrays Simples (`array`, `minItems`, `items`, `uniqueItems`)

**Correção:** `minItems` **não** é obrigatório ao declarar `bsonType: "array"`. E **sem `items`**, o MongoDB valida apenas que o campo é uma lista ("só a casca"), aceitando qualquer tipo lá dentro!

```javascript
db.createCollection("alunosv6", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nome", "email", "idade", "ativo"],
      properties: {
        nome: { bsonType: "string" },
        email: { bsonType: "string" },
        idade: { bsonType: "int", minimum: 18 },
        ativo: { bsonType: "bool" },
        disciplinas: {
          bsonType: "array",
          minItems: 1,
          uniqueItems: true,
          items: { bsonType: "string" }
        }
      }
    }
  }
});
```

### Nível 7 — Subdocumento Simples (`object` aninhado)

Padronize o nome do campo sem cedilha (`endereco`) para bater com as consultas:

```javascript
db.createCollection("alunosv7", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nome", "email", "idade", "ativo"],
      properties: {
        nome: { bsonType: "string" },
        email: { bsonType: "string" },
        idade: { bsonType: "int", minimum: 18 },
        ativo: { bsonType: "bool" },
        endereco: {
          bsonType: "object",
          required: ["cidade", "uf"],
          properties: {
            cidade: { bsonType: "string" },
            uf: { bsonType: "string" }
          }
        }
      }
    }
  }
});

// Na inserção (insertOne), envia-se o OBJETO aninhado (NÃO use dot notation no insertOne!):
db.alunosv7.insertOne({
  nome: "Ana",
  email: "ana@teste.com",
  idade: 22,
  ativo: true,
  endereco: { cidade: "Maringa", uf: "PR" }
});
```

*(Para consultar ou atualizar subdocumentos com `find` e `$set`, veja *dot notation* no [Guia 02](./02-crud-completo-e-operadores.md#9-subdocumentos-e-notação-de-ponto-dot-notation).)*

### Nível 8 — Arrays de Objetos (`items` com `bsonType: "object"`)

```javascript
// Trecho dentro de properties:
// matriculas exige um array onde CADA elemento é um objeto validado
const regraMatriculas = {
  bsonType: "array",
  minItems: 1,
  items: {
    bsonType: "object",
    required: ["curso", "semestre", "situacao"],
    properties: {
      curso: { bsonType: "string" },
      semestre: { bsonType: "int", minimum: 1 },
      situacao: {
        bsonType: "string",
        enum: ["cursando", "aprovado", "reprovado"]
      }
    }
  }
};
```

### Nível 9 — Formatos com Expressão Regular (`pattern`)

```javascript
// Dentro de properties (em string JavaScript, "\\" vira "\" na regex):
const regrasFormato = {
  email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
  cpf: { bsonType: "string", pattern: "^[0-9]{11}$" },
  cep: { bsonType: "string", pattern: "^[0-9]{8}$" },
  uf: { bsonType: "string", pattern: "^[A-Z]{2}$" }
};
```

### Nível 10 — Schema Completo + `additionalProperties: false`

> **ARMADILHA CRÍTICA DE PROVA (`additionalProperties: false` na raiz):**  
> Todo documento no MongoDB tem um campo **`_id`** (informado por você ou gerado automaticamente como `ObjectId`). Se você colocar `additionalProperties: false` no `$jsonSchema` raiz e **esquecer de listar `_id` dentro de `properties`**, **100% dos `insertOne` serão rejeitados**, porque o `_id` será tratado como campo extra não permitido!

```javascript
db.createCollection("alunos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nome", "email", "idade", "ativo", "status"],
      additionalProperties: false,
      properties: {
        _id: { bsonType: ["objectId", "int"] }, // OBRIGATÓRIO quando additionalProperties: false!
        nome: { bsonType: "string", minLength: 3 },
        email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
        idade: { bsonType: "int", minimum: 18 },
        ativo: { bsonType: "bool" },
        status: { bsonType: "string", enum: ["ativo", "inativo", "trancado"] },
        disciplinas: {
          bsonType: "array",
          minItems: 1,
          items: { bsonType: "string" }
        },
        endereco: {
          bsonType: "object",
          required: ["cidade", "uf"],
          additionalProperties: false,
          properties: {
            cidade: { bsonType: "string" },
            uf: { bsonType: "string", pattern: "^[A-Z]{2}$" }
          }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

db.alunos.createIndex({ email: 1 }, { unique: true });
```

---

## 4. Governança de Validação: `validationLevel`, `validationAction` e `collMod`

### 4.1 Matriz `validationLevel` × `validationAction`

| `validationLevel` | Quando a regra é verificada? | Uso ideal |
|---|---|---|
| **`"strict"`** *(padrão)* | Em **todos** os `insert`s e **todos** os `update`s | Coleção nova/limpa |
| **`"moderate"`** | Em novos `insert`s e em `update`s **somente de documentos que já eram válidos** | Migração gradual com dados legados inválidos |
| **`"off"`** | Validação desligada | Manutenção / carga excepcional |

| `validationAction` | O que acontece quando um documento falha na regra? | Uso ideal |
|---|---|---|
| **`"error"`** *(padrão)* | **Rejeita** a escrita (`MongoServerError: Document failed validation`, código `121`) | Produção / regra ativa |
| **`"warn"`** | **Aceita** a escrita e registra aviso no log do `mongod` | Testar impacto da regra antes de bloquear |

### 4.2 Alterando ou Removendo Regras Depois (`collMod`)

```javascript
// Alterar apenas level/action (mantém o validator atual intacto)
db.runCommand({
  collMod: "campeoes_validados",
  validationLevel: "moderate",
  validationAction: "warn"
});

// Desligar validação completamente
db.runCommand({
  collMod: "campeoes_validados",
  validator: {},
  validationLevel: "off"
});
```

> **ARMADILHA CRÍTICA DO `collMod`:**
> 1. **Substituição integral (NÃO faz merge):** se você enviar a chave `validator` no `collMod`, o novo `$jsonSchema` **substitui por completo** o anterior! Enviar só o campo novo apaga todo o resto do schema.
> 2. **Não reescreve dados antigos:** documentos já gravados que violam a nova regra permanecem na coleção até serem atualizados.

### 4.3 Exemplo Corrigido dos Slides: `campeoes_validados`

*(Versão corrigida do Slide 13, incluindo `_id` em `properties` por causa de `additionalProperties: false`.)*

```javascript
db.createCollection("campeoes_validados", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "role", "region", "stats"],
      additionalProperties: false,
      properties: {
        _id: { bsonType: ["objectId", "int"] },
        name: { bsonType: "string" },
        role: {
          bsonType: "string",
          enum: ["Mago", "Lutador", "Tanque", "Suporte", "Atirador", "Assassino"]
        },
        region: { bsonType: "string" },
        stats: {
          bsonType: "object",
          properties: {
            hp: { bsonType: "int", minimum: 1, maximum: 2000 }
          }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
```

---

## 5. Checklist: Os Erros Mais Comuns em Validação (Prova)

1. Esquecer `$jsonSchema` dentro de `validator` (ou errar a grafia de `validator` / `bsonType`).
2. Usar tipo BSON capitalizado com inicial maiúscula ou usar `"boolean"` em vez de `"bool"` — os nomes corretos são sempre em minúsculas (`"string"` e `"bool"`).
3. Colocar `additionalProperties: false` na raiz **sem incluir `_id` em `properties`**.
4. Usar `bsonType: "double"` para `nota`/`preco` e enviar `10` ou `10.0` no `mongosh` (use `"number"`!).
5. Esquecer `items` ao validar `array` — valida só a "casca", aceitando qualquer lixo dentro.
6. Enviar `validator` parcial no `collMod` achando que vai mesclar com o anterior.
7. Esquecer que `enum` é *case-sensitive* (`"mago"` ≠ `"Mago"`) e sempre combiná-lo com `bsonType`.
8. Usar `required` achando que bloqueia `null` — `required` só checa presença da chave!
9. Exigir em `required` um campo ausente em dados antigos com `validationLevel: "strict"` — isso bloqueia qualquer `update` nos documentos legados que ainda não têm o campo; use `validationLevel: "moderate"` durante a migração.

---

## 6. Índices e Análise de Performance (`explain`)

Sem índices, o MongoDB faz **varredura completa da coleção (`COLLSCAN`)**, lendo todos os documentos do disco/RAM para achar os que atendem ao filtro.

### 6.1 Gerenciando Índices

```javascript
// Cria índice simples crescente (1 = crescente, -1 = decrescente)
db.jogos.createIndex({ categoria: 1 });

// Lista todos os índices da coleção (sempre existe o índice padrão _id_)
db.jogos.getIndexes();

// Remove um índice pelo nome ou pela especificação
db.jogos.dropIndex("categoria_1");
```

### 6.2 Tipos de Índices Essenciais para Prova

| Tipo | Sintaxe | Para que serve / Pegadinha |
|---|---|---|
| **Simples** | `{ preco: -1 }` | Acelera filtro e ordenação em 1 campo (`1` asc, `-1` desc) |
| **Composto** | `{ categoria: 1, preco: -1 }` | Múltiplos campos — siga a **Regra ESR** abaixo! |
| **Único** | `createIndex({ email: 1 }, { unique: true })` | Impede duplicados. **Pegadinha:** se dois docs não têm o campo (ou têm `null`), eles colidem! Use `{ unique: true, sparse: true }` ou `partialFilterExpression` |
| **Multikey** | `createIndex({ tags: 1 })` | Criado automaticamente quando o campo indexado é um **array** (indexa cada elemento) |
| **TTL** | `createIndex({ criadoEm: 1 }, { expireAfterSeconds: 3600 })` | Expira e apaga documentos automaticamente após N segundos (só funciona em campos `Date`) |
| **Text** | `createIndex({ titulo: "text", descricao: "text" })` | Busca textual com `{ $text: { $search: "dragao" } }` |

### 6.3 Regra ESR para Índices Compostos (Muito Cobrada!)

Ao projetar um índice composto que atenda a filtros + ordenação, ordene os campos na seguinte prioridade:
1. **E — Equality (Igualdade):** campos filtrados com igualdade exata (`categoria: "acao"`).
2. **S — Sort (Ordenação):** campos do `.sort({ nota: -1 })` (evita ordenação em memória!).
3. **R — Range (Faixa):** campos com `$gt`, `$gte`, `$lt`, `$lte`, `$in` (`preco >= 100`).

```javascript
// Consulta: db.jogos.find({ categoria: "acao", preco: { $gte: 100 } }).sort({ nota: -1 })
// Índice ideal pela regra ESR:
db.jogos.createIndex({ categoria: 1, nota: -1, preco: 1 });
```

### 6.4 Lendo `explain("executionStats")`

```javascript
db.jogos.find({ categoria: "acao", preco: { $gte: 100 } }).explain("executionStats");
```

O que observar na saída:
- **`winningPlan.stage`:**
  - `COLLSCAN` → leu a coleção inteira (ruim em coleções grandes!).
  - `IXSCAN` → usou índice (bom!), geralmente seguido de `FETCH` para buscar o documento completo (ou `PROJECTION_COVERED` quando *Covered Query* retorna só campos do índice, sem `FETCH`).
- **Métricas de eficiência:**
  - `nReturned`: quantos documentos foram retornados.
  - `totalKeysExamined`: quantas entradas de índice foram lidas.
  - `totalDocsExamined`: quantos documentos foram abertos na coleção (ideal que fique próximo de `nReturned`).

---

## 7. Referências Visuais da Aula (Capturas Originais Preservadas)

Capturas da aula sobre anatomia do `$jsonSchema` e validação de esquema no MongoDB:

<img width="597" height="281" alt="image" src="https://github.com/user-attachments/assets/a7ef35e6-3f1b-4a8e-9565-9285e0f1cc06" />

*Figura 1 — Visão geral da validação de esquema no MongoDB.*

<img width="596" height="435" alt="image" src="https://github.com/user-attachments/assets/89680b16-ac01-4c91-9d72-7a23aa59233e" />

*Figura 2 — Estrutura de `validator` e `$jsonSchema` em aula.*

<img width="593" height="437" alt="image" src="https://github.com/user-attachments/assets/cbc32f7d-ffb8-4e2b-9660-059abd458395" />

*Figura 3 — Detalhamento de `required`, `properties` e tipos BSON.*

<img width="593" height="269" alt="image" src="https://github.com/user-attachments/assets/81a95c26-6cad-4efd-98b5-03fccda7adf0" />

*Figura 4 — Exemplo prático de restrições com `enum` e limites.*

<img width="594" height="298" alt="image" src="https://github.com/user-attachments/assets/7cd4c6ff-e105-446e-99b8-f6974368de0c" />

*Figura 5 — Teste de validação e leitura do resultado.*

<img width="597" height="281" alt="image" src="https://github.com/user-attachments/assets/a9e8e0f6-9eae-494b-8613-62d083c33037" />

*Figura 6 — Consolidação das regras de esquema em aula.*

---

## Próximos Passos
- Pratique nos 14 exercícios comentados de validação em [Gabaritos GameZone e Validação LoL](../exercicios/01-gabaritos-gamezone-e-validacao-lol.md).
- Avance para [05 — Modelagem, Transações e Escala](./05-modelagem-transacoes-e-escala.md).
