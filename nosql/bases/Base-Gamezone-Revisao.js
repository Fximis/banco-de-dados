// ============================================================
//  COLECAO PARA AULA DE REVISAO - MongoDB - GameZone
//  Como usar: abra o mongosh, rode:  use gamezone_revisao
//  Depois cole este arquivo inteiro e aperte Enter.
//  Ele cria as 3 colecoes e limpa o que ja existia nelas.
// ============================================================
use gamezone_revisao

db.jogos.drop();
db.clientes.drop();
db.vendas.drop();

// ---------- JOGOS ----------
db.jogos.insertMany([
  { _id: 1, titulo: "Dragao Eterno", categoria: "acao", preco: 249, estoque: 5, estoqueMin: 10, nota: 9.8, desenvolvedora: "StarWorks", tags: ["indie", "3D", "multiplayer"] },
  { _id: 2, titulo: "Cidade Neon", categoria: "aventura", preco: 179, estoque: 12, estoqueMin: 5, nota: 9.2, desenvolvedora: "PixelLab", tags: ["3D", "mundo-aberto"] },
  { _id: 3, titulo: "Fazenda Feliz", categoria: "simulacao", preco: 89, estoque: 20, estoqueMin: 5, nota: 8.5, desenvolvedora: "GreenSoft", tags: ["indie", "relax"] },
  { _id: 4, titulo: "Gol de Ouro", categoria: "esporte", preco: 129, estoque: 8, estoqueMin: 5, nota: 8.0, desenvolvedora: "SportMax", tags: ["multiplayer", "esporte"] },
  { _id: 5, titulo: "Quebra-Cabeca Magico", categoria: "puzzle", preco: 59, estoque: 15, estoqueMin: 5, nota: 7.8, desenvolvedora: "MindGames", tags: ["indie", "puzzle"] },
  { _id: 6, titulo: "Corrida Turbo", categoria: "esporte", preco: 149, estoque: 3, estoqueMin: 8, nota: 8.7, desenvolvedora: "SportMax", tags: ["corrida", "multiplayer", "3D"] },
  { _id: 7, titulo: "Ilha Misteriosa", categoria: "aventura", preco: 199, estoque: 7, estoqueMin: 5, nota: 9.0, desenvolvedora: "PixelLab", tags: ["aventura", "3D"] },
  { _id: 8, titulo: "Guerra Espacial", categoria: "acao", preco: 229, estoque: 0, estoqueMin: 5, nota: 9.5, desenvolvedora: "StarWorks", tags: ["acao", "multiplayer"] },
  { _id: 9, titulo: "Jogo Teste", categoria: "teste", preco: 10, estoque: 0, estoqueMin: 0, nota: 5.0, desenvolvedora: "Teste", tags: ["teste"] }
]);

// ---------- CLIENTES ----------
db.clientes.insertMany([
  { _id: 101, nome: "Ana Souza", plano: "basico", ativo: true, endereco: { rua: "Av. Brasil, 100", cidade: "Maringa", uf: "PR" } },
  { _id: 102, nome: "Bruno Lima", plano: "premium", ativo: true, endereco: { rua: "Rua XV, 45", cidade: "Maringa", uf: "PR" } },
  { _id: 103, nome: "Carla Dias", plano: "basico", ativo: true, endereco: { rua: "Rua das Flores, 12", cidade: "Sarandi", uf: "PR" } },
  { _id: 104, nome: "Diego Costa", plano: "basico", ativo: false, endereco: { rua: "Av. Colombo, 900", cidade: "Maringa", uf: "PR" } },
  { _id: 105, nome: "Eva Martins", plano: "premium", ativo: true, endereco: { rua: "Rua Pinguim, 7", cidade: "Londrina", uf: "PR" } },
  { _id: 106, nome: "Cliente Teste", plano: "basico", ativo: true, endereco: { rua: "Rua Teste, 1", cidade: "Maringa", uf: "PR" } }
]);

// ---------- VENDAS ----------
db.vendas.insertMany([
  { _id: 1001, clienteId: 101, jogoId: 1, qtd: 1, valorTotal: 249, data: ISODate("2024-03-02T00:00:00Z"), canal: "loja" },
  { _id: 1002, clienteId: 102, jogoId: 2, qtd: 1, valorTotal: 179, data: ISODate("2024-03-03T00:00:00Z"), canal: "online" },
  { _id: 1003, clienteId: 101, jogoId: 4, qtd: 2, valorTotal: 258, data: ISODate("2024-03-04T00:00:00Z"), canal: "loja" },
  { _id: 1004, clienteId: 103, jogoId: 1, qtd: 1, valorTotal: 249, data: ISODate("2024-03-05T00:00:00Z"), canal: "online" },
  { _id: 1005, clienteId: 105, jogoId: 3, qtd: 1, valorTotal: 89, data: ISODate("2024-03-06T00:00:00Z"), canal: "online" },
  { _id: 1006, clienteId: 102, jogoId: 6, qtd: 1, valorTotal: 149, data: ISODate("2024-03-07T00:00:00Z"), canal: "loja" },
  { _id: 1007, clienteId: 103, jogoId: 7, qtd: 1, valorTotal: 199, data: ISODate("2024-03-08T00:00:00Z"), canal: "loja" },
  { _id: 1008, clienteId: 105, jogoId: 8, qtd: 1, valorTotal: 229, data: ISODate("2024-03-09T00:00:00Z"), canal: "online" }
]);

print("Base gamezone_revisao criada!");
print("jogos: " + db.jogos.countDocuments());
print("clientes: " + db.clientes.countDocuments());
print("vendas: " + db.vendas.countDocuments());
