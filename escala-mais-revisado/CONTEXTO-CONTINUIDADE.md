# Contexto para continuar o Escala+

## Pedido do usuário

Continuar a partir do HTML já existente, sem recomeçar o projeto e preservando funcionalidades. App de escalas de igreja com HTML/CSS/JavaScript em um único arquivo, Firebase Authentication e Firestore. Prioridade em UI/UX no celular e boa experiência no desktop. Modo claro branco/dourado com textura discreta. Não redesenhar nem alterar a paleta escura; melhorias de usabilidade podem valer nos dois temas.

A última correção explícita do usuário foi: as telas de criação devem seguir as referências, com **funções fixas** e escolha de **membros elegíveis para cada função**, não uma lista de pessoas com campo livre de função. Referências incorporadas à conversa: ministério, seleção de funções, dados da escala, cards por função, Adicionar membro, lista vazia e confirmação Criar sem membros. Menu lateral com aniversariantes e opções existentes. As imagens não vieram como arquivos locais nomeados; reapresentá-las no outro ambiente se precisar de comparação visual precisa.

Administrador é identificado por `AD(g)`. `MG(g,m)` inclui administrador e sublíderes. Gerenciar ministério NÃO concede acesso ao telefone de outras pessoas. Somente administrador e titular podem consultar o contato. O titular edita seu número conforme permissões do app.

## Base anterior

A versão anexada já continha melhorias no modo claro, áreas de toque, desktop, histórico para membros e ocultação de contatos na UI. Telefones continuavam em `igs/{igreja}.mb[].tel`, embora o documento fosse lido por todos os membros. Também existiam `users/{uid}.tel` e `igs/{igreja}/pedidos/{uid}.tel`. Ocultação de UI não era proteção suficiente.

O usuário forneceu as regras durante a conversa: `users` era individual por UID; códigos permitiam get; igreja era lida pelos aprovados; administrador podia alterar tudo e membros podiam atualizar qualquer campo se não mudassem adm nem ids; pedidos tinham criação individual e leitura/remoção pelo titular ou administrador. Logo, além do vazamento de telefone havia escrita ampla nos arrays compartilhados.

## Implementação entregue

- Assistente de quatro etapas: ministério, funções fixas, dados e equipe por função.
- Cards com Adicionar membro e painel de elegíveis, uma pessoa por função, impedindo repetir a mesma pessoa na escala.
- Elegibilidade explícita em Perfil → Funções: `mins[].fn` e `mins[].qual[nomeDaFuncao] = [uids]`.
- Vagas abertas em `escala.roles`, criação sem integrantes confirmada, edição posterior e repetição preservadas.
- Preservação de pessoas e respostas de escalas antigas. Funções vazias/repetidas recebem rótulos distintos ao editar, sem descartar integrantes. Atribuições existentes podem ser mantidas sem habilitação; novas exigem elegibilidade. Troca e substituição também filtram habilitação.
- Alertas de indisponibilidade, conflito e sobrecarga. Troca solicitada registra notificação e não altera automaticamente o integrante.
- Menu lateral e aniversariantes com navegação mensal.
- Teclado, foco nos diálogos, Tab contido, Escape, interface de fundo inerte e retorno de foco; rótulos e mensagens anunciadas.
- Paleta escura original comparada literalmente e preservada. Melhorias claras e de responsividade.

## Schema e autorização propostos

- `igs/{g}`: `schema:2`, ids, adm, ministérios e dados gerais; **sem mb**.
- `igs/{g}/membros/{uid}`: apenas u, n, foto, nasc; leitura para aprovados.
- `igs/{g}/contatos/{uid}`: apenas tel; leitura do documento pelo titular ou administrador; listagem só administrador.
- `igs/{g}/pedidos/{uid}`: somente perfil público; sem tel.
- `users/{uid}`: perfil pessoal privado, incluindo tel; só titular lê/grava. Administrador NÃO recebe acesso a outros users; usa contatos da igreja.
- Consulta de igreja inclui `where('schema','==',2)` e exige índice fornecido. Consulta antiga sem schema é negada pelas regras.
- Criar igreja, entrada, aprovação, recusa, cancelamento, remoção, edição de perfil e foto foram adaptados. Edição de número usa batch para perfil privado e contato da igreja.
- `cfg.ph=false` bloqueia edição do contato da igreja pelo titular no banco e tentativa de apagar/recriar; administrador mantém autorização.
- Novo app usa cache Firestore em memória e tenta limpar IndexedDB antes de abrir listeners. Falha por aba antiga bloqueia o uso e orienta a fechar/recarregar. Não é possível apagar remotamente telefones já recebidos/copiados por clientes antigos.

## Limitação crítica ainda existente

