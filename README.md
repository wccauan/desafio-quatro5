# Gestão de Atividades — Desafio Técnico Quatro5

Ferramenta de gestão de tarefas para um time de produto e tecnologia (devs, design, QA, PM, dados), construída para resolver as dores do Ricardo, dono de uma PME com 10 funcionários que hoje administra o trabalho do time por planilha, papel e WhatsApp.

## Como rodar

```bash
git clone <https://github.com/wccauan/desafio-quatro5.git>
cd desafio-quatro5
npm install
npm run dev
```

Abra o endereço indicado no terminal (na maioria das vezes: `http://localhost:5173`). Não é necessário configurar nenhuma variável de ambiente, o projeto já vem conectado a uma instância do Supabase com 10 usuários e 20 tarefas fictícias (18 dos atendentes e 2 do Ricardo) pré-cadastradas, então a aplicação abre populada, sem telas vazias.

> **Nota sobre as credenciais do Supabase:** a URL e a chave anônima (`anon key`) estão hardcoded em `src/lib/supabase.ts` em vez de em um `.env`. Decisão consciente para o prazo de 48h: a chave anônima do Supabase é segura para ficar pública por design (o acesso real é controlado por Row Level Security no banco), e isso elimina qualquer passo extra de configuração para quem for avaliar o projeto — clona e roda, sem fricção.

## Stack

- **Vite + React + TypeScript**
- **TailwindCSS v4** (`@import "tailwindcss"` no `index.css`, sem arquivo de config)
- **Supabase** (Postgres + REST + autenticação de dados)
- **lucide-react** para ícones

## A metodologia: por que Kanban

Das opções sugeridas (Kanban, Scrum, OKR, Eisenhower, PDCA, SMART), escolhi **Kanban** como espinha dorsal da ferramenta, com indicadores de carga e prazo por cima.

A razão é o contexto do Ricardo, não preferência por modismo: ele tem um time de produto e tecnologia com fluxo contínuo de tarefas (features, bugs, revisões, análises), não entregas em lote fechadas que justificariam, por exemplo, ciclos rígidos de Scrum. Kanban resolve diretamente a primeira fala dele — *"o trabalho do time vive espalhado em planilha, papel e grupo de WhatsApp, eu nunca sei o que está em andamento de verdade"* — porque dá um lugar único e visual onde todo o fluxo (A Fazer → Em Andamento → Concluído) fica visível em tempo real, sem precisar perguntar a ninguém.

Não implementei Kanban "à risca" porque o time é pequeno (10 pessoas) e o ganho de um limite rígido não compensaria a complexidade extra para o escopo de 48h. A movimentação entre colunas é feita por botões (← →) em vez de drag-and-drop.

Sobre os indicadores: eles não substituem uma metodologia inteira (não é um "Kanban + OKR" disfarçado), mas servem como a camada de leitura que falta no Kanban puro — é o que transforma "estou vendo o board" em "sei o que fazer a respeito do que estou vendo".

## Indicadores (KPIs)

Cada indicador existe para gerar uma decisão específica do Ricardo — não é número de enfeite.

| Indicador | Decisão que ele habilita |
|---|---|
| **Taxa de conclusão** | Mostra se o time está entregando no ritmo esperado. É o número que substitui o "acho que foi uma boa semana" da reunião de segunda por um dado concreto. |
| **Em andamento** | Indica volume de trabalho ativo agora. Ajuda Ricardo perceber se o time está com a esteira parada ou sobrecarregada de tarefas simultâneas. |
| **Atrasadas** | Alerta antecipado de prazos já vencidos. Resolve diretamente a dor de "só fico sabendo que o prazo estourou depois que estourou" — Ricardo vê o problema antes do cliente reclamar. |
| **Total de tarefas** | Dá escala para interpretar os outros números. Sem isso, "5 atrasadas" não significa nada — é diferente em um time com 10 tarefas ou com 100. |
| **Maior carga** | Identifica quem está sobrecarregado. Decisão: redistribuir trabalho antes que a pessoa afogada comece a atrasar entregas. |
| **Menor carga** | Identifica quem está ocioso. Decisão: quem pode receber mais demanda — completa o par com "Maior carga" para resolver a dor de "tem gente afogada e gente ociosa, e eu só descubro quando alguém reclama". |
| **Mais atrasado** | Aponta quem precisa de suporte ou ajuste de prioridade com urgência — não é punição, é onde intervir primeiro. |
| **Mais produtivo** | Reconhecimento e benchmark de desempenho dentro do time, útil em conversas de feedback e em decisões de quem está pronto para mais responsabilidade. |
| **Filtro por membro do time** (multi-seleção) | Não é um KPI em si, mas a camada que torna os KPIs acionáveis 1:1: Ricardo isola o desempenho de uma ou mais pessoas (inclusive ele mesmo) para preparar uma conversa individual em vez de só olhar a média do time. |

**Sobre Ricardo (ID 1) nos KPIs:** ele é o dono da empresa, então é excluído por padrão dos KPIs gerais e do board geral — caso contrário, suas próprias tarefas administrativas distorceriam os números do time de produto e tecnologia. Ele só aparece nos indicadores quando selecionado explicitamente no filtro de membro do time, junto dos demais.

## Funcionalidades implementadas

- Board Kanban com 3 colunas, dados buscados do Supabase em tempo real
- Criação de tarefa (modal com título, descrição, responsável, prioridade, status inicial e prazo)
- Movimentação de tarefa entre colunas, com optimistic update e reversão automática em caso de falha do banco
- Exclusão de tarefa, com confirmação simples antes de remover
- Filtro por membro do time na top bar, com multi-seleção; KPIs e board reagem ao filtro ativo
- 8 indicadores + segmentação por membro do time (tabela acima)
- Estados de loading (skeleton), erro e vazio

## Cortes — o que ficou fora por causa do prazo

- **Sem autenticação.** Qualquer pessoa com o link acessa a ferramenta como se fosse o Ricardo. Implementar login real (Ricardo vs. membros do time, com RLS por papel) exigiria modelar permissões que não eram o foco do desafio em 48h.
- **Sem backend dedicado.** Optei pelo Supabase (Postgres + REST + autenticação de dados gerenciados) em vez de escrever uma API própria, justamente para conseguir entregar valor de ponta a ponta e por questões atuais de afinidade com o mesmo, já o conheço e utilizo, então acabaria sendo mais rapida a solução.
- **Sem edição de tarefa.** O fluxo atual cobre criar, mover e excluir; editar um título, prazo ou responsável depois de criada a tarefa não foi implementado nesta versão.
## O que eu faria com mais tempo

- Edição de tarefa
- Tema escuro e refino geral de layout
- Drag-and-drop no board
- Autenticação real com RLS diferenciando Ricardo dos demais membros do time
- Notificação (e-mail ou push) quando uma tarefa estiver perto do prazo, antes de atrasar
- Histórico de mudanças por tarefa (quem moveu, quando, de onde para onde)