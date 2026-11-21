# 05 — Modelagem de Dados, Transações e Escala no MongoDB

> **Guia de Estudo — Frente NoSQL/MongoDB** · Parte da trilha [NoSQL / MongoDB](../README.md)  
> **Foco de prova:** decisões de modelagem (*Embedding* vs *Referencing*), limite de 16 MB, atomicidade vs transações ACID, Replica Set e Sharding.

---

## 1. Regra de Ouro da Modelagem: *Embedding* vs *Referencing*

No modelo relacional, normalizamos pensando em "como evitar duplicação". No MongoDB, modelamos pensando em **"quais dados a aplicação lê e altera juntos"** (*data that is accessed together should be stored together*).

### 1.1 Comparativo Direto

| Critério | *Embedding* (Desnormalizado / Embutido) | *Referencing* (Normalizado / Por Referência) |
|---|---|---|
| **Como funciona** | Subdocumentos ou arrays dentro do documento pai (ex.: `clientes.endereco` em `gamezone_revisao`) | Armazena o `_id` de outro documento e junta na aplicação ou via `$lookup` (ex.: `vendas.clienteId` e `vendas.jogoId`) |
| **Leituras** | **1 única ida ao banco** (`find`) traz tudo | Exige múltiplas queries ou `$lookup` |
| **Escritas atômicas** | **Atômico nativamente** em 1 documento | Exige transação multi-documento para consistência estrita |
| **Quando escolher** | Relacionamentos **1:1** e **1:Poucos (1:N pequeno)**, dados lidos sempre juntos, arrays pequenos/limitados | Relacionamentos **1:Muitos (1:N grande)**, **N:N**, dados atualizados de forma independente ou muito grandes |
| **Risco principal** | Estourar o limite de **16 MB** por documento ou duplicação excessiva | Custo maior de leitura (`$lookup` / múltiplas viagens) |

### 1.2 Limite de 16 MB e Arrays *Bounded* vs *Unbounded*

- **Limite rígido:** todo documento BSON no MongoDB tem tamanho máximo de **16 MB** (para arquivos maiores, como vídeos/PDFs, usa-se **GridFS**, que divide o arquivo em `chunks` de 255 KB).
- **Array *Bounded* (Limitado):** cresce até um limite conhecido e pequeno (ex.: `tags` de um jogo, `endereco`s de entrega de um cliente, 12 parcelas). **Ótimo para *Embedding*.**
- **Array *Unbounded* (Ilimitado):** pode crescer indefinidamente ao longo do tempo (ex.: todos os logs de acesso de um usuário, milhões de comentários em um post, todas as vendas históricas dentro do documento `cliente`). **Anti-pattern!** Degrada índices e pode atingir os 16 MB — use ***Referencing***!

---

## 2. Padrões de Relacionamentos em MongoDB

### 2.1 Relacionamento 1:1 (*One-to-One*)

Preferencialmente **embutido** (*Embedding*), como o `endereco` dentro de `clientes` em [`Base-Gamezone-Revisao.js`](../bases/Base-Gamezone-Revisao.js):

```javascript
// 1:1 por Embedding — uma única leitura traz cliente e endereço juntos
const clienteExemplo = {
  _id: 101,
  nome: "Ana Souza",
  plano: "basico",
  ativo: true,
  endereco: {
    rua: "Av. Brasil, 100",
    cidade: "Maringa",
    uf: "PR"
  }
};
```

### 2.2 Relacionamento 1:Poucos (*One-to-Few*)

**Embedding em array:** ideal quando o lado "poucos" tem dezenas ou centenas de itens pequenos no máximo (ex.: `tags` em `jogos` ou `matriculas` de um aluno).

### 2.3 Relacionamento 1:Muitos (*One-to-Many* / *One-to-Squillions*)

Quando "muitos" pode chegar a milhares ou milhões (ex.: um produto com 50 mil avaliações ou um sensor IoT gerando leituras por segundo), use **Referência do Filho para o Pai** (*Child Referencing* invertido / *Parent Referencing*): cada avaliação armazena `jogoId`, e **não** um array gigante dentro de `jogos`.

### 2.4 Relacionamento N:N (*Many-to-Many*)

