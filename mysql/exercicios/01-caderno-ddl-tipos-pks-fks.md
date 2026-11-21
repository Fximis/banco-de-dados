# Caderno de Exercícios DDL — Tipos de Dados, Chaves Primárias, Constraints e Chaves Estrangeiras (65 Questões)

> **Teoria de apoio:** Consulte [`../anotacoes/02-ddl-tipos-dados-e-constraints.md`](../anotacoes/02-ddl-tipos-dados-e-constraints.md) para a explicação teórica completa de cada tipo de dado, regra do MySQL 8.x e comparação `DELETE` vs `TRUNCATE` vs `DROP`.
>
> **Origem consolidada:** Este caderno reúne, corrige e completa os 35 exercícios dos Blocos 1–2 do arquivo legado `exc`, os exercícios e correções de bugs do Bloco 3 de `Anotações de coisas que fui errando.md` e completa os 15 exercícios do Bloco 4 (`FOREIGN KEY` e ações em cascata, interrompido originalmente no item 51).

---

## Sumário dos Blocos

| Bloco | Questões | Tema |
|---|---|---|
| [Bloco 1](#bloco-1--tipos-de-dados-e-criação-básica-questões-1-a-20) | 1 a 20 | Criação de tabelas, escolha de tipos MySQL 8.x e correções de precisão |
| [Bloco 2](#bloco-2--chaves-primárias-simples-compostas-e-naturais-questões-21-a-35) | 21 a 35 | PK inline, nomeada em tabela, via `ALTER TABLE`, composta e natural |
| [Bloco 3](#bloco-3--constraints-unique-check-default-e-exclusão-delete-truncate-drop-questões-36-a-50) | 36 a 50 | `UNIQUE`, `CHECK` (bugs de `OR`/`IN` corrigidos), `DELETE`, `TRUNCATE`, `DROP` |
| [Bloco 4](#bloco-4--integridade-referencial-foreign-key-e-ações-em-cascata-questões-51-a-65) | 51 a 65 | `FOREIGN KEY`, `CASCADE`, `SET NULL`, `RESTRICT`, FK composta, auto-FK e erros |
| [Script Executável Completo](#script-executável-completo-mysql-8x) | 1 a 65 | Script único pronto para execução integral no MySQL 8.x |

---

## Bloco 1 — Tipos de Dados e Criação Básica (Questões 1 a 20)

> **Nota sobre o rascunho original (`exc`):** Todas as 20 tabelas do Bloco 1 original foram escritas **sem `PRIMARY KEY`**, além de apresentarem problemas específicos de tipo (`nota FLOAT`, `percentual DECIMAL(4,2)`, `porta SMALLINT`, `conteudo_binario BLOB`, typo `notificao`). Abaixo estão os enunciados reconstruídos, o SQL corrigido e o diagnóstico de cada ajuste.

### Exercício 1 — Tabela `departamento`
**Enunciado:** Crie a tabela `departamento` com identificador inteiro autoincremental (PK) e nome obrigatório único de até 50 caracteres.
```sql
CREATE TABLE departamento (
    id_departamento INT AUTO_INCREMENT PRIMARY KEY,
    nome_departamento VARCHAR(50) NOT NULL,
    CONSTRAINT uq_departamento_nome UNIQUE (nome_departamento)
);
```
> **Correção vs original:** Adicionada `PRIMARY KEY` (`AUTO_INCREMENT`) e `UNIQUE` em `nome_departamento` para evitar departamentos duplicados.

### Exercício 2 — Tabela `cargo`
**Enunciado:** Crie a tabela `cargo` com identificador inteiro (PK), título obrigatório de até 60 caracteres e salário-base monetário positivo obrigatório.
```sql
CREATE TABLE cargo (
    id_cargo INT AUTO_INCREMENT PRIMARY KEY,
    titulo_cargo VARCHAR(60) NOT NULL,
    salario_base_cargo DECIMAL(10,2) NOT NULL,
    CONSTRAINT ck_cargo_salario CHECK (salario_base_cargo > 0)
);
```
> **Correção vs original:** Adicionada `PRIMARY KEY` e `CHECK (salario_base_cargo > 0)`.

### Exercício 3 — Tabela `log_acesso`
**Enunciado:** Crie a tabela `log_acesso` para alto volume de registros (`BIGINT`), armazenando endereço IP (compatível com IPv4 e IPv6, até 45 caracteres) e data/hora padrão do momento da inserção.
```sql
CREATE TABLE log_acesso (
    id_log_acesso BIGINT AUTO_INCREMENT PRIMARY KEY,
    ip_usuario_log_acesso VARCHAR(45) NOT NULL,
    data_hora_log_acesso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
> **Correção vs original:** Adicionada `PRIMARY KEY` (`BIGINT AUTO_INCREMENT`) e `NOT NULL` em IP e data/hora (`VARCHAR(45)` já estava correto para suportar IPv6 mapeado).

### Exercício 4 — Tabela `produto_catalogo`
**Enunciado:** Crie a tabela `produto_catalogo` com código inteiro (PK), descrição longa (`TEXT`) e indicador booleano `ativo` com padrão verdadeiro.
```sql
CREATE TABLE produto_catalogo (
    codigo INT PRIMARY KEY,
    descricao TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);
```
> **Correção vs original:** Adicionada `PRIMARY KEY` em `codigo` e `NOT NULL` em `descricao`/`ativo`. No MySQL, `BOOLEAN` é alias de `TINYINT(1)` (`1` = `TRUE`, `0` = `FALSE`).

### Exercício 5 — Tabela `pais`
**Enunciado:** Crie a tabela `pais` usando a sigla ISO de 2 letras fixas como PK natural e o nome do país obrigatório e único.
```sql
CREATE TABLE pais (
    sigla CHAR(2) PRIMARY KEY,
    nome_pais VARCHAR(50) NOT NULL,
    CONSTRAINT uq_pais_nome UNIQUE (nome_pais)
);
```
> **Correção vs original:** Adicionada `PRIMARY KEY` na chave natural `sigla` (`CHAR(2)` para comprimento fixo) e `UNIQUE` em `nome_pais`.

### Exercício 6 — Tabela `evento`
**Enunciado:** Crie a tabela `evento` com ID (PK), nome obrigatório (100 caracteres), `data_inicio` obrigatória e `data_fim` opcional que não pode ser anterior ao início.
```sql
CREATE TABLE evento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NULL,
    CONSTRAINT ck_evento_datas CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);
```
> **Correção vs original:** Adicionada `PRIMARY KEY`, `NOT NULL` em `nome` e `data_inicio`, e `CHECK` de coerência entre datas.

### Exercício 7 — Tabela `avaliacao`
**Enunciado:** Crie a tabela `avaliacao` com ID (PK), nota exata de `0.00` a `10.00` e comentário opcional de até 255 caracteres.
```sql
CREATE TABLE avaliacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nota DECIMAL(4,2) NOT NULL,
    comentario VARCHAR(255),
    CONSTRAINT ck_avaliacao_nota CHECK (nota >= 0.00 AND nota <= 10.00)
);
```
> **Correção crítica vs original:** O original usava `nota FLOAT`. `FLOAT` usa ponto flutuante binário IEEE 754 e sofre erros de arredondamento/comparação exata (`7.10` pode virar `7.0999999`). Notas e valores exatos exigem **`DECIMAL(4,2)`**.

### Exercício 8 — Tabela `parametro_sistema`
**Enunciado:** Crie a tabela `parametro_sistema` com chave de configuração (até 30 caracteres, PK) e valor (até 200 caracteres).
```sql
CREATE TABLE parametro_sistema (
    chave VARCHAR(30) PRIMARY KEY,
    valor VARCHAR(200)
);
```
> **Correção vs original:** Adicionada `PRIMARY KEY` em `chave`.

### Exercício 9 — Tabela `endereco_entrega`
**Enunciado:** Crie a tabela `endereco_entrega` com ID (PK), logradouro obrigatório, número opcional e CEP de exatamente 8 dígitos numéricos.
```sql
CREATE TABLE endereco_entrega (
    id INT AUTO_INCREMENT PRIMARY KEY,
    logradouro VARCHAR(100) NOT NULL,
    numero VARCHAR(10),
    cep CHAR(8) NOT NULL,
    CONSTRAINT ck_endereco_cep CHECK (cep REGEXP '^[0-9]{8}$')
);
```
> **Correção vs original:** Adicionada `PRIMARY KEY`, `NOT NULL` em `cep` e validação de 8 dígitos numéricos (`CHAR(8)` preserva zeros à esquerda).

### Exercício 10 — Tabela `historico_preco`
**Enunciado:** Crie a tabela `historico_preco` registrando alterações de preço de produtos com chave primária composta por produto e instante da alteração, preço anterior não negativo e tipo temporal sem limite do ano 2038.
```sql
CREATE TABLE historico_preco (
    id_produto INT NOT NULL,
    data_alteracao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    preco_anterior DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_historico_preco PRIMARY KEY (id_produto, data_alteracao),
    CONSTRAINT ck_historico_preco_valor CHECK (preco_anterior >= 0)
);
```
> **Correção vs original:** Adicionada PK composta `(id_produto, data_alteracao)`, `NOT NULL` e `CHECK (>= 0)`. Trocado `TIMESTAMP` (limite `2038-01-19`) por `DATETIME` (até `9999-12-31`, sem conversão implícita de fuso).

### Exercício 11 — Tabela `usuario_temp`
**Enunciado:** Crie a tabela `usuario_temp` com ID (PK), nome obrigatório e contador de tentativas de login iniciado em `0` (não negativo).
```sql
CREATE TABLE usuario_temp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    tentativas_login INT NOT NULL DEFAULT 0,
    CONSTRAINT ck_usuario_tentativas CHECK (tentativas_login >= 0)
);
```
> **Correção vs original:** Adicionada `PRIMARY KEY`, `NOT NULL` em `nome` e `CHECK (tentativas_login >= 0)`.

### Exercício 12 — Tabela `anexo_documento`
**Enunciado:** Crie a tabela `anexo_documento` com ID (PK), nome do arquivo obrigatório e suporte binário para arquivos de até 16 MB (`MEDIUMBLOB`).
```sql
CREATE TABLE anexo_documento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_arquivo VARCHAR(120) NOT NULL,
    conteudo_binario MEDIUMBLOB
);
```
> **Correção vs original:** O original usava `BLOB`, que suporta apenas **64 KB** (65.535 bytes) — insuficiente até para um PDF pequeno. `MEDIUMBLOB` comporta até 16 MB (`LONGBLOB` até 4 GB). *Boa prática em produção:* gravar o arquivo em Object Storage (S3/disco) e salvar apenas o caminho/URL (`VARCHAR`) no banco.

### Exercício 13 — Tabela `sensor_leitura`
**Enunciado:** Crie a tabela `sensor_leitura` para registrar séries temporais de temperatura e umidade (`0` a `100%`) por sensor e instante da leitura.
```sql
CREATE TABLE sensor_leitura (
    id_sensor INT NOT NULL,
    data_hora_leitura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    temperatura DECIMAL(5,2) NOT NULL,
    umidade DECIMAL(5,2) NOT NULL,
    CONSTRAINT pk_sensor_leitura PRIMARY KEY (id_sensor, data_hora_leitura),
    CONSTRAINT ck_sensor_umidade CHECK (umidade BETWEEN 0.00 AND 100.00)
);
```
> **Correção vs original:** Adicionada coluna temporal `data_hora_leitura` para viabilizar a PK composta de série temporal `(id_sensor, data_hora_leitura)` e `CHECK (umidade BETWEEN 0.00 AND 100.00)`.

### Exercício 14 — Tabela `cupom_desconto`
**Enunciado:** Crie a tabela `cupom_desconto` com código (PK) e percentual de desconto entre `0.01%` e `100.00%`.
```sql
CREATE TABLE cupom_desconto (
    codigo VARCHAR(20) PRIMARY KEY,
    percentual DECIMAL(5,2) NOT NULL,
    CONSTRAINT ck_cupom_percentual CHECK (percentual > 0.00 AND percentual <= 100.00)
);
```
> **Correção crítica vs original:** O original usava `percentual DECIMAL(4,2)`, cujo valor máximo é `99.99` — **impossibilitando cupom de `100.00%`**. Com **`DECIMAL(5,2)`** (5 dígitos totais, 2 decimais), `100.00` passa a ser válido.

### Exercício 15 — Tabela `notificacao` (correção de `notificao`)
**Enunciado:** Crie a tabela `notificacao` com ID (PK), mensagem obrigatória, indicador `lida` padrão `FALSE` e timestamp de criação `criado_em`.
```sql
CREATE TABLE notificacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mensagem VARCHAR(200) NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
> **Correção vs original:** Corrigido o typo no nome da tabela (`notificao` → **`notificacao`**) e adicionada `PRIMARY KEY`.

### Exercício 16 — Tabela `turma_escolar`
**Enunciado:** Crie a tabela `turma_escolar` usando chave primária composta natural formada por `ano_letivo`, `serie` e `letra_sala`.
```sql
CREATE TABLE turma_escolar (
    ano_letivo SMALLINT UNSIGNED NOT NULL,
    serie VARCHAR(10) NOT NULL,
    letra_sala CHAR(1) NOT NULL,
    CONSTRAINT pk_turma_escolar PRIMARY KEY (ano_letivo, serie, letra_sala),
    CONSTRAINT ck_turma_ano CHECK (ano_letivo >= 2000)
);
```
> **Correção vs original:** Adicionada PK composta e `NOT NULL` em todas as colunas da chave.

### Exercício 17 — Tabela `transacao_cartao`
**Enunciado:** Crie a tabela `transacao_cartao` com ID `BIGINT` (PK), NSU obrigatório único e valor líquido positivo.
```sql
CREATE TABLE transacao_cartao (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nsu VARCHAR(30) NOT NULL,
    valor_liquido DECIMAL(12,2) NOT NULL,
    CONSTRAINT uq_transacao_nsu UNIQUE (nsu),
    CONSTRAINT ck_transacao_valor CHECK (valor_liquido > 0)
);
```
> **Correção vs original:** Adicionada `PRIMARY KEY`, `NOT NULL`, `UNIQUE (nsu)` e `CHECK (valor_liquido > 0)`.

### Exercício 18 — Tabela `cliente_pf`
**Enunciado:** Crie a tabela `cliente_pf` com ID (PK), nome completo, CPF único de 11 dígitos e data de nascimento obrigatórios.
```sql
CREATE TABLE cliente_pf (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(100) NOT NULL,
    cpf CHAR(11) NOT NULL,
    data_nascimento DATE NOT NULL,
    CONSTRAINT uq_cliente_pf_cpf UNIQUE (cpf)
);
```
> **Correção vs original:** Adicionada `PRIMARY KEY` e atributo identificador `cpf CHAR(11) UNIQUE`.

### Exercício 19 — Tabela `configuracao_email`
**Enunciado:** Crie a tabela `configuracao_email` com ID (PK), servidor SMTP obrigatório e porta TCP válida (de `1` a `65535`, padrão `587`).
```sql
CREATE TABLE configuracao_email (
    id INT AUTO_INCREMENT PRIMARY KEY,
    servidor_smtp VARCHAR(80) NOT NULL,
    porta SMALLINT UNSIGNED NOT NULL DEFAULT 587,
    CONSTRAINT ck_config_email_porta CHECK (porta BETWEEN 1 AND 65535)
);
```
> **Correção crítica vs original:** O original usava `porta SMALLINT`, cujo máximo com sinal é **`32767`**. Como portas TCP vão até `65535`, é obrigatório usar **`SMALLINT UNSIGNED`** (faixa `0` a `65535`) e `PRIMARY KEY`.

### Exercício 20 — Tabela `reserva_hotel`
**Enunciado:** Crie a tabela `reserva_hotel` com número da reserva (PK), datas obrigatórias de check-in e check-out (`checkout > checkin`) e quantidade de hóspedes mínima `1`.
```sql
CREATE TABLE reserva_hotel (
    num_reserva INT AUTO_INCREMENT PRIMARY KEY,
    checkin DATE NOT NULL,
    checkout DATE NOT NULL,
    num_hospedes INT NOT NULL DEFAULT 1,
    CONSTRAINT ck_reserva_datas CHECK (checkout > checkin),
    CONSTRAINT ck_reserva_hospedes CHECK (num_hospedes >= 1)
);
```
> **Correção vs original:** Adicionada `PRIMARY KEY`, coluna `checkout` e `CHECK`s de datas e hóspedes.

---

## Bloco 2 — Chaves Primárias Simples, Compostas e Naturais (Questões 21 a 35)

> Demonstra as **3 formas de declarar `PRIMARY KEY`** (inline, nível de tabela com `CONSTRAINT` e pós-criação via `ALTER TABLE`), além de PKs naturais e compostas.

### Exercício 21 — `categoria` (Modo 1: PK Inline)
**Enunciado:** Crie `categoria` declarando a PK inline com `AUTO_INCREMENT` e nome obrigatório único.
```sql
CREATE TABLE categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(40) NOT NULL,
    CONSTRAINT uq_categoria_nome UNIQUE (nome)
);
```

### Exercício 22 — `marca` (Modo 2: `CONSTRAINT` no `CREATE TABLE`)
**Enunciado:** Crie `marca` declarando a PK nomeada (`pk_marca`) ao final do `CREATE TABLE`.
```sql
CREATE TABLE marca (
    id_marca INT AUTO_INCREMENT,
    descricao VARCHAR(50) NOT NULL,
    CONSTRAINT pk_marca PRIMARY KEY (id_marca)
);
```

### Exercício 23 — `fornecedor` (Modo 3: `ALTER TABLE ADD CONSTRAINT`)
**Enunciado:** Crie `fornecedor` primeiro sem PK e adicione `pk_fornecedor` via `ALTER TABLE`.
```sql
CREATE TABLE fornecedor (
    id_fornecedor INT NOT NULL,
    razao_social VARCHAR(100) NOT NULL
);

ALTER TABLE fornecedor
    ADD CONSTRAINT pk_fornecedor PRIMARY KEY (id_fornecedor);
```

### Exercício 24 — `aluno_disciplina` (PK Composta em Tabela Associativa)
**Enunciado:** Crie a tabela associativa `aluno_disciplina` com chave primária composta `(ra, cod_disciplina)`.
```sql
CREATE TABLE aluno_disciplina (
    ra INT NOT NULL,
    cod_disciplina INT NOT NULL,
    CONSTRAINT pk_aluno_disc PRIMARY KEY (ra, cod_disciplina)
);
```
> **Observação:** As FKs de `aluno_disciplina` serão adicionadas no [Exercício 57](#exercício-57--fks-na-tabela-associativa).

### Exercício 25 — `item_pedido` (PK Composta com Item Sequencial)
**Enunciado:** Crie `item_pedido` com PK composta `(id_pedido, num_item)`, quantidade positiva e preço unitário positivo.
```sql
CREATE TABLE item_pedido (
    id_pedido INT NOT NULL,
    num_item INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_id_pedido_num_item PRIMARY KEY (id_pedido, num_item),
    CONSTRAINT ck_item_pedido_qtd CHECK (quantidade > 0),
    CONSTRAINT ck_item_pedido_preco CHECK (preco_unitario > 0)
);
```

### Exercício 26 — `usuario_rede` (Revisão de Identificador UUID)
**Enunciado:** Crie `usuario_rede` corrigindo o nome da coluna PK (`UUID` → `id_usuario`) e garantindo unicidade em `login`.
```sql
CREATE TABLE usuario_rede (
    id_usuario CHAR(36) PRIMARY KEY,
    login VARCHAR(30) NOT NULL,
    CONSTRAINT uq_usuario_rede_login UNIQUE (login)
);
```
> **Correção vs original (`exc`):** O rascunho nomeava a coluna como `UUID` (mesmo nome da função nativa `UUID()` do MySQL — má prática). Renomeado para `id_usuario CHAR(36)` e adicionado `UNIQUE (login)`. Em sistemas de alta escrita no MySQL 8.x, prefira `BINARY(16)` com `UUID_TO_BIN(UUID(), 1)` para reduzir fragmentação da B-Tree.

### Exercício 27 — `unidade_federativa` (PK Natural `CHAR(2)`)
**Enunciado:** Crie `unidade_federativa` utilizando a sigla `uf` de 2 caracteres como chave primária natural.
```sql
CREATE TABLE unidade_federativa (
    uf CHAR(2) PRIMARY KEY,
    nome_estado VARCHAR(30) NOT NULL,
    CONSTRAINT uq_uf_nome UNIQUE (nome_estado)
);
```

### Exercício 28 — `medico` (PK Composta Natural + FK de UF)
**Enunciado:** Crie `medico` com PK composta `(crm, uf_crm)` e nome obrigatório.
```sql
CREATE TABLE medico (
    crm INT NOT NULL,
    uf_crm CHAR(2) NOT NULL,
    nome VARCHAR(80) NOT NULL,
    CONSTRAINT pk_crm_uf PRIMARY KEY (crm, uf_crm),
    CONSTRAINT fk_medico_uf FOREIGN KEY (uf_crm) REFERENCES unidade_federativa(uf)
);
```

### Exercício 29 — `permissao`
**Enunciado:** Crie `permissao` com `id_permissao` autoincremental (PK) e `nome_chave` obrigatório e único.
```sql
CREATE TABLE permissao (
    id_permissao INT AUTO_INCREMENT PRIMARY KEY,
    nome_chave VARCHAR(40) NOT NULL,
    CONSTRAINT uq_permissao_chave UNIQUE (nome_chave)
);
```

### Exercício 30 — `prontuario`
**Enunciado:** Crie `prontuario` com `numero_prontuario` autoincremental (PK) e `data_criacao` obrigatória.
```sql
CREATE TABLE prontuario (
    numero_prontuario INT AUTO_INCREMENT PRIMARY KEY,
    data_criacao DATE NOT NULL
);
```

### Exercício 31 — `grade_horario` (PK Composta Tripla + Validação de Dia)
**Enunciado:** Crie `grade_horario` com PK composta por `(id_turma, dia_semana, hora_inicio)`, garantindo `dia_semana` entre `1` (domingo) e `7` (sábado).
```sql
CREATE TABLE grade_horario (
    id_turma INT NOT NULL,
    dia_semana TINYINT UNSIGNED NOT NULL,
    hora_inicio TIME NOT NULL,
    CONSTRAINT pk_grade_turma PRIMARY KEY (id_turma, dia_semana, hora_inicio),
    CONSTRAINT ck_grade_dia_semana CHECK (dia_semana BETWEEN 1 AND 7)
);
```

### Exercício 32 — `tipo_pagamento` (`TINYINT UNSIGNED`)
**Enunciado:** Crie `tipo_pagamento` com `cod_tipo` `TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` e `nome` obrigatório e único.
```sql
CREATE TABLE tipo_pagamento (
    cod_tipo TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL,
    CONSTRAINT uq_tipo_pagamento_nome UNIQUE (nome)
);
```
> **Correção vs original:** `TINYINT UNSIGNED` dobra a faixa positiva de `127` para `255` valores.

### Exercício 33 — `modulo_sistema` (PK Natural `VARCHAR`)
**Enunciado:** Crie `modulo_sistema` com código curto (`VARCHAR(10)`) como PK natural e descrição obrigatória.
```sql
CREATE TABLE modulo_sistema (
    cod_modulo VARCHAR(10) PRIMARY KEY,
    descricao VARCHAR(60) NOT NULL
);
```

### Exercício 34 — `historico_cargo` (PK Composta Temporal)
**Enunciado:** Crie `historico_cargo` com PK tripla `(id_funcionario, id_cargo, data_promocao)` para permitir que o mesmo funcionário ocupe cargos diferentes (ou o mesmo cargo em datas diferentes).
```sql
CREATE TABLE historico_cargo (
    id_funcionario INT NOT NULL,
    id_cargo INT NOT NULL,
    data_promocao DATE NOT NULL,
    CONSTRAINT pk_historico_promocao PRIMARY KEY (id_funcionario, id_cargo, data_promocao)
);
```

### Exercício 35 — `cidade` (PK Natural Externa — Código IBGE)
**Enunciado:** Crie `cidade` usando `ibge_codigo` (7 dígitos) como PK e referenciando `unidade_federativa(uf)`.
```sql
CREATE TABLE cidade (
    ibge_codigo INT PRIMARY KEY,
    nome_cidade VARCHAR(60) NOT NULL,
    uf CHAR(2) NOT NULL,
    CONSTRAINT fk_cidade_uf FOREIGN KEY (uf) REFERENCES unidade_federativa(uf)
);
```

---

## Bloco 3 — Constraints (`UNIQUE`, `CHECK`, `DEFAULT`) e Exclusão (`DELETE`, `TRUNCATE`, `DROP`) (Questões 36 a 50)

### Exercício 36 — `pessoa` (`UNIQUE` nomeada)
**Enunciado:** Crie `pessoa` com `id` (PK), `cpf` obrigatório e único via `CONSTRAINT uq_pessoa_cpf` e `nome` obrigatório.
```sql
CREATE TABLE pessoa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cpf VARCHAR(14) NOT NULL,
    nome VARCHAR(60) NOT NULL,
    CONSTRAINT uq_pessoa_cpf UNIQUE (cpf)
);
```
> **Correção vs original (`Anotações...`):** Adicionado `NOT NULL` em `nome`. A constraint nomeada permite identificar facilmente qual regra foi violada no erro `ERROR 1062: Duplicate entry ... for key 'pessoa.uq_pessoa_cpf'`.

### Exercício 37 — `funcionario` (`CHECK` de salário + armadilha do `NULL`)
**Enunciado:** Crie `funcionario` com `matricula` (PK), `nome` obrigatório e `salario` obrigatório positivo (`> 0`).
```sql
CREATE TABLE funcionario (
    matricula INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    salario DECIMAL(10,2) NOT NULL,
    CONSTRAINT ck_func_salario CHECK (salario > 0)
);
```
> **Armadilha de prova:** No rascunho original, `salario` não tinha `NOT NULL`. Se uma coluna aceitar `NULL`, `CHECK (NULL > 0)` resulta em `UNKNOWN`, e o MySQL **permite inserir `NULL`**! Só exige `> 0` quando há `NOT NULL`. (Suporte real a `CHECK` no MySQL existe desde a versão **8.0.16**).

### Exercício 38 — `redacao` (contextualização de `ck_nota_redacao`)
**Enunciado:** Contextualize a constraint `ck_nota_redacao` (`0.0` a `100.0`) que estava órfã nas anotações originais dentro de uma tabela `redacao`.
```sql
CREATE TABLE redacao (
    id_redacao INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT NOT NULL,
    nota_redacao DECIMAL(5,2) NOT NULL,
    CONSTRAINT ck_nota_redacao CHECK (nota_redacao >= 0.0 AND nota_redacao <= 100.0)
);
```

### Exercício 39 — `conta_bancaria` (`UNIQUE` composta)
**Enunciado:** Crie `conta_bancaria` impedindo duplicidade da combinação `(agencia, numero_conta)`, sem deixar nenhuma das duas colunas nula.
```sql
CREATE TABLE conta_bancaria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agencia VARCHAR(10) NOT NULL,
    numero_conta VARCHAR(15) NOT NULL,
    CONSTRAINT uq_agencia_conta UNIQUE (agencia, numero_conta)
);
```
> **Armadilha de prova:** Sem `NOT NULL`, o MySQL permite inserir múltiplos pares `(NULL, '12345')`, pois em SQL `NULL <> NULL`.

### Exercício 40 — `imovel` (correção do uso de `OR` dentro de `IN`)
**Enunciado:** Crie `imovel` aceitando em `tipo` apenas `'casa'`, `'apartamento'` ou `'comercial'`.
```sql
CREATE TABLE imovel (
    id_imovel INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    CONSTRAINT ck_imovel_tipo CHECK (tipo IN ('casa', 'apartamento', 'comercial'))
);
```
> **Correção crítica vs `Anotações...` L47:** O original colocava o operador `OR` entre as strings dentro do `IN (...)` — o operador `OR` entre strings avalia para `0` (`tipo IN (0)`), quebrando completamente a validação! ✅ Correto: dentro de `IN ('casa', 'apartamento', 'comercial')`, os valores são sempre separados por **vírgula**.

### Exercício 41 — `pesquisa` (correção do `OR` sem repetir a coluna no `CHECK`)
**Enunciado:** Crie `pesquisa` com `nota` inteira entre `1` e `5` e `recomenda` aceitando apenas `'S'` ou `'N'`.
```sql
CREATE TABLE pesquisa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nota TINYINT NOT NULL,
    recomenda CHAR(1) NOT NULL,
    CONSTRAINT ck_pesquisa_nota CHECK (nota BETWEEN 1 AND 5),
    CONSTRAINT ck_pesquisa_recomenda CHECK (recomenda IN ('S', 'N'))
);
```
> **Correção crítica vs `Anotações...` L53:** O original omitia o nome da coluna após o `OR` no `CHECK` (avaliando o segundo literal como booleano `0`) e tinha typo no comentário (`'N)` sem fechar aspa). ✅ Forma equivalente correta com `OR`: `CHECK (recomenda = 'S' OR recomenda = 'N')`.

### Exercício 42 — `livro` (`UNIQUE` + `CHECK` inline)
**Enunciado:** Crie `livro` com `isbn` obrigatório único de 13 caracteres e `paginas` obrigatório maior que zero.
```sql
CREATE TABLE livro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    isbn CHAR(13) NOT NULL UNIQUE,
    paginas INT NOT NULL CHECK (paginas > 0)
);
```

### Exercício 43 — `promocao_campanha` (`CHECK` entre duas colunas)
**Enunciado:** Crie uma tabela `promocao_campanha` com `data_inicio`, `data_fim` e percentual de desconto (`1` a `90`), garantindo `data_fim >= data_inicio` em constraint de tabela.
```sql
CREATE TABLE promocao_campanha (
    id_campanha INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(80) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    desconto_pct DECIMAL(5,2) NOT NULL,
    CONSTRAINT ck_campanha_periodo CHECK (data_fim >= data_inicio),
    CONSTRAINT ck_campanha_desconto CHECK (desconto_pct BETWEEN 1.00 AND 90.00)
);
```
> **Regra de sintaxe:** Um `CHECK` que compara **duas colunas diferentes** (`data_fim >= data_inicio`) deve ser declarado no nível da tabela (ou com `CONSTRAINT` após as colunas), nunca como constraint inline da primeira coluna.

### Exercício 44 — `cupom_validado` (`DEFAULT` + `CHECK`)
**Enunciado:** Crie `cupom_validado` com `ativo BOOLEAN DEFAULT TRUE`, `usos_atuais INT DEFAULT 0` e `max_usos INT DEFAULT 100`, garantindo `usos_atuais <= max_usos`.
```sql
CREATE TABLE cupom_validado (
    codigo VARCHAR(20) PRIMARY KEY,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    usos_atuais INT NOT NULL DEFAULT 0,
    max_usos INT NOT NULL DEFAULT 100,
    CONSTRAINT ck_cupom_usos CHECK (usos_atuais >= 0 AND usos_atuais <= max_usos)
);
```

### Exercício 45 — `usuario_auditoria` (Formato de data `YYYY-MM-DD HH:MM:SS`)
**Enunciado:** Crie `usuario_auditoria` com `criado_em DATETIME DEFAULT CURRENT_TIMESTAMP` e teste inserções com literal no formato correto (`YYYY-MM-DD`).
```sql
CREATE TABLE usuario_auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(40) NOT NULL UNIQUE,
    data_nascimento DATE NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO usuario_auditoria (login, data_nascimento)
VALUES ('ana.silva', '2001-05-19');
```
> **Correção vs `Anotações...` L2:** O formato padrão SQL/MySQL é **`YYYY-MM-DD`** (4 dígitos para ano, nunca apenas 3 dígitos).

### Exercício 46 — `ALTER TABLE`: adicionando e removendo constraints
**Enunciado:** Adicione uma coluna `email VARCHAR(100)` em `pessoa`, crie uma `CONSTRAINT uq_pessoa_email UNIQUE (email)` e depois demonstre como removê-la.
```sql
ALTER TABLE pessoa ADD COLUMN email VARCHAR(100);
ALTER TABLE pessoa ADD CONSTRAINT uq_pessoa_email UNIQUE (email);

-- Para remover a constraint UNIQUE no MySQL usa-se DROP INDEX:
ALTER TABLE pessoa DROP INDEX uq_pessoa_email;
```
> **Pegadinha MySQL:** Para remover `CHECK`, usa-se `ALTER TABLE ... DROP CHECK nome_ck;`. Para remover `UNIQUE`, usa-se `ALTER TABLE ... DROP INDEX nome_uq;` (ou `DROP CONSTRAINT` no MySQL 8.0.19+).

### Exercício 47 — `DELETE` seletivo com proteção transacional (`ROLLBACK`)
**Enunciado:** Insira 3 imóveis na tabela `imovel`, remova apenas os de `tipo = 'apartamento'` dentro de uma transação, confira o resultado e desfaça com `ROLLBACK`.
```sql
INSERT INTO imovel (tipo) VALUES ('casa'), ('apartamento'), ('comercial');

START TRANSACTION;
    DELETE FROM imovel WHERE tipo = 'apartamento';
    SELECT * FROM imovel; -- Apenas casa e comercial
ROLLBACK;

SELECT * FROM imovel; -- Os 3 registros voltaram!
```

### Exercício 48 — `DELETE` vs `TRUNCATE` (Reset de `AUTO_INCREMENT`)
**Enunciado:** Demonstre a diferença no contador `AUTO_INCREMENT` ao limpar uma tabela independente (`pesquisa`) com `DELETE FROM pesquisa` versus `TRUNCATE TABLE pesquisa`.
```sql
INSERT INTO pesquisa (nota, recomenda) VALUES (5, 'S'), (4, 'S');
DELETE FROM pesquisa;
INSERT INTO pesquisa (nota, recomenda) VALUES (3, 'N');
-- Com DELETE, o novo id continua a sequência (id = 3) e a operação aceita ROLLBACK.

TRUNCATE TABLE pesquisa;
INSERT INTO pesquisa (nota, recomenda) VALUES (5, 'S');
-- Com TRUNCATE (DDL), o AUTO_INCREMENT é resetado para 1 e NÃO há ROLLBACK.
```

### Exercício 49 — Armadilha do `TRUNCATE` com `FOREIGN KEY` no InnoDB (`ERROR 1701`)
**Enunciado:** Explique e teste por que `TRUNCATE TABLE unidade_federativa` falha no InnoDB quando existe uma tabela filha (`cidade`) apontando para ela — mesmo que `cidade` esteja vazia.
```sql
-- Supondo que cidade.uf referencia unidade_federativa(uf):
-- TRUNCATE TABLE unidade_federativa;
-- Resultado: ERROR 1701 (42000): Cannot truncate a table referenced in a foreign key constraint
```
> **Lição crítica (ausente em `Anotações...`):** No InnoDB, `TRUNCATE` é uma operação DDL de recriação de tabela e é **sempre bloqueada** (`ERROR 1701`) se existir qualquer FK apontando para a tabela — mesmo com 0 linhas na tabela filha. Para limpar nesse cenário, use `DELETE FROM unidade_federativa` (se não houver filhos) ou apague primeiro as filhas.

### Exercício 50 — `DROP TABLE` com dependências e `DROP TABLE IF EXISTS`
**Enunciado:** Mostre a ordem correta para excluir `unidade_federativa` e `cidade` usando `DROP TABLE IF EXISTS`.
```sql
-- Ordem incorreta: DROP TABLE unidade_federativa; -> ERROR 3730 (Cannot drop table referenced by FK)
-- Ordem correta (filhas antes dos pais):
DROP TABLE IF EXISTS medico;
DROP TABLE IF EXISTS cidade;
DROP TABLE IF EXISTS unidade_federativa;
```

---

## Bloco 4 — Integridade Referencial (`FOREIGN KEY`) e Ações em Cascata (Questões 51 a 65)

> Completa integralmente o **Bloco 4 (51 a 65)** iniciado e interrompido em `Anotações de coisas que fui errando.md`.

### Exercício 51 — `projeto` e `tarefa` (Completando o item 51 original — `RESTRICT`)
**Enunciado:** Crie `projeto` e `tarefa` com `FOREIGN KEY` de `tarefa(id_projeto)` para `projeto(id_projeto)`, impedindo exclusão ou alteração de ID em `projeto` enquanto houver tarefas vinculadas.
```sql
CREATE TABLE projeto (
    id_projeto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL
);

CREATE TABLE tarefa (
    id_tarefa INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(100) NOT NULL,
    id_projeto INT NOT NULL,
    CONSTRAINT fk_tarefa_projeto
        FOREIGN KEY (id_projeto) REFERENCES projeto(id_projeto)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);
```
> **Nota:** No MySQL/InnoDB, `RESTRICT` e `NO ACTION` são equivalentes e constituem o comportamento padrão quando `ON DELETE`/`ON UPDATE` são omitidos.

### Exercício 52 — `ON DELETE CASCADE` (`pedido_caderno` → `item_pedido_caderno`)
**Enunciado:** Crie `pedido_caderno` e `item_pedido_caderno` de forma que, ao excluir um pedido, todos os seus itens sejam automaticamente removidos em cascata.
```sql
CREATE TABLE pedido_caderno (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    data_pedido DATE NOT NULL
);

CREATE TABLE item_pedido_caderno (
    id_pedido INT NOT NULL,
    num_item INT NOT NULL,
    produto VARCHAR(60) NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    CONSTRAINT pk_item_pedido_cad PRIMARY KEY (id_pedido, num_item),
    CONSTRAINT fk_item_pedido_cad
        FOREIGN KEY (id_pedido) REFERENCES pedido_caderno(id_pedido)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
```

### Exercício 53 — `ON DELETE SET NULL` (`departamento` → `colaborador`)
**Enunciado:** Crie `colaborador` referenciando `departamento(id_departamento)` de modo que, se um departamento for excluído, os colaboradores vinculados fiquem sem departamento (`NULL`), sem serem apagados.
```sql
CREATE TABLE colaborador (
    id_colaborador INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    id_departamento INT NULL, -- OBRIGATÓRIO aceitar NULL para usar ON DELETE SET NULL!
    CONSTRAINT fk_colab_depto
        FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);
```
> **Pegadinha de prova:** Se `id_departamento` fosse `NOT NULL`, o MySQL rejeitaria a criação da FK com `ERROR 1830: Column 'id_departamento' cannot be NOT NULL: needed in a foreign key constraint SET NULL`!

### Exercício 54 — `ON DELETE RESTRICT` (`categoria` → `produto_loja`)
**Enunciado:** Crie `produto_loja` vinculado a `categoria(id_categoria)` bloqueando a exclusão de qualquer categoria que possua produtos cadastrados.
```sql
CREATE TABLE produto_loja (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(60) NOT NULL,
    preco DECIMAL(10,2) NOT NULL CHECK (preco > 0),
    id_categoria INT NOT NULL,
    CONSTRAINT fk_produto_loja_cat
        FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
```

### Exercício 55 — `ON UPDATE CASCADE` com Chave Natural (`unidade_federativa` → `filial`)
**Enunciado:** Crie `filial` referenciando `unidade_federativa(uf)` com `ON UPDATE CASCADE` e `ON DELETE RESTRICT`. Teste atualizar a sigla `'SP'` para `'S1'` na tabela pai e observe o reflexo na tabela filha.
```sql
CREATE TABLE filial (
    id_filial INT AUTO_INCREMENT PRIMARY KEY,
    nome_filial VARCHAR(60) NOT NULL,
    uf CHAR(2) NOT NULL,
    CONSTRAINT fk_filial_uf
        FOREIGN KEY (uf) REFERENCES unidade_federativa(uf)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
```

### Exercício 56 — `fornecedor` → `compra` (Combinação `RESTRICT` + `CASCADE`)
**Enunciado:** Crie `compra` referenciando `fornecedor(id_fornecedor)` impedindo apagar fornecedor com compras (`ON DELETE RESTRICT`), mas propagando atualização de chave (`ON UPDATE CASCADE`).
```sql
CREATE TABLE compra (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    data_compra DATE NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL CHECK (valor_total > 0),
    id_fornecedor INT NOT NULL,
    CONSTRAINT fk_compra_fornecedor
        FOREIGN KEY (id_fornecedor) REFERENCES fornecedor(id_fornecedor)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
```

### Exercício 57 — FKs na Tabela Associativa
**Enunciado:** Crie as tabelas pai `aluno` e `disciplina` e vincule ambas à tabela associativa `aluno_disciplina` via `ALTER TABLE`, usando `ON DELETE CASCADE`.
```sql
CREATE TABLE aluno (
    ra INT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL
);

CREATE TABLE disciplina (
    cod_disciplina INT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL
);

ALTER TABLE aluno_disciplina
    ADD CONSTRAINT fk_ad_aluno
        FOREIGN KEY (ra) REFERENCES aluno(ra) ON DELETE CASCADE,
    ADD CONSTRAINT fk_ad_disciplina
        FOREIGN KEY (cod_disciplina) REFERENCES disciplina(cod_disciplina) ON DELETE RESTRICT;
```

### Exercício 58 — FKs na Tabela Temporal `historico_cargo`
**Enunciado:** Vincule `historico_cargo` (do Exercício 34) às tabelas `colaborador` (`id_funcionario`) e `cargo` (`id_cargo`).
```sql
ALTER TABLE historico_cargo
    ADD CONSTRAINT fk_hc_colaborador
        FOREIGN KEY (id_funcionario) REFERENCES colaborador(id_colaborador) ON DELETE CASCADE,
    ADD CONSTRAINT fk_hc_cargo
        FOREIGN KEY (id_cargo) REFERENCES cargo(id_cargo) ON DELETE RESTRICT;
```

### Exercício 59 — FKs na Tabela `grade_horario`
**Enunciado:** Crie a tabela `turma` e adicione a chave estrangeira em `grade_horario(id_turma)` apontando para `turma(id_turma)` com `ON DELETE CASCADE`.
```sql
CREATE TABLE turma (
    id_turma INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE
);

ALTER TABLE grade_horario
    ADD CONSTRAINT fk_grade_turma
        FOREIGN KEY (id_turma) REFERENCES turma(id_turma) ON DELETE CASCADE;
```

### Exercício 60 — Auto-Relacionamento / Auto-FK (`hierarquia_categoria`)
**Enunciado:** Crie uma tabela `hierarquia_categoria` onde uma subcategoria aponta para uma categoria pai na **mesma tabela** (`id_pai NULL`). Insira a categoria raiz e duas subcategorias.
```sql
CREATE TABLE hierarquia_categoria (
    id_categoria INT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    id_pai INT NULL,
    CONSTRAINT fk_cat_pai
        FOREIGN KEY (id_pai) REFERENCES hierarquia_categoria(id_categoria)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Ordem topológica de inserção: primeiro o pai (NULL), depois os filhos!
INSERT INTO hierarquia_categoria (id_categoria, nome, id_pai) VALUES
(1, 'Tecnologia', NULL),
(2, 'Periféricos', 1),
(3, 'Mouses', 2);
```

### Exercício 61 — Chave Estrangeira Composta (`1:N` sobre PK Composta)
**Enunciado:** Crie `turma_composta` com PK `(ano_letivo, codigo_turma)` e `diario_classe` referenciando ambas as colunas em uma **única `FOREIGN KEY` composta**.
```sql
CREATE TABLE turma_composta (
    ano_letivo SMALLINT UNSIGNED NOT NULL,
    codigo_turma VARCHAR(10) NOT NULL,
    CONSTRAINT pk_turma_comp PRIMARY KEY (ano_letivo, codigo_turma)
);

CREATE TABLE diario_classe (
    id_diario INT AUTO_INCREMENT PRIMARY KEY,
    ano_letivo SMALLINT UNSIGNED NOT NULL,
    codigo_turma VARCHAR(10) NOT NULL,
    data_aula DATE NOT NULL,
    CONSTRAINT fk_diario_turma
        FOREIGN KEY (ano_letivo, codigo_turma)
        REFERENCES turma_composta(ano_letivo, codigo_turma)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
```

### Exercício 62 — FK Composta Referenciando Tabela Associativa
**Enunciado:** Crie `avaliacao_matricula` que só permite lançar nota para um par `(ra, cod_disciplina)` previamente matriculado em `aluno_disciplina`.
```sql
CREATE TABLE avaliacao_matricula (
    id_avaliacao INT AUTO_INCREMENT PRIMARY KEY,
    ra INT NOT NULL,
    cod_disciplina INT NOT NULL,
    nota DECIMAL(4,2) NOT NULL CHECK (nota BETWEEN 0.00 AND 10.00),
    CONSTRAINT fk_aval_aluno_disc
        FOREIGN KEY (ra, cod_disciplina)
        REFERENCES aluno_disciplina(ra, cod_disciplina)
        ON DELETE CASCADE
);
```

### Exercício 63 — Diagnóstico de Erro de FK #1: Tipos ou Sinais Incompatíveis (`ERROR 3780`)
**Enunciado:** Por que o código abaixo falha no MySQL 8.x, e como corrigi-lo?
```sql
-- ❌ ERRADO: departamento.id_departamento é INT (signed), mas aqui está BIGINT ou INT UNSIGNED:
-- CREATE TABLE setor_errado (
--     id_setor INT PRIMARY KEY,
--     id_departamento INT UNSIGNED NOT NULL,
--     FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento)
-- );
-- Erro: ERROR 3780 (HY000): Referencing column 'id_departamento' and referenced column 'id_departamento' in foreign key constraint are incompatible.

-- ✅ CORRETO: tipo exato + sinal exato (INT com INT):
CREATE TABLE setor_correto (
    id_setor INT PRIMARY KEY,
    id_departamento INT NOT NULL,
    CONSTRAINT fk_setor_depto
        FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento)
);
```

### Exercício 64 — Diagnóstico de Erro de FK #2: Filho Órfão (`ERROR 1452`) e Pai Referenciado (`ERROR 1451`)
**Enunciado:** Identifique os códigos de erro gerados ao tentar (a) inserir um colaborador em um departamento inexistente e (b) excluir um departamento que ainda possui colaboradores com `RESTRICT`.
- **(a) Inserir filho com pai inexistente (`id_departamento = 999`):**
  `ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails`
  *Solução:* Inserir o registro pai em `departamento` primeiro, ou usar `NULL` se a coluna permitir.
- **(b) Excluir pai referenciado com `ON DELETE RESTRICT`:**
  `ERROR 1451 (23000): Cannot delete or update a parent row: a foreign key constraint fails`
  *Solução:* Remover/reatribuir os registros filhos primeiro, ou definir `ON DELETE CASCADE` / `ON DELETE SET NULL` na modelagem.

### Exercício 65 — Diagnóstico de Erro de FK #3: `ON DELETE SET DEFAULT` no InnoDB e `TRUNCATE` em Pai
**Enunciado:** Explique por que `ON DELETE SET DEFAULT` falha no InnoDB e como resolver quando a regra de negócio exige reatribuir registros órfãos a um valor padrão.
- **Limitação do InnoDB:** Embora `SET DEFAULT` exista no padrão SQL ANSI, o engine **InnoDB rejeita** `ON DELETE SET DEFAULT` / `ON UPDATE SET DEFAULT` no MySQL 8.x (`ERROR 1235` / erro de criação da FK).
- **Alternativa prática no MySQL:** Usar `ON DELETE SET NULL` (ou `ON DELETE RESTRICT` + `UPDATE` antes do `DELETE` dentro de uma transação) ou tratar via trigger `BEFORE DELETE` na tabela pai.

---

## Script Executável Completo (MySQL 8.x)

> Script consolidado cobrindo todos os blocos (`caderno_de_exercicio`) em ordem topológica segura para execução integral no MySQL 8.x. (Onde um mesmo nome de tabela aparece em dois blocos didáticos — como `unidade_federativa`, `categoria`, `colaborador`, `turma` — o script cria a versão final evoluída para evitar colisão de nomes.)

```sql
-- ============================================================================
-- CADERNO DE EXERCÍCIOS DDL COMPLETO (BLOCOS 1 A 4 — 65 EXERCÍCIOS)
-- Testado no MySQL 8.4.3 (InnoDB, utf8mb4)
-- ============================================================================

DROP DATABASE IF EXISTS caderno_de_exercicio;
CREATE DATABASE caderno_de_exercicio
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE caderno_de_exercicio;

-- ----------------------------------------------------------------------------
-- BLOCO 1 (Exercícios 1 a 20)
-- ----------------------------------------------------------------------------
CREATE TABLE departamento (
    id_departamento INT AUTO_INCREMENT PRIMARY KEY,
    nome_departamento VARCHAR(50) NOT NULL,
    CONSTRAINT uq_departamento_nome UNIQUE (nome_departamento)
);

CREATE TABLE cargo (
    id_cargo INT AUTO_INCREMENT PRIMARY KEY,
    titulo_cargo VARCHAR(60) NOT NULL,
    salario_base_cargo DECIMAL(10,2) NOT NULL,
    CONSTRAINT ck_cargo_salario CHECK (salario_base_cargo > 0)
);

CREATE TABLE log_acesso (
    id_log_acesso BIGINT AUTO_INCREMENT PRIMARY KEY,
    ip_usuario_log_acesso VARCHAR(45) NOT NULL,
    data_hora_log_acesso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE produto_catalogo (
    codigo INT PRIMARY KEY,
    descricao TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE pais (
    sigla CHAR(2) PRIMARY KEY,
    nome_pais VARCHAR(50) NOT NULL,
    CONSTRAINT uq_pais_nome UNIQUE (nome_pais)
);

CREATE TABLE evento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NULL,
    CONSTRAINT ck_evento_datas CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

CREATE TABLE avaliacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nota DECIMAL(4,2) NOT NULL,
    comentario VARCHAR(255),
    CONSTRAINT ck_avaliacao_nota CHECK (nota >= 0.00 AND nota <= 10.00)
);

CREATE TABLE parametro_sistema (
    chave VARCHAR(30) PRIMARY KEY,
    valor VARCHAR(200)
);

CREATE TABLE endereco_entrega (
    id INT AUTO_INCREMENT PRIMARY KEY,
    logradouro VARCHAR(100) NOT NULL,
    numero VARCHAR(10),
    cep CHAR(8) NOT NULL,
    CONSTRAINT ck_endereco_cep CHECK (cep REGEXP '^[0-9]{8}$')
);

CREATE TABLE historico_preco (
    id_produto INT NOT NULL,
    data_alteracao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    preco_anterior DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_historico_preco PRIMARY KEY (id_produto, data_alteracao),
    CONSTRAINT ck_historico_preco_valor CHECK (preco_anterior >= 0)
);

CREATE TABLE usuario_temp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    tentativas_login INT NOT NULL DEFAULT 0,
    CONSTRAINT ck_usuario_tentativas CHECK (tentativas_login >= 0)
);

CREATE TABLE anexo_documento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_arquivo VARCHAR(120) NOT NULL,
    conteudo_binario MEDIUMBLOB
);

CREATE TABLE sensor_leitura (
    id_sensor INT NOT NULL,
    data_hora_leitura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    temperatura DECIMAL(5,2) NOT NULL,
    umidade DECIMAL(5,2) NOT NULL,
    CONSTRAINT pk_sensor_leitura PRIMARY KEY (id_sensor, data_hora_leitura),
    CONSTRAINT ck_sensor_umidade CHECK (umidade BETWEEN 0.00 AND 100.00)
);

CREATE TABLE cupom_desconto (
    codigo VARCHAR(20) PRIMARY KEY,
    percentual DECIMAL(5,2) NOT NULL,
    CONSTRAINT ck_cupom_percentual CHECK (percentual > 0.00 AND percentual <= 100.00)
);

CREATE TABLE notificacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mensagem VARCHAR(200) NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE turma_escolar (
    ano_letivo SMALLINT UNSIGNED NOT NULL,
    serie VARCHAR(10) NOT NULL,
    letra_sala CHAR(1) NOT NULL,
    CONSTRAINT pk_turma_escolar PRIMARY KEY (ano_letivo, serie, letra_sala),
    CONSTRAINT ck_turma_ano CHECK (ano_letivo >= 2000)
);

CREATE TABLE transacao_cartao (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nsu VARCHAR(30) NOT NULL,
    valor_liquido DECIMAL(12,2) NOT NULL,
    CONSTRAINT uq_transacao_nsu UNIQUE (nsu),
    CONSTRAINT ck_transacao_valor CHECK (valor_liquido > 0)
);

CREATE TABLE cliente_pf (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(100) NOT NULL,
    cpf CHAR(11) NOT NULL,
    data_nascimento DATE NOT NULL,
    CONSTRAINT uq_cliente_pf_cpf UNIQUE (cpf)
);

CREATE TABLE configuracao_email (
    id INT AUTO_INCREMENT PRIMARY KEY,
    servidor_smtp VARCHAR(80) NOT NULL,
    porta SMALLINT UNSIGNED NOT NULL DEFAULT 587,
    CONSTRAINT ck_config_email_porta CHECK (porta BETWEEN 1 AND 65535)
);

CREATE TABLE reserva_hotel (
    num_reserva INT AUTO_INCREMENT PRIMARY KEY,
    checkin DATE NOT NULL,
    checkout DATE NOT NULL,
    num_hospedes INT NOT NULL DEFAULT 1,
    CONSTRAINT ck_reserva_datas CHECK (checkout > checkin),
    CONSTRAINT ck_reserva_hospedes CHECK (num_hospedes >= 1)
);

-- ----------------------------------------------------------------------------
-- BLOCO 2 (Exercícios 21 a 35)
-- ----------------------------------------------------------------------------
CREATE TABLE caderno_de_exercicio.categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(40) NOT NULL,
    CONSTRAINT uq_categoria_nome UNIQUE (nome)
);

CREATE TABLE marca (
    id_marca INT AUTO_INCREMENT,
    descricao VARCHAR(50) NOT NULL,
    CONSTRAINT pk_marca PRIMARY KEY (id_marca)
);

CREATE TABLE fornecedor (
    id_fornecedor INT NOT NULL,
    razao_social VARCHAR(100) NOT NULL
);
ALTER TABLE fornecedor ADD CONSTRAINT pk_fornecedor PRIMARY KEY (id_fornecedor);

CREATE TABLE aluno (
    ra INT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL
);

CREATE TABLE disciplina (
    cod_disciplina INT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL
);

CREATE TABLE aluno_disciplina (
    ra INT NOT NULL,
    cod_disciplina INT NOT NULL,
    CONSTRAINT pk_aluno_disc PRIMARY KEY (ra, cod_disciplina)
);

CREATE TABLE item_pedido (
    id_pedido INT NOT NULL,
    num_item INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_id_pedido_num_item PRIMARY KEY (id_pedido, num_item),
    CONSTRAINT ck_item_pedido_qtd CHECK (quantidade > 0),
    CONSTRAINT ck_item_pedido_preco CHECK (preco_unitario > 0)
);

CREATE TABLE usuario_rede (
    id_usuario CHAR(36) PRIMARY KEY,
    login VARCHAR(30) NOT NULL,
    CONSTRAINT uq_usuario_rede_login UNIQUE (login)
);

CREATE TABLE unidade_federativa (
    uf CHAR(2) PRIMARY KEY,
    nome_estado VARCHAR(30) NOT NULL,
    CONSTRAINT uq_uf_nome UNIQUE (nome_estado)
);

CREATE TABLE medico (
    crm INT NOT NULL,
    uf_crm CHAR(2) NOT NULL,
    nome VARCHAR(80) NOT NULL,
    CONSTRAINT pk_crm_uf PRIMARY KEY (crm, uf_crm),
    CONSTRAINT fk_medico_uf FOREIGN KEY (uf_crm) REFERENCES unidade_federativa(uf)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE permissao (
    id_permissao INT AUTO_INCREMENT PRIMARY KEY,
    nome_chave VARCHAR(40) NOT NULL,
    CONSTRAINT uq_permissao_chave UNIQUE (nome_chave)
);

CREATE TABLE prontuario (
    numero_prontuario INT AUTO_INCREMENT PRIMARY KEY,
    data_criacao DATE NOT NULL
);

CREATE TABLE turma (
    id_turma INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE grade_horario (
    id_turma INT NOT NULL,
    dia_semana TINYINT UNSIGNED NOT NULL,
    hora_inicio TIME NOT NULL,
    CONSTRAINT pk_grade_turma PRIMARY KEY (id_turma, dia_semana, hora_inicio),
    CONSTRAINT ck_grade_dia_semana CHECK (dia_semana BETWEEN 1 AND 7)
);

CREATE TABLE tipo_pagamento (
    cod_tipo TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL,
    CONSTRAINT uq_tipo_pagamento_nome UNIQUE (nome)
);

CREATE TABLE modulo_sistema (
    cod_modulo VARCHAR(10) PRIMARY KEY,
    descricao VARCHAR(60) NOT NULL
);

CREATE TABLE historico_cargo (
    id_funcionario INT NOT NULL,
    id_cargo INT NOT NULL,
    data_promocao DATE NOT NULL,
    CONSTRAINT pk_historico_promocao PRIMARY KEY (id_funcionario, id_cargo, data_promocao)
);

CREATE TABLE cidade (
    ibge_codigo INT PRIMARY KEY,
    nome_cidade VARCHAR(60) NOT NULL,
    uf CHAR(2) NOT NULL,
    CONSTRAINT fk_cidade_uf FOREIGN KEY (uf) REFERENCES unidade_federativa(uf)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ----------------------------------------------------------------------------
-- BLOCO 3 (Exercícios 36 a 50)
-- ----------------------------------------------------------------------------
CREATE TABLE pessoa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cpf VARCHAR(14) NOT NULL,
    nome VARCHAR(60) NOT NULL,
    CONSTRAINT uq_pessoa_cpf UNIQUE (cpf)
);

CREATE TABLE funcionario (
    matricula INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    salario DECIMAL(10,2) NOT NULL,
    CONSTRAINT ck_func_salario CHECK (salario > 0)
);

CREATE TABLE redacao (
    id_redacao INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT NOT NULL,
    nota_redacao DECIMAL(5,2) NOT NULL,
    CONSTRAINT ck_nota_redacao CHECK (nota_redacao >= 0.0 AND nota_redacao <= 100.0)
);

CREATE TABLE conta_bancaria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agencia VARCHAR(10) NOT NULL,
    numero_conta VARCHAR(15) NOT NULL,
    CONSTRAINT uq_agencia_conta UNIQUE (agencia, numero_conta)
);

CREATE TABLE imovel (
    id_imovel INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    CONSTRAINT ck_imovel_tipo CHECK (tipo IN ('casa', 'apartamento', 'comercial'))
);

CREATE TABLE pesquisa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nota TINYINT NOT NULL,
    recomenda CHAR(1) NOT NULL,
    CONSTRAINT ck_pesquisa_nota CHECK (nota BETWEEN 1 AND 5),
    CONSTRAINT ck_pesquisa_recomenda CHECK (recomenda IN ('S', 'N'))
);

CREATE TABLE livro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    isbn CHAR(13) NOT NULL UNIQUE,
    paginas INT NOT NULL CHECK (paginas > 0)
);

CREATE TABLE promocao_campanha (
    id_campanha INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(80) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    desconto_pct DECIMAL(5,2) NOT NULL,
    CONSTRAINT ck_campanha_periodo CHECK (data_fim >= data_inicio),
    CONSTRAINT ck_campanha_desconto CHECK (desconto_pct BETWEEN 1.00 AND 90.00)
);

CREATE TABLE cupom_validado (
    codigo VARCHAR(20) PRIMARY KEY,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    usos_atuais INT NOT NULL DEFAULT 0,
    max_usos INT NOT NULL DEFAULT 100,
    CONSTRAINT ck_cupom_usos CHECK (usos_atuais >= 0 AND usos_atuais <= max_usos)
);

CREATE TABLE usuario_auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(40) NOT NULL UNIQUE,
    data_nascimento DATE NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- BLOCO 4 (Exercícios 51 a 65)
-- ----------------------------------------------------------------------------
CREATE TABLE projeto (
    id_projeto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL
);

CREATE TABLE tarefa (
    id_tarefa INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(100) NOT NULL,
    id_projeto INT NOT NULL,
    CONSTRAINT fk_tarefa_projeto
        FOREIGN KEY (id_projeto) REFERENCES projeto(id_projeto)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE pedido_caderno (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    data_pedido DATE NOT NULL
);

CREATE TABLE item_pedido_caderno (
    id_pedido INT NOT NULL,
    num_item INT NOT NULL,
    produto VARCHAR(60) NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    CONSTRAINT pk_item_pedido_cad PRIMARY KEY (id_pedido, num_item),
    CONSTRAINT fk_item_pedido_cad
        FOREIGN KEY (id_pedido) REFERENCES pedido_caderno(id_pedido)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE colaborador (
    id_colaborador INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    id_departamento INT NULL,
    CONSTRAINT fk_colab_depto
        FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE produto_loja (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(60) NOT NULL,
    preco DECIMAL(10,2) NOT NULL CHECK (preco > 0),
    id_categoria INT NOT NULL,
    CONSTRAINT fk_produto_loja_cat
        FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE filial (
    id_filial INT AUTO_INCREMENT PRIMARY KEY,
    nome_filial VARCHAR(60) NOT NULL,
    uf CHAR(2) NOT NULL,
    CONSTRAINT fk_filial_uf
        FOREIGN KEY (uf) REFERENCES unidade_federativa(uf)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE compra (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    data_compra DATE NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL CHECK (valor_total > 0),
    id_fornecedor INT NOT NULL,
    CONSTRAINT fk_compra_fornecedor
        FOREIGN KEY (id_fornecedor) REFERENCES fornecedor(id_fornecedor)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE aluno_disciplina
    ADD CONSTRAINT fk_ad_aluno
        FOREIGN KEY (ra) REFERENCES aluno(ra) ON DELETE CASCADE,
    ADD CONSTRAINT fk_ad_disciplina
        FOREIGN KEY (cod_disciplina) REFERENCES disciplina(cod_disciplina) ON DELETE RESTRICT;

ALTER TABLE historico_cargo
    ADD CONSTRAINT fk_hc_colaborador
        FOREIGN KEY (id_funcionario) REFERENCES colaborador(id_colaborador) ON DELETE CASCADE,
    ADD CONSTRAINT fk_hc_cargo
        FOREIGN KEY (id_cargo) REFERENCES cargo(id_cargo) ON DELETE RESTRICT;

ALTER TABLE grade_horario
    ADD CONSTRAINT fk_grade_turma
        FOREIGN KEY (id_turma) REFERENCES turma(id_turma) ON DELETE CASCADE;

CREATE TABLE hierarquia_categoria (
    id_categoria INT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    id_pai INT NULL,
    CONSTRAINT fk_cat_pai
        FOREIGN KEY (id_pai) REFERENCES hierarquia_categoria(id_categoria)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE turma_composta (
    ano_letivo SMALLINT UNSIGNED NOT NULL,
    codigo_turma VARCHAR(10) NOT NULL,
    CONSTRAINT pk_turma_comp PRIMARY KEY (ano_letivo, codigo_turma)
);

CREATE TABLE diario_classe (
    id_diario INT AUTO_INCREMENT PRIMARY KEY,
    ano_letivo SMALLINT UNSIGNED NOT NULL,
    codigo_turma VARCHAR(10) NOT NULL,
    data_aula DATE NOT NULL,
    CONSTRAINT fk_diario_turma
        FOREIGN KEY (ano_letivo, codigo_turma)
        REFERENCES turma_composta(ano_letivo, codigo_turma)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE avaliacao_matricula (
    id_avaliacao INT AUTO_INCREMENT PRIMARY KEY,
    ra INT NOT NULL,
    cod_disciplina INT NOT NULL,
    nota DECIMAL(4,2) NOT NULL CHECK (nota BETWEEN 0.00 AND 10.00),
    CONSTRAINT fk_aval_aluno_disc
        FOREIGN KEY (ra, cod_disciplina)
        REFERENCES aluno_disciplina(ra, cod_disciplina)
        ON DELETE CASCADE
);

CREATE TABLE setor_correto (
    id_setor INT PRIMARY KEY,
    id_departamento INT NOT NULL,
    CONSTRAINT fk_setor_depto
        FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento)
);

-- ----------------------------------------------------------------------------
-- TESTES PRÁTICOS DE CARGA, CASCATA E EXCLUSÃO
-- ----------------------------------------------------------------------------
INSERT INTO departamento (nome_departamento) VALUES ('Tecnologia'), ('Financeiro');
INSERT INTO colaborador (nome, id_departamento) VALUES ('Ana', 1), ('Bruno', 2);
DELETE FROM departamento WHERE id_departamento = 2; -- ON DELETE SET NULL -> Bruno fica com id_departamento = NULL

INSERT INTO unidade_federativa (uf, nome_estado) VALUES ('SP', 'São Paulo');
INSERT INTO filial (nome_filial, uf) VALUES ('Matriz Paulista', 'SP');
UPDATE unidade_federativa SET uf = 'S1' WHERE uf = 'SP'; -- ON UPDATE CASCADE -> filial.uf vira 'S1'

INSERT INTO pedido_caderno (data_pedido) VALUES ('2026-09-01');
INSERT INTO item_pedido_caderno VALUES (1, 1, 'Teclado', 2), (1, 2, 'Mouse', 1);
DELETE FROM pedido_caderno WHERE id_pedido = 1; -- ON DELETE CASCADE -> apaga os 2 itens automaticamente

INSERT INTO categoria_hierarquia VALUES (1, 'Tecnologia', NULL), (2, 'Periféricos', 1), (3, 'Mouses', 2);
INSERT INTO imovel (tipo) VALUES ('casa'), ('apartamento'), ('comercial');
INSERT INTO pesquisa (nota, recomenda) VALUES (5, 'S'), (2, 'N');
INSERT INTO cupom_desconto (codigo, percentual) VALUES ('TUDOFREE', 100.00);
INSERT INTO configuracao_email (servidor_smtp, porta) VALUES ('smtp.exemplo.com', 587), ('smtp.alt.com', 46500);
```
