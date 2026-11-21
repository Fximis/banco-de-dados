# Guia Oracle → MySQL 8.x: Auditoria do Script `scott` (`segundo-bimestre.sql`)

> **Preservação (Requisito R1):** O arquivo original [`../arquivos-originais/segundo-bimestre.sql`](../arquivos-originais/segundo-bimestre.sql) foi mantido **100% intacto** (sem qualquer edição), pois contém anotações da aula de Oracle FreeSQL (`29/09/2026`). Este guia documenta todos os erros encontrados linha a linha, apresenta as diferenças entre Oracle e MySQL 8.x e fornece o script completo portado e testado no MySQL 8.4.3.
>
> **Apoio teórico:** Consulte [`../anotacoes/05-agregacao-groupby-e-window-functions.md`](../anotacoes/05-agregacao-groupby-e-window-functions.md) e [`../anotacoes/06-joins-subqueries-e-ctes.md`](../anotacoes/06-joins-subqueries-e-ctes.md).

---

## 1. Auditoria Linha a Linha de `segundo-bimestre.sql`

| Linhas | Trecho Original | Diagnóstico / Erros Encontrados | Correção no MySQL 8.x |
|---|---|---|---|
| **L1** | `-- 29092026 aula 01 oracle freesql.com` | Comentário válido indicando aula no Oracle FreeSQL com o schema clássico `scott`. | Manter como contexto histórico. |
| **L2–3** | `select * from scott.emp;` / `select * from scott.dept;` | No Oracle FreeSQL o schema `scott` já vem pré-instalado. No MySQL, se você não criar o banco `scott` e suas tabelas, gera **`ERROR 1049 / 1146`**. | Executar antes o script de criação do banco `scott` (`dept` + `emp`, Seção 3). |
| **L5** | `scott.dept d -- declaracao de 'var' para o nome` | **3 problemas:** (1) linha **sem `--`** fora de comando SQL (`ERROR 1064`); (2) erro de digitação no nome do schema no original (com dois `o`s em vez de dois `t`s); (3) imprecisão conceitual: `d` não é uma "variável", é um **alias (apelido) de tabela**. | ✅ Correto: comentar como anotação ou usar apenas dentro do `FROM scott.dept d`. |
| **L6** | `scott.emp e` | **Erro de sintaxe:** identificador solto sem `--` fora de qualquer instrução SQL (`ERROR 1064`). | Comentar ou mover para a cláusula `FROM`. |
| **L8–12** | `select d.dname ... FROM scott.emp e INNER JOIN scott.dept d on e.deptno = d.deptno` | Sintaxe válida, mas atenção semântica: `INNER JOIN` exclui o departamento `40 - OPERATIONS` (que possui `0` empregados no dataset clássico). | Mostrar também variação com `LEFT JOIN` a partir de `dept` para exibir `0` funcionários. |
| **L13** | `GROUP BY d.dname; -- GROUP BY é primeiro agrupa...` | **Erro crítico de sintaxe:** o **ponto e vírgula `;`** após `d.dname` encerra a consulta antes da cláusula `HAVING` da linha 14! Além disso, sob `ONLY_FULL_GROUP_BY`, é melhor agrupar por `d.deptno, d.dname` para não colapsar homônimos. | **Remover o `;`** da linha 13 (`GROUP BY d.deptno, d.dname`). |
| **L14** | `HAVING COUNT(e.empno) > 4;` (no original havia espaço antes de `(`) | **2 erros graves:** (1) `HAVING` ficou órfão por causa do `;` na L13 (`ERROR 1064`); (2) **espaço entre o nome da função e `(`**: o Oracle aceita espaço, mas o MySQL 8.x padrão (sem `IGNORE_SPACE` no `sql_mode`) falha com **`ERROR 1630: FUNCTION scott.COUNT does not exist`**! | ✅ Correto: escrever **`HAVING COUNT(e.empno) > 4;`** sem espaço antes do `(`. |
| **L17–20** | `-- Subquery é uma consulta ... (usa-se no where from e having)` | Erros de digitação na palavra "consulta" e em "Subquery" no comentário original. **Lacuna:** subqueries também podem ser usadas no `SELECT` (subquery escalar) e, no **MySQL**, qualquer subquery no `FROM` (tabela derivada) **exige alias obrigatório** (`FROM (...) AS sub`), ao contrário do Oracle. | Atualizar nota didática com `SELECT` e regra de alias no `FROM`. |
| **L22–23** | `SELECT AVG(e.sal) mediaSalarial FROM scott.emp e;` | **Contraexemplo incompleto:** calcula apenas a média (`2073.21`) isolada, interrompendo o fluxo para ilustrar má prática antes de usar subquery. | Documentar como contraexemplo e usar subquery na consulta seguinte. |
| **L26–30** | `SELECT e.* FROM scott.emp e WHERE sal >= (SELECT AVG(e.sal) mediasalarial FROM scott.emp e);` | **3 pontos de atenção:** (1) comentário diz `>` ("maior que a média"), mas o código usa `>=`; (2) **reuso do alias `e` dentro da subquery** — sombreia o `e` externo (causa bugs sutis em subqueries correlacionadas) e `sal` externo está sem prefixo `e.sal`; (3) alias `mediasalarial` dentro de subquery escalar não tem efeito. | Usar alias distinto (`e2`) na subquery, qualificar `e.sal` e alinhar `>` (ou `>=` explicitamente). |
| **L34–36** | `SELECT e.* FROM scott.emp e WHERE e.sal = (select max(e.sal) from scott.emp e);` | Válida, mas repete o **reuso do alias `e`** dentro da subquery. | Trocar para `e2` dentro da subquery. |
| **L38–43** | `SELECT e.* FROM scott.emp e where e.sal = (select max(e.sal) from scott.emp e) OR e.sal = (select min(e.sal) from scott.emp e);` | Válida, porém repete o **reuso de `e`** nas duas subqueries e lê a tabela `emp` 3 vezes. | Usar `e2` e `e3` (e apresentar alternativa moderna MySQL 8.x com CTE `WITH`). |