**Não considerar o app completamente protegido no banco.** As regras novas isolam os telefones e congelam adm/ids/configurações para membros, mas ainda permitem escrita ampla em arrays de `mins`, `ind`, `indr`, `nt`, `av`, `po`. Gestão de ministério, respostas de outras pessoas e avisos ainda precisam de documentos separados com autorização granular. Isso não concede acesso aos contatos: a autorização deles usa adm imutável, não os arrays de ministério. A próxima etapa de segurança deve resolver essa limitação, preservando os fluxos existentes.

## Migração preparada, não executada em produção

`migrate.cjs` começa em modo somente simulação. Exige projeto e igreja. Aplicação é explícita; fora do emulador pede URI de backup informado pelo operador, mas não verifica se o export terminou. Uma transação por igreja copia perfis públicos/contatos, remove tel dos pedidos, remove todo mb e marca schema2. Precedência: users.tel privado → mb/pedido → contato existente. Mostra contagens e conflitos, sem imprimir números. Campos desconhecidos, inconsistências, perfis fora do schema e mais de 450 gravações abortam para revisão. Repetição não apaga contatos migrados.

Leia TRANSICAO.md integralmente. Plano: homologação, export/ensaio de restauração, índice pronto, manutenção com substituição das permissões antigas, migração autorizada, conferência de ausência de telefones compartilhados, publicação conjunta de regras e HTML, invalidação de cache/PWA, orientação aos usuários e monitoramento. Um allow false adicionado ao lado das permissões antigas não as revoga. Não restaurar leitura compartilhada antiga como rollback.

## Testes realizados neste ambiente

132 verificações passaram:
- 31 de privacidade/regras no emulador Firestore.
- 7 de migração com dados fictícios no emulador.
- 10 integradas em Chromium com Authentication/Firestore emulados, usando Firebase 10.14.1 (mesma versão do HTML).
- 90 de interface, teclado, contraste dos tokens principais e rolagem nas larguras 360, 390 e 1440, com Firebase simulado.
- Sintaxe JavaScript verificada e declaração da paleta escura idêntica ao original.

Cobertura inclui cadastro/criação de igreja, entrada/aprovação, configuração de elegibilidade, escala por função, presença, recusa, pedido de troca sem transferir integrante, disponibilidade, navegação, histórico, perfil e número privado, contatos permitidos/negados, vagas e edição de atribuições antigas. Ver VALIDACAO.md para limites exatos. Contagens não significam certificação WCAG nem teste de produção.

Não testados em produção: login Google, email real/alteração de email, PWA/push, service worker/cache real com abas antigas, índice real, compartilhamento nativo, impressão, leitor de tela em aparelho físico. Arquivos de manifest/ícone/service worker não foram fornecidos. Fontes externas são bloqueadas nas capturas de teste, usando fallback.

## Arquivos e execução

- escala-mais.html: aplicação revisada, ainda com configuração Firebase original. **Não abrir contra produção sem revisar o plano.**
- firestore.rules, firestore.indexes.json, firebase.json: proposta de regras, índice e emuladores.
- migrate.cjs: ferramenta de migração.
- privacy.test.cjs, migration.test.cjs, browser-ui.test.cjs, integration.test.cjs: suítes.
- package.json/package-lock.json: dependências fixadas.
- TRANSICAO.md: plano completo e limites de autorização.
- VALIDACAO.md: testes e pendências.
- escala-mais-revisado.zip: pacote gerado anteriormente, com código, relatórios e capturas.

Requer Node, Java21 e Chromium. Após npm ci: npm run test:privacy; npm run test:ui; npm run test:integration. Os testes apontam para demo-escala e emuladores; não para o Firebase real. CHROMIUM_PATH pode configurar o binário.

## Próximos passos no outro ambiente

1. Ler este contexto, TRANSICAO.md e VALIDACAO.md; trabalhar a partir do HTML revisado.
2. Reexecutar as suítes e revisar a implementação; o handoff não substitui revisão independente.
3. Resolver a autorização ampla dos arrays legados com schema granular antes de chamar o app inteiramente seguro.
4. Conferir as referências visuais com o usuário e completar telas que ele ainda enviará. Manter paleta escura.
5. Testar cache/PWA e fluxos nativos em homologação/aparelhos reais.
6. Apresentar resultado e plano antes de publicar regras ou fazer migração destrutiva. Não houve autorização para publicar o app ou alterar dados reais nesta etapa.

## Estado da entrega

O ZIP foi criado no workspace remoto e não pôde ser anexado diretamente na conversa. O usuário autorizou salvar os arquivos no repositório público Hashiriky/GPT, em pasta nova, sem sobrescrever conteúdo existente. Essa gravação no GitHub não representa publicação do site, das regras ou execução da migração. Nenhuma credencial privada ou dado real de membros faz parte desta entrega; a configuração Firebase do cliente é a original fornecida pelo usuário.
