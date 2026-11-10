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


