# Landing page — Carol Varela, Nutricionista

Site estático em **HTML + CSS + JS puro** (sem framework e sem etapa de build), mobile first, pensado para o GitHub Pages com o domínio `carolvarela.com.br`.

## Estrutura

```
index.html              página única (textos, links do WhatsApp, SEO, JSON-LD)
assets/css/             tokens.css (cores/tipografia) · base.css · components.css · sections.css
assets/js/main.js       header, animações de entrada, botão flutuante
assets/js/reviews.js    carrossel de avaliações do Google (lê data/reviews.json)
assets/fonts/           Black Mango (do Drive da marca) e Poppins, auto-hospedadas
assets/img/             fotos otimizadas (WebP + JPG), logos, favicon, og.jpg
assets/icons/sprite.svg ícones Phosphor (MIT)
data/reviews.json       dados de EXEMPLO (só aparecem em localhost; em produção são substituídos)
scripts/                fetch-reviews.mjs e find-place-id.mjs (Google Places API)
tools/                  scripts de desenvolvimento (gerar imagens, sprite, capturas). Não vão para o ar
.github/workflows/      deploy.yml (publica no GitHub Pages e atualiza as avaliações todo dia)
images/                 fotos originais (.jfif) — fonte para tools/build-assets.mjs; não vão para o ar
```

## Rodar localmente

```bash
python3 -m http.server 8080
# abra http://localhost:8080
```

(Não abra o `index.html` com duplo clique: o sprite de ícones e o JSON de avaliações precisam de HTTP.)

## Editar o conteúdo

| O quê | Onde |
|---|---|
| Textos das seções, FAQ | `index.html` (o FAQ também está em JSON-LD no `<head>`; altere os dois) |
| Mensagem do WhatsApp | `href` dos botões em `index.html` (`text=` codificado). Há 3 mensagens: geral/hero, CMT e dúvidas |
| Cores e fontes | `assets/css/tokens.css` |
| Fotos | substitua em `images/` e rode `tools/build-assets.mjs` (ou coloque os arquivos prontos em `assets/img/`) |

Paleta (manual da marca): navy `#304556` · cinza `#92999F` · oliva `#797C69` · terracota `#B47450` · areia `#C7AA9A` · creme `#F3ECE4`. Textos pequenos em terracota usam `#8A5535` (derivada, para contraste AA).

## Avaliações do Google

O front-end lê `data/reviews.json` e desenha os cartões com a identidade do site. Esse arquivo é **gerado no deploy** pela Google Places API (a chave nunca vai para o navegador).

1. No [Google Cloud Console](https://console.cloud.google.com/): crie um projeto, ative o faturamento (o uso desta página fica dentro da cota gratuita) e habilite **Places API (New)**.
2. Em *APIs e serviços ▸ Credenciais*, crie uma **chave de API** e, em *Restrições de API*, limite-a a **Places API (New)**. Defina também um orçamento/alerta de cobrança.
3. O `PLACE_ID` do perfil já foi descoberto: `ChIJJfEVZWTbmwARExx6Y-jRO8s` (Carol Varela, Barra Olímpica; não é segredo). Para conferir ou refazer: `GOOGLE_PLACES_API_KEY=SUA_CHAVE PLACES_REFERER=https://carolvarela.com.br/ node scripts/find-place-id.mjs "Carol Varela nutricionista Barra Olímpica"`.
4. No GitHub, em *Settings ▸ Secrets and variables ▸ Actions*: crie o **secret** `GOOGLE_PLACES_API_KEY` (a chave) e as **variables** `PLACE_ID` (valor acima) e, se a chave tiver restrição por *referenciador HTTP*, `PLACES_REFERER` = `https://carolvarela.com.br/`. O ideal é uma chave própria para o servidor, restrita apenas à Places API (New), e então `PLACES_REFERER` não é necessário.
5. Rode o workflow *Deploy (GitHub Pages)* (aba Actions ▸ Run workflow). Ele passa a rodar sozinho todo dia.

Sem o secret/variable, a seção mostra apenas o link "Ver avaliações no Google".

Pontos de atenção:
- A API devolve no máximo **5 avaliações** (as "mais relevantes"), além da nota média e do total.
- Os termos do Google Maps Platform restringem armazenamento de conteúdo (cache) e exigem atribuição ao Google. Por isso o JSON é gerado a cada deploy (nunca versionado no repositório) e o selo/link do Google é sempre exibido. Confirme se esse uso atende às suas políticas.
- Alternativa sem API: curar depoimentos manualmente em `data/reviews.json` (mesmo formato, sem `"sample": true`) e manter o link para o Google.

## Deploy no GitHub Pages (gratuito)

O domínio já aponta para o GitHub Pages; **não é preciso mexer no DNS**. O repositório atual é `gui-varela/social-links-carol`.

1. **Clone e crie um branch**
   ```bash
   git clone https://github.com/gui-varela/social-links-carol.git
   cd social-links-carol
   git checkout -b landing-page
   ```
2. **Preserve a página de links atual em `/links`** (ela continua funcionando, só muda o endereço):
   ```bash
   mkdir links
   git mv index.html styles.css assets links/
   ```
   Mantenha o arquivo `CNAME` na raiz. Opcional: no `links/index.html`, aponte o card "Site (em breve)" para `/`.
3. **Copie a landing page** para a raiz do repositório: `index.html`, `404.html`, `robots.txt`, `sitemap.xml`, `CNAME`, `assets/`, `data/`, `scripts/`, `.github/`, `.gitignore` (e, se quiser versionar, `tools/` e `images/`, sem `node_modules`).
4. **Publique**
   ```bash
   git add -A
   git commit -m "Nova landing page"
   git push -u origin landing-page
   ```
   Abra um Pull Request e faça o merge em `main`.
5. **Troque a fonte de publicação**: no GitHub, *Settings ▸ Pages ▸ Build and deployment ▸ Source: **GitHub Actions***. Em *Custom domain* mantenha `carolvarela.com.br` e marque **Enforce HTTPS**.
6. **Primeiro deploy**: aba *Actions ▸ Deploy (GitHub Pages) ▸ Run workflow*. Quando ficar verde, acesse `https://carolvarela.com.br`.
7. **Atualize os links externos**: no Instagram (e onde mais usar a página de links), troque o link da bio para `https://carolvarela.com.br/links`. O endereço raiz agora é a landing page. Inclua também o novo site no perfil da empresa no Google.
8. **Checklist final**: HTTPS ativo, botões de WhatsApp abrindo a conversa com a mensagem, pré-visualização do link (WhatsApp/Instagram) com a imagem `og.jpg`, avaliações carregando (depois de configurar o passo "Avaliações do Google").

Reverter: no GitHub, reverta o commit de merge (*Revert*) em `main`; o workflow publica a versão anterior.

Alternativas gratuitas, caso prefira (não são necessárias): Cloudflare Pages ou Netlify — apontam para o mesmo repositório, sem build.

## Desenvolvimento (opcional)

```bash
cd tools && npm install
node build-sprite.mjs        # regenera assets/icons/sprite.svg
node build-meta-images.mjs   # favicon, apple-touch-icon e og.jpg
```

`build-assets.mjs` converte as fotos de `images/` (e as fontes/logos baixados do Drive da marca) para `assets/`.
