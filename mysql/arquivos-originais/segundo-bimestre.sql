-- 29092026 aula 01 oracle freesql.com
select * from scott.emp;
select * from scott.dept;

scoot.dept d -- declaracao de 'var' para o nome
scott.emp e

select d.dname as nomeDepartamento,
    count(e.empno) as qtddeFuncionarios
FROM scott.emp e 
    INNER JOIN scott.dept d -- da tabela X inner join tabela Y
    on e.deptno = d.deptno -- nao esquecer de on 
GROUP BY d.dname; -- GROUP BY é primeiro agrupa e depois filtra (Group - Having)
HAVING COUNT (e.empno) > 4; -- filtra qtd de funcionarios > 4


----
-- Subquery é uma consula dentro de uma consulta (usa-se no where from e having)
-- Subquere sempre está entre parenteses
----

SELECT AVG(e.sal) mediaSalarial -- exemplo de má pratica e repeticao
FROM scott.emp e; --aqui continua com select e where salario [...]


--Aqui a forma correta, faz a consulta e traz apenas os que possuem salario > que a média
SELECT e.*
FROM scott.emp e 
WHERE sal >= (SELECT AVG(e.sal) mediasalarial
FROM scott.emp e);



SELECT e.* -- todas as colunas dessa tabela chamada de e
FROM scott.emp e
WHERE e.sal = (select max(e.sal) from scott.emp e);

SELECT e.*
    FROM scott.emp e 
    where e.sal = (select max(e.sal) 
        from scott.emp e) 
    OR e.sal = (select min(e.sal)
        from scott.emp e);

