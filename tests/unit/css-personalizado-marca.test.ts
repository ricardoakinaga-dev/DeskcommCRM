import { describe, expect, it } from "vitest";

import {
  CSS_PERSONALIZADO_MAX_BYTES,
  PROPRIEDADES_VISUAIS,
  TOKENS_VISUAIS_DE_COR,
  validarCssPersonalizado,
} from "@/lib/branding/css-personalizado";

describe("CSS personalizado da instalação", () => {
  it("aceita regras cosméticas e as escopa ao documento da instalação", () => {
    const resultado = validarCssPersonalizado(
      ".text-muted-foreground { color: #52645a; }\n.rounded-md:hover { border-radius: 12px; }",
    );

    expect(resultado.erro).toBeNull();
    expect(resultado.regras).toBe(2);
    expect(resultado.declaracoes).toBe(2);
    expect(resultado.css).toContain(":root:root .text-muted-foreground");
    expect(resultado.css).toContain(":root:root .rounded-md:hover");

    const filho = validarCssPersonalizado(".card > .card-title { color: #52645a; }");
    expect(filho.erro).toBeNull();
    expect(filho.css).toContain(":root:root .card > .card-title");
  });

  it("não injeta uma folha quando o campo está vazio", () => {
    expect(validarCssPersonalizado("  \n ")).toEqual({
      css: null,
      erro: null,
      regras: 0,
      declaracoes: 0,
    });
  });

  it("separa as cores dos temas sem deixar o seletor de tema procurar um descendente da raiz", () => {
    const resultado = validarCssPersonalizado(
      ".font-sans { font-family: var(--font-outfit), sans-serif; }\n" +
        '[data-theme="light"] .font-sans { --color-bg: #F5F8FB; --background: #F5F8FB; }\n' +
        '[data-theme="dark"] .font-sans, [data-theme="dark"] .bg-bg { --color-bg: #10283F; }',
    );
    expect(resultado.erro).toBeNull();
    expect(resultado.css).toContain(':root:root[data-theme="light"] .font-sans');
    expect(resultado.css).toContain(
      ':root:root[data-theme="dark"] .font-sans, :root:root[data-theme="dark"] .bg-bg',
    );
    expect(resultado.css).not.toContain(":root:root [data-theme=");
  });

  it.each([
    '[data-theme="system"] .a { color: red; }',
    '[data-theme^="l"] .a { color: red; }',
    '[data-theme="light"][value="segredo"] .a { color: red; }',
    '.a [data-theme="light"] { color: red; }',
    '[data-theme="light"] [type="password"] { color: red; }',
    ".a { --fonte-remota: #123456; }",
    ".a { --color-bg: url(https://example.invalid/segredo); }",
    ".a { --color-bg: var(--imagem); }",
    ".a { --color-bg: red; }",
    ".a { --color-bg: #123; }",
    ".a { --color-bg: #123456 !important; }",
    ".a { --COLOR-BG: #123456; }",
    ".a { --radius: #123456; }",
  ])("recusa atributos e variáveis fora do contrato: %s", (css) => {
    expect(validarCssPersonalizado(css).css).toBeNull();
    expect(validarCssPersonalizado(css).erro).toBeTruthy();
  });

  it("a lista de variáveis revisadas só contém cores conhecidas do tema", () => {
    expect([...TOKENS_VISUAIS_DE_COR].sort()).toEqual(
      [
        "--accent",
        "--accent-foreground",
        "--background",
        "--border",
        "--card",
        "--card-foreground",
        "--color-accent",
        "--color-accent-fg",
        "--color-accent-hover",
        "--color-accent-soft",
        "--color-bg",
        "--color-border",
        "--color-border-strong",
        "--color-neutral-100",
        "--color-neutral-200",
        "--color-neutral-300",
        "--color-neutral-400",
        "--color-neutral-50",
        "--color-neutral-500",
        "--color-neutral-600",
        "--color-neutral-700",
        "--color-neutral-800",
        "--color-neutral-900",
        "--color-neutral-950",
        "--color-surface",
        "--color-surface-elevated",
        "--color-text",
        "--color-text-muted",
        "--color-text-subtle",
        "--foreground",
        "--input",
        "--muted",
        "--muted-foreground",
        "--popover",
        "--popover-foreground",
        "--primary",
        "--primary-foreground",
        "--ring",
        "--secondary",
        "--secondary-foreground",
      ].sort(),
    );
  });

  it.each([
    ["regra de tipo que alcança todo o documento", "body { color: red; }"],
    ["seletor universal", "* { color: red; }"],
    ["atributo que poderia selecionar credenciais", '[type="password"] { color: red; }'],
    ["posição que poderia sobrepor a interface", ".button { position: fixed; }"],
    ["propriedade que oculta controles", ".button { display: none; }"],
    ["diretiva e carregamento remoto", '@import url("https://example.invalid/a.css");'],
    ["URL remota", ".logo { color: url(https://example.invalid/a); }"],
    ["script dentro da tag de estilo", ".x { color: red; }</style><script>alert(1)</script>"],
    ["escape CSS", String.raw`.x\3a hover { color: red; }`],
    ["important que furaria a cascata", ".x { color: red !important; }"],
    ["at-rule aninhada", ".x { @media (min-width: 1px) { color: red; } }"],
    ["comentário", ".x { color: red; /* note */ }"],
    // O PostCSS esconde estes dois em `raws`, e o texto cru saía na folha.
    ["comentário dentro do valor", ".x { color: red /* url(x) */; }"],
    ["comentário dentro do seletor", ".x /* y */ { color: red; }"],
    // Funções que carregam recurso e que a lista de bloqueio antiga deixava passar.
    ["src() sem esquema", '.a { color: src("//evil.example/x"); }'],
    ["src() numa sombra", '.a { box-shadow: 0 0 0 1px src("//evil.example/x"); }'],
    ["paint()", ".a { color: paint(x); }"],
    ["-moz-element()", ".a { color: -moz-element(#x); }"],
    ["image()", '.a { color: image("x"); }'],
    ["cross-fade()", ".a { color: cross-fade(a, b); }"],
    ["element()", ".a { color: element(x); }"],
    ["função com espaço antes do parêntese", '.a { color: src ("//evil"); }'],
  ])("recusa %s por padrão", (_caso, css) => {
    expect(validarCssPersonalizado(css).css).toBeNull();
    expect(validarCssPersonalizado(css).erro).toBeTruthy();
  });

  it("aceita as funções de cor e de cálculo, inclusive aninhadas", () => {
    const resultado = validarCssPersonalizado(
      ".a { color: rgb(1, 2, 3); border-radius: calc(var(--radius) + (2px + 2px)); font-size: clamp(12px, 2vw, 16px); }",
    );
    expect(resultado.erro).toBeNull();
    expect(resultado.declaracoes).toBe(3);
  });

  /**
   * A trava da exfiltração. Quem segura o `url()` não é o filtro de funções, é
   * a lista de propriedades: nenhuma aceita `<image>` ou `<url>`. Este caso
   * reprova QUALQUER ampliação até alguém responder, para a propriedade nova,
   * "ela aceita imagem ou URL?" — e atualizar a lista revisada abaixo.
   */
  it("a lista de propriedades só cresce depois de revista contra <image> e <url>", () => {
    const LISTA_REVISADA = [
      "background-color",
      "border-bottom-color",
      "border-bottom-left-radius",
      "border-bottom-right-radius",
      "border-color",
      "border-left-color",
      "border-radius",
      "border-right-color",
      "border-style",
      "border-top-color",
      "border-top-left-radius",
      "border-top-right-radius",
      "border-width",
      "box-shadow",
      "color",
      "font-family",
      "font-size",
      "font-style",
      "font-weight",
      "letter-spacing",
      "line-height",
      "outline-color",
      "outline-style",
      "outline-width",
      "text-align",
      "text-decoration",
      "text-decoration-color",
      "text-decoration-line",
      "text-decoration-style",
      "text-transform",
      "text-underline-offset",
    ];
    expect([...PROPRIEDADES_VISUAIS].sort()).toEqual(LISTA_REVISADA);

    for (const comImagem of [
      "background",
      "background-image",
      "border-image",
      "border-image-source",
      "list-style",
      "list-style-image",
      "cursor",
      "mask",
      "mask-image",
      "filter",
      "content",
      "clip-path",
      "shape-outside",
      "src",
    ]) {
      expect(PROPRIEDADES_VISUAIS.has(comImagem), comImagem).toBe(false);
    }
  });

  it("recusa seletor vazio, sintaxe inválida e folhas acima de 16 KB", () => {
    expect(validarCssPersonalizado(".x { color: red;").erro).toMatch(/sintaxe inválida/i);
    expect(validarCssPersonalizado(".x { color: red; }\nbody {color: blue}").css).toBeNull();
    expect(
      validarCssPersonalizado(`.x { color: ${"a".repeat(CSS_PERSONALIZADO_MAX_BYTES)}; }`).erro,
    ).toMatch(/16 KB/);
  });
});
