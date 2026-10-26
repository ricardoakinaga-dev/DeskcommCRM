# Identidade CeVet Guarapiranga

Personalização desta instalação, baseada na direção **A — Selo renovado** do
briefing e do design system do Centro Veterinário Guarapiranga consultados no
Gbrain. Os arquivos desta pasta são referências para configurar a marca pela
interface; não alteram automaticamente outras instalações.

## Branch permanente

A branch `custom` é a linha permanente de personalização desta instalação.
Novas customizações devem ser commitadas nela. Atualizações do produto podem
ser incorporadas por merge da `main`, preservando o histórico e os ajustes locais.

## Aplicar pela tela

1. Entre como administrador da instalação e abra **Marca** (`/admin/marca`).
2. Configure o nome **CeVet Guarapiranga**, a cor **#0B6FB3** e a cor do tema
   escuro **#8FB5D9**, conforme `marca.json`, e clique em **Salvar**.
3. Envie `selo-centro-veterinario.jpg` nos campos **Logo** e **Ícone do aplicativo
   e do navegador**. O arquivo original não foi redesenhado nem recolorido.
4. Cole o conteúdo de `tema.css` no editor **CSS personalizado** e clique em
   **Salvar CSS**.
5. Confira login, Inbox e agenda no desktop e no celular, nos dois temas.

A fonte Outfit está incluída no código desta branch, com licença SIL OFL em
`app/fonts/OFL-Outfit.txt`. O modo claro segue o briefing; o modo escuro é uma
adaptação de marinho e azul claro. O vermelho do selo foi preservado; não foi
acrescentada uma ação clínica de emergência ao CRM.

## Executar localmente

Na cópia de trabalho desta branch, instale as dependências com
`pnpm install --frozen-lockfile` e execute `pnpm dev`. Use o modo padrão do projeto
(Turbopack). As credenciais e os dados do banco não fazem parte deste pacote.

## Recuperar ou remover

Se um ajuste de CSS dificultar a leitura, abra `/admin/marca?sem_css=1`. Apague o
campo **Regras CSS** e salve para remover o tema. Nome, cores, logo e ícone podem
ser alterados ou removidos pelos próprios campos da tela Marca.

## Origem dos ativos

Briefing de 18/10/2026 e design system de 19/10/2026, páginas
`briefing-centro-veterinario-guarapiranga` e `design-system-cevet-guarapiranga`
do Gbrain. Selo e fonte foram copiados dos arquivos originais do design system
local da clínica. A marca pertence ao Centro Veterinário Guarapiranga.