Existem duas formas comuns:
1. **Coleção associativa (como no relacional):** é exatamente o padrão de **`vendas`** em [`Base-Gamezone-Revisao.js`](../bases/Base-Gamezone-Revisao.js), onde um cliente compra vários jogos e um jogo é vendido para vários clientes:
   ```javascript
   // Coleção vendas conectando clienteId (clientes._id) e jogoId (jogos._id)
   const vendaExemplo = {
     _id: 1001,
     clienteId: 101,
     jogoId: 1,
     qtd: 1,
     valorTotal: 249,
     data: ISODate("2024-03-02T00:00:00Z"),
     canal: "loja"
   };
   ```
2. **Array de referências (`_id`s):** útil quando ambos os lados têm poucos vínculos (ex.: `aluno` com array de `turmaIds`).

> **Padrão *Extended Reference* (Referência Estendida):** Em leituras muito frequentes (ex.: exibir extrato de vendas com o título do jogo), pode-se duplicar campos pouco mutáveis (como `tituloJogo`) dentro de `vendas` para evitar `$lookup` a cada listagem.

---

## 3. Atomicidade de Documento Único vs Transações ACID Multi-Documento

### 3.1 Atomicidade Nativa (1 Documento)

No MongoDB, qualquer operação de escrita em um **único documento** (`insertOne`, `updateOne`, `findOneAndUpdate`) é **100% atômica**: ou todos os campos/arrays/subdocumentos daquele documento são atualizados juntos, ou nenhum é.

> **Dica de prova:** Muitas operações que exigiriam `BEGIN TRANSACTION` no SQL (ex.: atualizar um pedido e seus itens em `pedidos` + `itens_pedido`) tornam-se atômicas **sem transação** no MongoDB se `itens` estiverem embutidos no documento `pedido`!

### 3.2 Transações Multi-Documento ACID (v4.0+ / v4.2+ em Sharded Clusters)

Quando é obrigatório manter consistência entre **múltiplos documentos ou coleções** (ex.: registrar uma venda em `vendas` **e** decrementar `estoque` em `jogos`), usamos transações ACID via **Session** (requer Replica Set ou Sharded Cluster — não funciona em `mongod` *standalone*):

```javascript
const session = db.getMongo().startSession();
session.startTransaction();

try {
  const jogosCol = session.getDatabase("gamezone_revisao").jogos;
  const vendasCol = session.getDatabase("gamezone_revisao").vendas;

  // 1. Decrementa estoque somente se houver saldo suficiente
  const res = jogosCol.updateOne(
    { _id: 2, estoque: { $gte: 1 } },
    { $inc: { estoque: -1 } }
  );

  if (res.modifiedCount === 0) {
    throw new Error("Estoque insuficiente para concluir a venda.");
  }

  // 2. Registra a venda na mesma transação
  vendasCol.insertOne({
    clienteId: 101,
    jogoId: 2,
    qtd: 1,
    valorTotal: 179,
    data: new Date(),
    canal: "online"
  });

  // Confirma as duas operações juntas (tudo ou nada)
  session.commitTransaction();
} catch (erro) {
  // Desfaz tudo caso ocorra erro
  session.abortTransaction();
  print("Transacao abortada: " + erro.message);
} finally {
  session.endSession();
}
```

---

## 4. Replica Set (Alta Disponibilidade e Tolerância a Falhas)

Um **Replica Set** é um grupo de instâncias `mongod` que mantêm **o mesmo conjunto de dados** para garantir redundância e alta disponibilidade (*High Availability*).

```text
           [ Aplicação / Driver ]
              │ (escritas)    ▲ (leituras)
              ▼               │
        ┌───────────┐         │
        │  PRIMARY  │─────────┘
        └─────┬─────┘
              │ replicação assíncrona via oplog
      ┌───────┴───────┐
      ▼               ▼
┌───────────┐   ┌───────────┐
│ SECONDARY │   │ SECONDARY │   (ou ARBITER: apenas vota, sem dados)
└───────────┘   └───────────┘
```

### Conceitos Essenciais de Prova