---

## 2. Oracle SQL vs. MySQL 8.x — Tabela Comparativa para Prova

| Conceito | Oracle (FreeSQL / LiveSQL) | MySQL 8.x |
|---|---|---|
| **Espaço de nomes** | `schema.tabela` (usuário/owner = schema) | `database.tabela` (`SCHEMA` é sinônimo de `DATABASE`) |
| **Espaço antes de `(` em função** | Espaço entre o nome da função e `(col)` funciona | **Erro `1630`** por padrão (`sql_mode` sem `IGNORE_SPACE`). ✅ Correto: nunca deixe espaço: `COUNT(col)` |
| **Operador `\|\|`** | **Concatenação de strings** (`'A' \|\| 'B'`) | Por padrão é **`OR` lógico**! Use **`CONCAT('A', 'B')`** |
| **Tratar `NULL`** | `NVL(a, b)` / `COALESCE(a, b)` | **`IFNULL(a, b)`** / `COALESCE(a, b)` (`NVL` não existe no MySQL) |
| **Data/Hora atual** | `SYSDATE` / `CURRENT_DATE` | **`NOW()`** / **`CURDATE()`** |
| **Formatar data** | `TO_CHAR(data, 'DD/MM/YYYY')` | **`DATE_FORMAT(data, '%d/%m/%Y')`** |
| **Tipos de texto e número** | `VARCHAR2(N)`, `NUMBER(p,s)` | **`VARCHAR(N)`**, **`INT`** / **`DECIMAL(p,s)`** |
| **`FROM DUAL`** | Obrigatório para `SELECT 1+1 FROM DUAL;` | Opcional (`SELECT 1 + 1;` funciona direto) |
| **Limitar linhas** | `ROWNUM <= N` ou `FETCH FIRST N ROWS ONLY` | **`LIMIT N`** |
| **Subquery no `FROM`** | Alias é opcional | **Alias é OBRIGATÓRIO** (`SELECT * FROM (...) AS sub`) |
| **Hierarquia recursiva** | `START WITH ... CONNECT BY PRIOR ...` | **`WITH RECURSIVE ...`** (MySQL 8.0+) |
| **Diferença de conjuntos** | `MINUS` | **`EXCEPT`** (MySQL 8.0.31+) ou `LEFT JOIN ... WHERE ... IS NULL` |

