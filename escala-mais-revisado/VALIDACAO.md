# Validação — Escala+ (10/11/2026)

## Implementado

Continuação do HTML original, mantendo Authentication e Firestore e suas telas existentes. Assistente por funções fixas, habilitação explícita dos membros, seleção em painel, vagas abertas, confirmação de escala sem pessoas, edição e repetição. Menu lateral e aniversariantes por mês. Preservação de atribuições e respostas em escalas antigas, inclusive funções repetidas ou vazias. Alertas de indisponibilidade, conflito e sobrecarga.

Separação dos perfis públicos em `membros` e dos telefones em `contatos`. Ajustes em criar igreja, pedir entrada, aprovar, recusar, cancelar pedido, remover membro, editar perfil e trocar foto. Cadastro e complementação permanecem no perfil pessoal privado `users`. Regras e índice preparados. Migração com simulação padrão, validações e transação por igreja, sem execução em produção.

## Testado automaticamente

- **31 verificações de autorização no emulador Firestore**: leitura e lista por administrador; leitura do próprio contato; negações para sublíder, membro diferente, visitante e conta sem login; tentativa de promoção a administrador; tentativa de alterar configuração por membro; perfil privado de outra pessoa; reintrodução de `mb`; consultas antigas e novas; telefones em pedidos/perfis públicos; edição própria atômica; edição bloqueada; tentativa de apagar/recriar; pedido, aprovação, cancelamento e criação de igreja.
- **7 verificações de migração no emulador**: simulação sem mutação; cópia dos contatos; remoção de `mb`; remoção de `tel` dos pedidos e perfis públicos; precedência do perfil privado; repetição sem apagar contatos já migrados. Somente dados fictícios.
- **10 verificações integradas em Chromium**, usando Firebase **10.14.1**, Authentication e Firestore emulados: cadastro e criação de igreja; pedido e aprovação; criação de escala com função/elegibilidade; confirmação; recusa; solicitação de troca sem transferência automática; histórico; telefone privado atualizado e ausente do perfil público; disponibilidade; layout móvel. O fluxo passa também pela gravação da elegibilidade.
- **90 verificações de interface em Chromium**, em **360, 390 e 1440 px**, com Firebase simulado: confirmação, recusa, troca e preservação do integrante; histórico; perfil e telefone próprio; disponibilidade; menu/aniversariantes; foco no diálogo, contenção de Tab, Escape e retorno; proibição de mostrar contato para sublíder e exibição para administrador; assistente, vagas e preenchimento posterior; candidatos elegíveis e membro duplicado bloqueado; preservação de funções antigas repetidas/vazias e de confirmação; ausência de erro JavaScript e rolagem horizontal; contraste dos tokens de texto principais contra a superfície de card nos dois temas.
- Sintaxe do módulo JavaScript verificada com Node. Comparação literal da declaração `:root[data-theme="dark"]`: idêntica ao original.

Os testes integrados e de interface bloqueiam acesso externo: o projeto real do HTML não é acessado. As capturas usam fontes de fallback quando o Google Fonts é bloqueado pelo teste. As imagens em `screenshots` registram os cenários, não são testes de comparação de pixels.

## Limites e pendências

- Não houve publicação, migração real nem teste com contas/dados de produção. HTML, schema e regras devem ser revisados e promovidos em conjunto. Não substituir somente o HTML.
- As regras propostas protegem os caminhos de telefone, mas os arrays legados de escalas/avisos ainda têm autorização ampla de escrita por membros. Isso é descrito em `TRANSICAO.md` e exige outra refatoração para autorização granular completa do app.
- Cache persistente antigo: o app passa a usar memória e tenta limpar IndexedDB; a transição com abas/PWA reais e o service worker de produção precisa ser ensaiada. Não existe apagamento remoto garantido de números já recebidos.
- Não testados: OAuth Google, emails reais, atualização de email, PWA/push, arquivos de manifest/ícone/service worker (não fornecidos), instalação do índice em produção, compartilhamento nativo/imagem em aparelhos físicos e impressão.
- Acessibilidade testada por DOM/teclado e contraste dos tokens principais; falta conferência com leitor de tela em dispositivo físico. Não há alegação de certificação WCAG completa.
- As imagens de referência vieram incorporadas na conversa sem nomes de arquivo acessíveis; os estados foram associados pelo conteúdo visual.

## Como revisar

Abra `escala-mais.html` apenas num ambiente de homologação com o schema/regras novos. Para ver os fluxos sem credenciais reais, execute as suítes em `package.json`. O HTML final mantém a configuração Firebase original; os testes criam uma cópia temporária apontada somente para emuladores.

Leia `TRANSICAO.md` antes de qualquer mudança no banco ou publicação.
