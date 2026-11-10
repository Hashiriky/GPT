# Escala+ — revisão e transição (10/11/2026)

Esta entrega continua o HTML original. Não houve acesso ao projeto de produção, publicação de regras ou migração de dados reais. O HTML e as regras novas são uma versão conjunta: não substituir somente o HTML em produção.

## Resultado de interface

- Modo claro com superfícies brancas, dourado e textura nos destaques. A declaração original de variáveis do modo escuro permanece idêntica.
- Assistente de quatro etapas: ministério → funções fixas → dados → equipe por função. Cards com Adicionar membro, lista de elegíveis, alertas de indisponibilidade/conflito e vagas abertas.
- Elegibilidade explícita por função em Perfil → Funções. `mins[].fn` contém os nomes fixos e `mins[].qual[nomeDaFuncao]` os UIDs habilitados. Não se presume que todos os membros saibam exercer todas as funções. Cadastre essas habilitações antes das novas escalas. Atribuições de escalas antigas são preservadas ao editar, mesmo sem cadastro de habilitação; funções vazias ou repetidas recebem rótulos distintos na revisão para conservar todas as pessoas e respostas; novas atribuições exigem elegibilidade.
- Uma pessoa por função, sem repetir a mesma pessoa na mesma escala (o modelo existente usa um item por pessoa para confirmação). `roles` conserva as funções vagas, inclusive ao duplicar.
- Escala vazia exige confirmação e pode ser completada por Editar. Repetição existente continua disponível.
- Menu lateral com aniversariantes, calendário, disponibilidade e opções já existentes. Aniversariantes tem navegação por mês.
- Diálogos com foco inicial, contenção de Tab, Escape, bloqueio da interface de fundo e retorno de foco. Controles acionáveis por teclado e mensagens anunciadas. Botões e rodapé do assistente separados da área de rolagem.
- Pedido de troca registra notificação ao líder; não transfere a vaga nem confirma substituto. O colega precisa pertencer à equipe.

## Dados e autorização

| Caminho | Conteúdo | Quem lê |
| --- | --- | --- |
| `igs/{g}` | Igreja, ids, ministérios/escalas; `schema: 2`; sem `mb` | Membros aprovados, consulta com schema 2 |
| `igs/{g}/membros/{uid}` | Somente `u`, `n`, `foto`, `nasc` | Membros da igreja |
| `igs/{g}/contatos/{uid}` | Somente `tel` | Titular por documento ou administrador; lista completa só administrador |
| `igs/{g}/pedidos/{uid}` | Somente perfil público, sem telefone | Titular ou administrador |
| `users/{uid}` | Perfil privado, incluindo o celular e estado de entrada | Somente o titular; nem administrador lê outro `users` |

O número em `users` já tinha autorização individual correta nas regras fornecidas; ele permanece privado, sem ampliar a leitura para administradores. O contato da igreja fica em `contatos`, separado do perfil compartilhado. O titular edita os dois números em um único batch; ao ingressar em outra igreja, o app copia o número privado para o contato da igreja pretendida. A arquitetura original escolhe uma única igreja aprovada por sessão; não foi criada interface multigreja.

As regras validam campos permitidos nos perfis, pedidos e contatos. Não basta ocultar UI: leitura direta, consulta de coleção e gravações sem a interface foram testadas. `adm` é a fonte da autorização de contatos e não pode ser alterado. Ser sublíder ou editar `mins[].lids` não concede esse acesso.

Cadastro continua gravando telefone apenas no perfil privado `users`. Criar igreja grava o perfil público e o contato separado no mesmo batch. Pedido de entrada e contato privado também são atômicos. Aprovação cria o perfil público e ids, conserva o contato privado e remove o pedido. Recusa, cancelamento e remoção limpam contatos associados. Os listeners privados são separados dos listeners da igreja. Membros escutam somente seu próprio documento de contato; o administrador escuta a coleção.

`cfg.ph=false` bloqueia atualizações do contato da igreja pelo titular nas regras, incluindo tentativas de apagar e recriar. O administrador pode administrá-lo. O número privado pessoal de `users` continua pertencendo ao titular; uma gravação isolada nele não altera o contato bloqueado da igreja. O app usa batch e mostra o número da igreja no perfil. A mudança de configuração por membro é negada.

### Limitação de autorização herdada, fora dos telefones

O documento original contém arrays de escalas, avisos, enquetes, indisponibilidades e notificações. As novas regras congelam `adm`, `ids`, configurações e campos estruturais para membros, mas ainda permitem alterações amplas dentro de `mins`, `ind`, `indr`, `nt`, `av`, `po`. Portanto, permissões de gestão de ministério e edição de respostas alheias **ainda não estão integralmente protegidas no banco**. Não interpretar esta entrega como auditoria de segurança completa do app.

A proteção de telefones não depende desses arrays: o administrador vem do campo imutável `adm`. Para endurecer as outras funções, o próximo trabalho deve separar ministérios, escalas, respostas e avisos em documentos com autorização específica. Não é seguro tentar validar uma lista arbitrária de objetos aninhados só com verificações do JavaScript. Esta limitação é material e deve entrar na decisão de publicação.