- **Primary:** único nó que recebe **escritas** por padrão. Registra cada alteração no **`oplog`** (*operations log* — coleção especial idempotente).
- **Secondary:** replica continuamente o `oplog` do Primary para manter cópia dos dados. Pode atender leituras se configurado.
- **Arbiter:** nó leve que **não armazena dados**, servindo apenas para desempatar eleições (mantém número **ímpar** de votos no Replica Set, ex.: 1 Primary + 1 Secondary + 1 Arbiter).
- **Failover Automático:** se o Primary cair ou perder contato com a maioria, os nós restantes realizam uma **eleição** e promovem um Secondary a novo Primary automaticamente (geralmente em poucos segundos).
- **Write Concern (`w`):** define quantos nós precisam confirmar a escrita antes de retornar sucesso ao cliente:
  - `w: 1` (rápido, só o Primary confirma; risco de rollback se cair antes de replicar).
  - **`w: "majority"`** (recomendado para durabilidade: maioria dos nós gravou; garante consistência **CP**).
  - `j: true` (garante gravação no *journal* em disco antes de confirmar).
- **Read Preference:** onde a leitura pode ser feita (`primary` [padrão], `primaryPreferred`, `secondary`, `secondaryPreferred`, `nearest`). Leituras em `secondary` oferecem escala de leitura, porém com **consistência eventual**.

---

## 5. Sharding (Escalabilidade Horizontal)

Quando um único servidor (mesmo em Replica Set) não comporta mais o **volume de dados em disco/RAM** ou a **taxa de escrita**, usa-se **Sharding** para particionar a coleção horizontalmente entre vários servidores (**Shards**).

### 5.1 Componentes da Arquitetura *Sharded Cluster*

| Componente | Papel |
|---|---|
| **`mongos`** | Roteador de consultas: recebe requisições da aplicação e encaminha apenas ao(s) Shard(s) dono(s) dos dados |
| **Config Servers** | Replica Set que armazena os **metadados** do cluster (qual faixa/chunk de dados está em qual Shard) |
| **Shards** | Cada Shard é um **Replica Set** independente que armazena uma fração (*chunks*) dos dados |
| **Chunks** | Blocos contíguos de documentos particionados com base na **Shard Key** |

### 5.2 Escolhendo a *Shard Key* (Pergunta Clássica de Prova!)

A **Shard Key** define em qual Shard cada documento será gravado. Uma escolha ruim cria gargalo (*hotspot*) e não pode ser alterada facilmente depois.

Os **3 critérios fundamentais** de uma boa Shard Key:
1. **Alta Cardinalidade:** possuir muitos valores distintos (ex.: `clienteId` ou `cpf` é bom; `uf` ou `ativo: true/false` é péssimo pois cria no máximo 27 ou 2 partições!).
2. **Baixa Frequência (Distribuição Uniforme):** evitar valores que se repetem desproporcionalmente, criando *jumbo chunks* impossíveis de dividir.
3. **Não-Monotonicidade (evitar *hotspots* de escrita):** chaves que crescem sempre em sequência (como `timestamp` ou `ObjectId` em *Ranged Sharding*) jogam **100% das novas inserções no último Shard**.
   - **Solução:** usar **Hashed Sharding** (`{ _id: "hashed" }`) para espalhar inserções uniformemente, ou uma **Shard Key composta** (ex.: `{ categoria: 1, _id: 1 }`) para equilibrar consultas direcionadas (*targeted queries*) e distribuição.

> **Targeted Query vs Scatter-Gather:**
> - **Targeted Query:** o filtro contém a Shard Key → o `mongos` consulta **apenas 1 Shard** (muito rápido).
> - **Scatter-Gather:** o filtro **não** contém a Shard Key → o `mongos` precisa perguntar para **todos os Shards** e juntar as respostas (mais lento).

---

## 6. Resumo Final de Arquitetura para Prova

- **Precisa de atomicidade simples?** Modele junto (*Embedding*) em 1 documento.
- **Array cresce para sempre?** Não embuta (*unbounded array*) — referencie em coleção separada.
- **Precisa alterar 2 coleções juntas com ACID?** Use *Session* + `startTransaction` / `commitTransaction`.
- **Quer tolerância a falhas e alta disponibilidade?** **Replica Set** (Primary + Secondaries + `oplog`).
- **Quer escalar horizontalmente armazenamento e throughput de escrita?** **Sharding** (`mongos` + Config Servers + Shards + boa Shard Key).

---

## Próximos Passos
- Teste todos os seus conhecimentos nos [Gabaritos GameZone e Validação LoL](../exercicios/01-gabaritos-gamezone-e-validacao-lol.md) e no [Simulado de Prova MongoDB](../exercicios/02-simulado-prova-mongodb.md).
- Volte ao [Índice da Frente NoSQL](../README.md).
