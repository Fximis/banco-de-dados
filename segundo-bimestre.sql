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