---

## 3. Script Completo Executável `scott` em MySQL 8.x

O script abaixo recria o banco clássico `scott` (**4 departamentos** e **14 empregados** em ordem topológica de hierarquia, respeitando a auto-chave estrangeira `emp.mgr → emp.empno` sem precisar desabilitar `FOREIGN_KEY_CHECKS`) e executa todas as consultas corrigidas.

```sql
-- ============================================================================
-- DATASET CLÁSSICO ORACLE SCOTT PORTADO PARA MYSQL 8.x
-- ============================================================================

DROP DATABASE IF EXISTS scott;
CREATE DATABASE scott
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
USE scott;

CREATE TABLE dept (
    deptno INT NOT NULL,
    dname  VARCHAR(14) NOT NULL,
    loc    VARCHAR(13) NOT NULL,
    CONSTRAINT pk_dept PRIMARY KEY (deptno)
);

CREATE TABLE emp (
    empno    INT NOT NULL,
    ename    VARCHAR(10) NOT NULL,
    job      VARCHAR(9) NOT NULL,
    mgr      INT NULL,
    hiredate DATE NOT NULL,
    sal      DECIMAL(7,2) NOT NULL,
    comm     DECIMAL(7,2) NULL,
    deptno   INT NOT NULL,
    CONSTRAINT pk_emp PRIMARY KEY (empno),
    CONSTRAINT fk_emp_dept FOREIGN KEY (deptno) REFERENCES dept (deptno),
    CONSTRAINT fk_emp_mgr  FOREIGN KEY (mgr)    REFERENCES emp (empno)
);

-- 4 departamentos clássicos
INSERT INTO dept (deptno, dname, loc) VALUES
    (10, 'ACCOUNTING', 'NEW YORK'),
    (20, 'RESEARCH',   'DALLAS'),
    (30, 'SALES',      'CHICAGO'),
    (40, 'OPERATIONS', 'BOSTON');

-- 14 empregados em ordem topológica (Presidente -> Gerentes -> Nível 3 -> Nível 4)
INSERT INTO emp (empno, ename, job, mgr, hiredate, sal, comm, deptno) VALUES
    -- Nível 1: Presidente (sem gerente)
    (7839, 'KING',   'PRESIDENT', NULL, '1981-11-17', 5000.00, NULL,    10),
    -- Nível 2: Gerentes que respondem ao Presidente
    (7566, 'JONES',  'MANAGER',   7839, '1981-04-02', 2975.00, NULL,    20),
    (7698, 'BLAKE',  'MANAGER',   7839, '1981-05-01', 2850.00, NULL,    30),
    (7782, 'CLARK',  'MANAGER',   7839, '1981-06-09', 2450.00, NULL,    10),
    -- Nível 3: Analistas, Vendedores e Escriturários ligados ao Nível 2
    (7788, 'SCOTT',  'ANALYST',   7566, '1987-04-19', 3000.00, NULL,    20),
    (7902, 'FORD',   'ANALYST',   7566, '1981-12-03', 3000.00, NULL,    20),
    (7499, 'ALLEN',  'SALESMAN',  7698, '1981-02-20', 1600.00,  300.00, 30),
    (7521, 'WARD',   'SALESMAN',  7698, '1981-02-22', 1250.00,  500.00, 30),
    (7654, 'MARTIN', 'SALESMAN',  7698, '1981-09-28', 1250.00, 1400.00, 30),
    (7844, 'TURNER', 'SALESMAN',  7698, '1981-09-08', 1500.00,    0.00, 30),
    (7900, 'JAMES',  'CLERK',     7698, '1981-12-03',  950.00, NULL,    30),
    (7934, 'MILLER', 'CLERK',     7782, '1982-01-23', 1300.00, NULL,    10),
    -- Nível 4: Escriturários ligados aos Analistas (Nível 3)
    (7369, 'SMITH',  'CLERK',     7902, '1980-12-17',  800.00, NULL,    20),
    (7876, 'ADAMS',  'CLERK',     7788, '1987-05-23', 1100.00, NULL,    20);
```

