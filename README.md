# Magical Girl Planner

## Integrantes: 
- Bruna Caroline Cardoso da Silva
- Camila Nicola
- Isabela Fernandes Guerra de Morais

## Sobre o sistema: 
O Magical Girl Planner é uma aplicação de planner para organizar tarefas, com ou sem data, com escala de prioridades usando a matriz de Eisenhower (importante, urgente, urgente e importante, não urgente e não importante), definir se deseja que a tarefa seja repetida em algum dia da semana, adicionar icons e notas.

## Tecnologias: 
- **React 19:** biblioteca para construir a interface em componentes.
- **Vite:** ferramenta de desenvolvimento e de build da aplicação.
- **JavaScript, HTML e CSS:** lógica de agenda, estrutura da página e estilo rosa.
- **Firebase Authentication:** login com e-mail e senha.
- **Cloud Firestore:** banco de dados na nuvem que guarda as tarefas de cada usuária, protegido por regras de segurança.
- **GitHub Actions:** executa o build em Linux, macOS e Windows.
- **Cypress:** executa os testes E2E

## Uso de IA: 
- Foi utilizado o copilot para ajudar a construir a estrutura inicial e o primeiro protótipo

## Execução dos testes: 

### Testes de unidade

Para executar os testes de unidade localmente:

```sh
npm test
```

Os testes em `src/task-size.test.js` verificam a validação local de tamanho: limite exato e um byte acima, texto UTF-8, campos nulos, repetição, histórico de conclusões e expansão do ícone para Base64. Os testes do repositório em memória verificam que uma edição ou um lote grande demais não altera os dados salvos.

### Testes de integração com Firebase

Use Java 21 ou superior. O Node.js 24 está incluído nas dependências de desenvolvimento: após `npm ci`, os comandos `npm run` usam essa versão local, mesmo que o terminal ainda mostre Node.js 18 ao executar `node --version`.

Para instalar as ferramentas e executar os testes:

```sh
npm ci
npm run test:integration
```

Para conferir a versão local usada pelo projeto, execute `npm exec -- node --version`.

O comando inicia os emuladores locais de Authentication (porta 9099) e Firestore (porta 8080), executa os testes e encerra os emuladores. Na primeira execução, o Firebase CLI baixa os arquivos necessários. O projeto `demo-magical-girl-planner` não usa as credenciais de `.env.local`; os dados são descartados quando os emuladores encerram.

O primeiro cenário está em `integration/task-repository.test.js`: cria um usuário no emulador de autenticação, salva uma tarefa usando o repositório real e confere o documento diretamente no servidor e pela leitura do repositório. As regras de `integration/firestore.rules` valem apenas para esse ambiente; não representam uma verificação das regras publicadas em produção.

O segundo cenário, no mesmo arquivo, edita uma tarefa já salva e confere que o documento mantém o mesmo ID, contém os dados atualizados e não é duplicado. Cada cenário cria seu próprio usuário no emulador e encerra sua conexão ao finalizar o teste.

O terceiro cenário tenta salvar uma edição com um ícone grande demais, confere o erro da validação local e consulta o servidor para garantir que o documento original foi preservado. Ele verifica a proteção antes da gravação, sem depender de uma rejeição pelo limite do servidor.

`npm test` continua executando apenas os testes unitários de `src`. Os próximos cenários de integração serão adicionados individualmente, após revisão.

### Testes E2E

Os testes usam as telas reais com autenticação simulada e o repositório em memória. Não precisam de credenciais nem acessam o Firebase. Cada teste começa com dados isolados e uma data fixa.

Execute o Cypress diretamente:

```sh
npm run e2e:run
```

Para abrir o Cypress em modo interativo, use `npm run e2e:open`.

O Cypress inicia automaticamente o servidor de testes, aguarda sua inicialização e usa o endereço obtido. A porta inicial é 5174; se estiver ocupada, outra porta livre é escolhida. O servidor é encerrado ao terminar a execução pelo terminal. Não é necessário iniciar `npm run dev` ou `npm run dev:e2e`, e a aplicação normal pode continuar aberta na porta 5173.

Para inspecionar manualmente o ambiente simulado no navegador, `npm run dev:e2e` continua disponível na porta 5174.

Os cenários cobrem login/cadastro na interface, criação, edição, cancelamento, conclusão por ocorrência, reagendamento sem conflito com repetições semanais, falhas de gravação e validação de ícones. Não validam o Firebase Authentication, o Firestore ou suas regras; esses serviços são substituídos apenas na entrada de testes em `cypress/support/planner.jsx`. A aplicação normal continua usando `src/main.jsx`.

A CI executa testes unitários e build em Linux, macOS e Windows, além do Cypress em um job Linux separado.

O reagendamento considera as ocorrências semanais nos dias escolhidos, a partir da data inicial, mantendo o horário local de início e a duração em minutos. Ocorrências concluídas liberam apenas seu próprio intervalo. Os testes unitários cobrem conflitos com essas repetições, intervalos que atravessam dias e mudanças de horário de verão; o Cypress verifica a gravação da tarefa reagendada ao carregar a agenda. Para conferir as mudanças de horário de verão em sistemas Unix, execute `TZ=America/New_York npm test`. Os testes de imagem verificam o limite atual do formulário; não validam o tamanho máximo de documento do Firestore.

## Como rodar

Com Node.js e npm disponíveis, execute na pasta do projeto. A instalação inclui o Node.js 24 usado pelos scripts:

```sh
npm ci
npm run dev
```

Acesse o endereço informado no terminal, geralmente `http://localhost:5173`.