## Plano para revisão antes de qualquer publicação

1. Revisar regras, schema e testes em um projeto Firebase de homologação. Confirmar outras coleções, integrações, Cloud Functions e clientes além do HTML fornecido. Arquivos de hospedagem, service worker e manifest não vieram no anexo; conferir a estratégia de cache realmente publicada.
2. Exportar backup completo do Firestore e registrar a URI e a conclusão da operação. Guardar backups com acesso restrito: eles contêm os telefones antigos. Testar restauração em outro projeto. Não reintroduzir a regra antiga de leitura compartilhada como rollback.
3. Preparar e aguardar o índice em `firestore.indexes.json`. Estimar igreja por igreja com `migrate.cjs` no modo padrão, sem `--apply`. O script mostra contagens e conflitos, nunca os números. Conferir correspondência entre `ids` e `mb`. Campos inesperados, perfil fora do schema e mais de 450 gravações interrompem a operação para revisão.
4. Agendar manutenção e substituir as regras antigas por regras temporárias que neguem as leituras de `igs`/pedidos e as escritas de clientes durante a transição. Um `allow ...: if false` adicionado ao lado de um `allow` antigo não revoga nada: as regras permissivas antigas precisam ser removidas/substituídas. Essa publicação depende de aprovação e não foi executada.
5. Com os clientes bloqueados, executar a migração autorizada com credencial de serviço de privilégio mínimo. Cada igreja é migrada numa transação: copiar perfis públicos e contatos; remover telefones dos pedidos; remover **todo** `mb` do documento da igreja; marcar `schema:2`. Não há fase em que se publica a nova leitura de um documento ainda com os números antigos.
6. A precedência de conflito é `users.tel` privado → `mb.tel` ou pedido → contato já migrado. Revisar o número de conflitos antes de aprovar. Números ausentes permanecem ausentes; não são inventados. Valores de `users` não são apagados, pois são privados. O script é atômico por igreja e tolera repetição sem apagar contatos migrados; não suporta automaticamente igrejas acima do limite de gravações.
7. Conferir por Admin SDK/export: ausência de `mb` em `igs`, ausência de `tel` nos perfis públicos e pedidos, presença dos contatos necessários. Inspecionar conteúdo adicional não conhecido pelo HTML para eventuais cópias de telefones. Ensaiar cadastro, aprovação, recusa, cancelamento, edição de perfil, edição bloqueada e remoção na homologação.
8. Publicar regras finais novas e o HTML novo após a migração e o índice prontos. Não manter um `allow` amplo sobreposto em outro match. A consulta do app inclui `schema == 2`; a consulta antiga sem esse filtro é negada, e os clientes antigos não conseguem regravar `mb` ou pedidos com `tel`.
9. Invalidar caches da hospedagem/service worker e promover a atualização da PWA. O HTML novo usa cache Firestore em memória e tenta limpar o IndexedDB antigo antes de iniciar listeners. Se outra aba impedir a limpeza, bloqueia o uso e pede fechamento/recarregamento. Testar esse caso com o app real e o service worker de produção.
10. Comunicar aos usuários como limpar dados do site/PWA em dispositivos compartilhados. **Não é possível revogar remotamente números já recebidos no cache antigo, exportados ou copiados.** Clientes antigos offline podem continuar exibindo os dados locais; negar novas leituras não apaga essas cópias. Não prometer privacidade retroativa.
11. Monitorar erros de permissão e validar contas reais de administrador, sublíder e membro antes de encerrar a manutenção. Em falha, manter bloqueio seguro e corrigir; restaurar só com plano que continue separando os contatos.

## Execução local e testes

Requer Node, Java 21, Chromium e as dependências de `package.json`.

```sh
npm install
npm run test:privacy
npm run test:ui
npm run test:integration
```

Os testes usam apenas `demo-escala`, emuladores locais e dados fictícios. A suíte UI simula o Firebase; a suíte integrada usa Firebase 10.14.1 com Authentication e Firestore emulados. Nenhuma suíte autentica ou grava no projeto real do HTML. O emulador não testa criação de índices em produção, entrega de email, login Google, instalação PWA, push, políticas de hospedagem ou dados reais.

Simulação de migração, após configurar ADC fora do código (não enviar credenciais pelo chat):

```sh
node migrate.cjs --project PROJETO --church ID_DA_IGREJA
```

A aplicação não é executada por padrão. Após revisão e aprovação explícita da manutenção e backup:

```sh
node migrate.cjs --project PROJETO --church ID_DA_IGREJA --apply --backup-uri gs://BACKUP_CONCLUIDO
```

A URI é um registro informado pelo operador; o script não comprova que o export foi concluído. Confirmar esse estado externamente antes da execução. Credenciais e permissões de produção não foram fornecidas nem solicitadas nesta etapa.
