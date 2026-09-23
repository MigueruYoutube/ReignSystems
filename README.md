# Reign System's

Site estático (HTML + CSS + JS puro) pronto para GitHub Pages. Todos os dados do usuário ficam salvos apenas no `localStorage` do navegador — não há backend.

## Como publicar no GitHub Pages
1. Crie um repositório novo no GitHub e envie estes arquivos mantendo a estrutura (`index.html`, `style.css`, `js/`).
2. No repositório, vá em **Settings → Pages**.
3. Em "Source", selecione a branch `main` (ou `master`) e a pasta `/ (root)`.
4. Salve — em alguns minutos o site estará disponível em `https://SEU_USUARIO.github.io/NOME_DO_REPO/`.

## Contador de visitantes
O contador de visitantes usa o FiniCounter e é carregado diretamente no site.

## Projeto
GitHub: https://github.com/MigueruYoutube

## Estrutura
```
index.html        estrutura de todas as páginas do SPA
style.css          tema, layout e animações
js/data.js         bancos de nomes, personalidades e passivas
js/core.js         storage, áudio, tema, router, partículas, contador
js/dice.js         página de rolagem de dados
js/sheets.js       criador de ficha de personagem
js/npc.js          criador de NPCs
js/items.js        gerador de itens
js/calculator.js   calculadora
js/combat.js       sistema de combate
js/tracker.js      status de NPCs/Players
js/notes.js        anotações
js/settings.js     configurações
```

© Todos os direitos reservados a Miguel Kayky

GitHub: https://github.com/MigueruYoutube
