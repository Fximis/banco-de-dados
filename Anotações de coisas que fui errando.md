para mostrar como registro data e hora --> timestamp default current_timestamp;
datetime e date é formato aaa-mm-dd.

datetime usa para algo data e hora

date usa para data que nao depende de horario.

CREATE TABLE pessoa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cpf VARCHAR(14) NOT NULL,
    nome VARCHAR(60),
    
    -- Definição da constraint de unicidade com o nome solicitado
    CONSTRAINT uq_pessoa_cpf UNIQUE (cpf)
);

> CONSTRAINT uq_pessoa_cpf UNIQUE (cpf): Cria a regra de unicidade. Se alguém tentar cadastrar um CPF que já existe na tabela, o MySQL vai barrar a inserção e retornar um erro identificando essa constraint específica.


CREATE TABLE funcionario (
    matricula INT AUTO_INCREMENT PRIMARY KEY,
    salario DECIMAL(10,2),
    
    -- Definição da constraint CHECK para validar o salário
    CONSTRAINT ck_func_salario CHECK (salario > 0)
);

  CONSTRAINT ck_nota_redacao check (nota_redacao >= 0.0 and nota_redacao <= 100.0)



CREATE TABLE conta_bancaria(
	id int auto_increment PRIMARY KEY,
    agencia varchar(10),
    numero_conta varchar(15),
    
   CONSTRAINT uq_agencia_conta unique (agencia,numero_conta)
);

   >Constraint de unicidade composta uq_agencia_conta para as duas colunas juntas.


CREATE TABLE imovel(
	id_imovel int auto_increment primary key,
    tipo varchar(50),
    
  CONSTRAINT ck_imovel_tipo check (tipo IN ( 'casa' or 'apartamento' or 'comercial')) -- Lembrar que quando é string, usa o IN ao inves de ' = '
);

CREATE TABLE pesquisa(
	id int auto_increment primary key,
  nota tinyint NOT NULL CHECK (nota BETWEEN 1 and 5), -- Declaração inline
  recomenda char NOT NULL check (recomenda = 'S' or 'N') -- CONSTRAINT ck_pesquisa_recomenda check (recomenda in ('S', 'N))
);



CREATE TABLE livro(
	id int auto_increment PRIMARY KEY,
    isbn varchar(13) unique,
    paginas int not null CHECK (paginas >0)
);


#### COMANDOS DE EXCLUSÃO

DELETE (Apaga registros específicos)
   Ele sempre deve ser acompanhado da cláusula WHERE. Se você esquecer o WHERE, ele apagará todos os dados da tabela, linha por linha!

   Exemplo (Apagar apenas um imóvel)
    DELETE FROM imovel WHERE id_imovel = 5;

  Exemplo (Apagar todos os apartamentos)
    DELETE FROM imovel WHERE tipo = 'apartamento';

TRUNCATE (Esvazia a tabela rapidamente)
  utiliza quando quer limpar completamente uma tabela, apagando todos os registros de uma vez só.
  Ele não apaga linha por linha como o DELETE. Ele simplesmente destrói a tabela e recria uma nova idêntica, mas totalmente vazia.

  Reset de contadores: Ele reseta o contador do AUTO_INCREMENT de volta para 1.

  TRUNCATE TABLE imovel;

DROP (Exclui a tabela ou o banco inteiro)
  Você o utiliza quando não quer apenas limpar os dados, mas sim eliminar a existência da tabela ou do banco de dados do sistema.

  Exemplo (Apagar uma tabela)
    DROP TABLE imovel;

  Exemplo (Apagar um banco de dados inteiro)
    DROP DATABASE meu_banco_de_estudos;


## QUA
Bloco 4: Integridade Referencial (FOREIGN KEY) e Ações em 
Cascata (51 a 65) -- terminar essa lista e começar a fazer exercicios completos.

CREATE TABLE projeto(
	id_projeto  int AUTO_INCREMENT PRIMARY KEY,
	nome varchar(50)	
);
CREATE TABLE tarefa(
	id_tarefa int AUTO_INCREMENT PRIMARY KEY,
    descricao varchar(100),
    id_projeto int,
    
   CONSTRAINT fk_tarefa_projeto FOREIGN KEY (id_projeto) REFERENCES projeto(id_projeto)
);

