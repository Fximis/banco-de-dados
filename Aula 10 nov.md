<img width="597" height="281" alt="image" src="https://github.com/user-attachments/assets/a7ef35e6-3f1b-4a8e-9565-9285e0f1cc06" />
#### Links para fazer atividades
> Uma dessas duas fornecem mini cetificado

https://querydrill.dev/practice/#several-accumulators --> site para treinar mongodb
https://learn.mongodb.com/


#### Anatomia de um validador.
Usa-se db.createCollecton com o operador $jsonSchema.

ex:
db.createCollection("nome_da_colecao",{
  valdador:{
    $jsonSchema:{
      bsonType:"objct", -- até aqui, essas 4 coisas sao obrigatorias de se ter. Abaixo, modificado de acordocom a finalidade
      required:["campo1","campo2"],
      properties:{
        //regras para cada campo são colocadas aqui
      }
    }
  }
}]

> Campo **required** identifica o que é obrigatorio ter em um documento
> Campo **properties** significa "se aparecer, é para ter isso". Aceia valores nulos, ou seja
Não é obrigatório colocar a info, mas, se colocar, será validado com o que pode.

[...]
title: "Shipping Country Validation",
properties:{
  country:{
    enum:["France", United Kingdom", "United States"],
    description: "Must be either France, United Kingdom, or United States"}
  }

<img width="596" height="435" alt="image" src="https://github.com/user-attachments/assets/89680b16-ac01-4c91-9d72-7a23aa59233e" />
<img width="593" height="437" alt="image" src="https://github.com/user-attachments/assets/cbc32f7d-ffb8-4e2b-9660-059abd458395" />
<img width="593" height="269" alt="image" src="https://github.com/user-attachments/assets/81a95c26-6cad-4efd-98b5-03fccda7adf0" />
<img width="594" height="298" alt="image" src="https://github.com/user-attachments/assets/7cd4c6ff-e105-446e-99b8-f6974368de0c" />
<img width="597" height="281" alt="image" src="https://github.com/user-attachments/assets/a9e8e0f6-9eae-494b-8613-62d083c33037" />



continuacao pra aula 

´´´
db.createCollection("alunov5",{
  validator:{
    $jsonSchema:{
      bsonType: "object",
      title: "Versão 2 de collection",
      required: ["nome","status"],
      properties:{
        nome:{bsonType:"string",
              $minLenght: 5},
        ra:{bsonType:"int",
          enum:[111,222,333,123123],
        	description: "Deve ser um desses no ra: 111 222 333 123123"
        }
      }
    }
  }
})
´´´
--------
# DIA 11 - QUA
## v1
db.createCollection("alunosv1",{
  validator:{
    $jsonSchema:{
      bsonType:"object",
      required:["nome","email","idade","ativo"],
      }
    }
  }
})

## v2 
db.createCollection("alunos",{
  validator:{
    $jsonSchema:{
      bsonType:"object",
      required:["nome","email","idade","ativo"],
      properties:{
        nome:{bsonType:"String"},
        email:{ bsonType:"String"},
        idade:{bson:"int"},
        ativo:{bsonType:"bool"}
      }
    }
  }
})

> db.alunosv2.insertOne({nome:"Joao", email:"teste@teste.com", idade:14, ativo: true})
-- Essa questão de properties eu nao tinha conseguido fazer ontem com {bsonType} nem min e max (v4)

## v3
db.createCollection("alunosv3",{
  validator:{
    $jsonSchema:{
      bsonType:"object",
      required:["nome","email","idade","ativo"],
      properties:{
        nome:{bsonType:"string"},
        email:{bsonType:"string"},
        idade:{bsonType:"int"},
        ativo:{bsonType:"bool"},
        status:{
        	enum:["ativo","inativo","trancado"]}
      }
    }
  }
})

> db.alunosv3.insertOne({nome:"Lia", email:"lia@teste.com", idade: 20, ativo: true, status:"ativo"})

relacional
 check (status in ('ativo','inativo','trancado'))
MongoDB
  status{
    enum:{"ativo","inativo","trancado"]
  }

## v4

db.createCollection("alunosv4",{
  validator:{
    $jsonSchema:{
      bsonType:"object",
      required:["nome","email","idade","ativo"],
      properties:{
        nome:{bsonType:"string"},
        email:{bsonType:"string"},
        idade:{bsonType:"int", minimum: 18},
        ativo:{bsonType:"bool"},
        status:{
        	enum:["ativo","inativo","trancado"]},
        nota:{bsonType: "double", minimum: 0, maximum: 10}
      }
    }
  }
})

> db.alunosv4.insertOne({nome:"Joao",email:"teste@teste.com", idade:18, ativo: true, nota: 1.10, status: "trancado"})

Relacional
  check(idade>=18)
  check (nota >=0 and nota <=10)
Mongo
  idade: {bsonType: "int", minimum: 18},
  nota: {bsonType: "double", minimum: 0, maximum: 10}

  