---

## 4. Consultas Corrigidas e Explicadas

### Consulta 1 — Departamentos com mais de 4 funcionários (`INNER JOIN` + `GROUP BY` + `HAVING`)

```sql
-- Correção: removido ';' antes do HAVING, removido espaço em COUNT(, agrupamento por PK+nome
SELECT
    d.deptno,
    d.dname AS nomeDepartamento,
    COUNT(e.empno) AS qtddeFuncionarios
FROM scott.emp e
INNER JOIN scott.dept d
    ON e.deptno = d.deptno
GROUP BY d.deptno, d.dname
HAVING COUNT(e.empno) > 4;
```
> **Resultado esperado:** `RESEARCH` (`5` funcionários) e `SALES` (`6` funcionários).

**Variação didática com `LEFT JOIN` (para incluir departamentos sem funcionários):**
```sql
SELECT
    d.deptno,
    d.dname AS nomeDepartamento,
    COUNT(e.empno) AS qtddeFuncionarios
FROM scott.dept d
LEFT JOIN scott.emp e
    ON e.deptno = d.deptno
GROUP BY d.deptno, d.dname
ORDER BY d.deptno;
```
> *Aqui aparece `40 | OPERATIONS | 0` (note que `COUNT(e.empno)` conta `0` para linhas sem correspondência porque `COUNT(coluna)` ignora `NULL`, enquanto `COUNT(*)` contaria `1`!).*

### Consulta 2 — Empregados com salário acima da média (`AVG = 2073.21`)

```sql
-- Correção: alias distinto e2 na subquery e qualificação explícita e.sal > (...)
SELECT e.*
FROM scott.emp e
WHERE e.sal > (
    SELECT AVG(e2.sal)
    FROM scott.emp e2
)
ORDER BY e.sal DESC;
```
> **Resultado esperado (6 empregados, média `2073.21`):** `KING` (`5000.00`), `SCOTT` (`3000.00`), `FORD` (`3000.00`), `JONES` (`2975.00`), `BLAKE` (`2850.00`) e `CLARK` (`2450.00`).

### Consulta 3 — Empregado(s) com o maior salário (`MAX`)

```sql
SELECT e.*
FROM scott.emp e
WHERE e.sal = (
    SELECT MAX(e2.sal)
    FROM scott.emp e2
);
```
> **Resultado esperado:** `KING` (`5000.00`).

### Consulta 4 — Empregados com o maior OU o menor salário (`MAX` / `MIN`)

```sql
-- Forma corrigida com aliases independentes (e2 e e3)
SELECT e.*
FROM scott.emp e
WHERE e.sal = (SELECT MAX(e2.sal) FROM scott.emp e2)
   OR e.sal = (SELECT MIN(e3.sal) FROM scott.emp e3)
ORDER BY e.sal DESC;
```
> **Resultado esperado:** `KING` (`5000.00`) e `SMITH` (`800.00`).

**Alternativa moderna MySQL 8.x (CTE em 1 leitura de agregação):**
```sql
WITH extremos AS (
    SELECT MAX(sal) AS maior_sal, MIN(sal) AS menor_sal
    FROM scott.emp
)
SELECT e.*
FROM scott.emp e
INNER JOIN extremos x
    ON e.sal = x.maior_sal OR e.sal = x.menor_sal
ORDER BY e.sal DESC;
```
