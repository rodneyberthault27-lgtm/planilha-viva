# Planilha Viva

MVP de controle financeiro pessoal com uma caixa inteligente para registrar gastos em linguagem natural.

## Como abrir

Abra `index.html` no navegador ou rode:

```bash
node serve.mjs
```

ou:

```bash
npm start
```

Depois acesse `http://127.0.0.1:4173`.

## O que ja funciona

- Leitura de frases como `20 de uber`, `45 almoco` e `89 farmacia`
- Identificacao automatica de valor, descricao e categoria
- Persistencia no `localStorage`
- Filtro por mes
- Dashboard com total, maior categoria e ultimos gastos
- Categorias, relatorio mensal, exclusao e exportacao CSV

## Proximo passo natural

Trocar o `localStorage` por Firebase ou Supabase mantendo a mesma estrutura de dados:

```json
{
  "id": "uuid",
  "date": "2026-05-28",
  "description": "Uber",
  "category": "Transporte",
  "amount": 20,
  "rawText": "20 de uber"
}
```
