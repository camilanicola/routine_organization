# Magical Girl Planner

## Integrantes

- Bruna Caroline Cardoso da Silva
- Camila Nicola Dias Santana
- Isabela Fernandes Guerra de Morais

## Sobre o sistema

O Magical Girl Planner organiza tarefas em uma agenda diária e um calendário mensal. Permite criar tarefas com ou sem data, definir prioridades pela matriz de Eisenhower, configurar repetição semanal e adicionar ícones e notas. A interface está em inglês.

Ao carregar a agenda, tarefas atrasadas, pendentes e sem repetição são reagendadas por prioridade, mantendo sua duração. A busca de horário livre considera as ocorrências semanais nos dias escolhidos, a partir da data inicial. Concluir uma ocorrência libera apenas seu próprio intervalo, sem concluir a série inteira.

## Tecnologias

- **React 19:** biblioteca para construir a interface em componentes.
- **Vite:** ferramenta de desenvolvimento e de build da aplicação.
- **JavaScript, HTML e CSS:** lógica de agenda, estrutura da página e estilo rosa.
- **Firebase Authentication:** login com e-mail e senha.
- **Cloud Firestore:** persiste as tarefas de cada usuária na coleção `users/{userId}/tasks`.
- **GitHub Actions:** executa testes unitários e build em Linux, macOS e Windows, além de Cypress em Linux.
- **Cypress:** executa os testes E2E.

## Uso de IA

Foi utilizado o Copilot para ajudar a construir a estrutura inicial e o primeiro protótipo.

## Como rodar

Use Node.js 24 e npm. Na pasta do projeto, instale as dependências:

```sh
npm ci
```

A versão 24.22.3 do Node.js está fixada nas dependências de desenvolvimento. Após a instalação, os scripts npm usam essa versão local, mesmo que o Node.js do terminal seja diferente. Confira com `npm exec -- node --version`.

Para usar a aplicação normal, configure um projeto Firebase com Authentication por e-mail e senha e Cloud Firestore. Crie `.env.local` na raiz e substitua os valores abaixo pelos da configuração do seu aplicativo web:

```dotenv
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_APP_ID=seu_app_id
```

Essas quatro variáveis são lidas por [src/firebase.js](src/firebase.js). Se alguma estiver ausente, a tela informa que o Firebase não foi configurado. As regras de acesso do projeto Firebase precisam ser configuradas separadamente; as regras incluídas neste repositório são exclusivas dos testes de integração.

Inicie o servidor de desenvolvimento:

```sh
npm run dev
```

Acesse o endereço informado no terminal, geralmente `http://localhost:5173`.

Para gerar o build em `dist/` e visualizá-lo localmente:

```sh
npm run build
npm run preview
```

## Execução dos testes

Os comandos abaixo pressupõem que as dependências já foram instaladas com `npm ci`. Os testes usam dados locais ou simulados e não precisam da configuração de `.env.local`.

### Testes de unidade

Para executar os testes de unidade localmente:

```sh
npm test
```

O comando executa apenas `src/*.test.js`, com `node:test` e `node:assert/strict`.

| Arquivos | Principais cenários |
| --- | --- |
| [calendar.test.js](src/calendar.test.js) | Grade mensal, datas, repetição, conclusão por ocorrência e ordenação da agenda. |
| [task-scheduler.test.js](src/task-scheduler.test.js) | Criação e entradas inválidas, conflitos semanais, intervalos que atravessam dias, falta de horário livre e reagendamento por prioridade, com desempate pelo início mais antigo. |
| [task-size.test.js](src/task-size.test.js) | Limite exato e um byte acima, texto UTF-8, campos nulos, arrays, histórico de conclusões, expansão Base64 e valores não suportados. |
| [task-repository.test.js](src/task-repository.test.js) | Filtro de compatibilidade, remoção e rejeição de edições ou lotes grandes demais, preservando os dados do repositório em memória. |
| [task-storage.test.js](src/task-storage.test.js) | Leitura, filtragem e limpeza do armazenamento local legado, dados ausentes ou corrompidos, falhas de acesso e uso do `localStorage` padrão. |
| [auth-errors.test.js](src/auth-errors.test.js) e [create-account.test.js](src/create-account.test.js) | Mensagens de erro e confirmação de senha. |

Os cenários do agendador também verificam a preservação do horário local e da duração das repetições. Para exercitar as mudanças de horário de verão em Linux ou macOS:

```sh
TZ=America/New_York npm test
```

Para medir a cobertura dos módulos JavaScript exercitados pelos testes unitários:

```sh
npm exec -- node --test --experimental-test-coverage --test-coverage-include="src/*.js" --test-coverage-exclude="src/*.test.js" "src/*.test.js"
```

Esse relatório considera os módulos carregados durante a execução. Não mede a cobertura da aplicação inteira: componentes JSX, testes de integração e Cypress não entram nessa medição. Os testes unitários de autenticação verificam funções auxiliares, sem realizar cadastro ou login no Firebase.

### Testes de integração com Firebase

Além do Node.js 24, instale Java 21 ou superior e deixe as portas 9099 e 8080 disponíveis.

Para executar:

```sh
npm run test:integration
```

O comando usa [firebase.integration.json](firebase.integration.json) para iniciar os emuladores locais de Authentication (`127.0.0.1:9099`) e Firestore (`127.0.0.1:8080`), executar `integration/*.test.js` e encerrar os emuladores. Na primeira execução, o Firebase CLI baixa os arquivos necessários. O projeto `demo-magical-girl-planner` não usa as credenciais de `.env.local`; os dados são descartados quando os emuladores encerram.

Os cenários em [integration/task-repository.test.js](integration/task-repository.test.js) usam o repositório real, criam usuários próprios por cenário e conferem os dados diretamente no servidor e pela leitura do repositório:

| Cenário | Verificação |
| --- | --- |
| Salvar e carregar | Persiste uma tarefa com seus dados e ID. |
| Atualizar | Mantém o ID e atualiza os dados sem duplicar o documento. |
| Rejeitar edição grande demais | Preserva o documento original após a falha da validação local. |
| `saveMany` | Salva várias tarefas e compara IDs e dados sem exigir ordem de leitura. |
| `deleteMany` | Exclui duas de três tarefas e preserva a restante. |
| Exclusão em mais de um lote | Exclui 501 de 502 tarefas em uma chamada, preservando a não selecionada. |
| Rejeitar lote inválido | Uma tarefa grande demais no final do lote impede a edição e a inclusão válidas que a precedem. |
| Isolamento entre usuários | Mantém tarefas de mesmo ID em coleções distintas e exige `permission-denied` ao listar, ler, editar, gravar em lote ou excluir dados de outro usuário. |

As regras de [integration/firestore.rules](integration/firestore.rules) valem apenas para os emuladores; esses testes não verificam as regras publicadas em produção. Os cenários de tamanho verificam a validação local antes da gravação, sem testar a rejeição pelo limite do servidor.

### Testes E2E

Os testes usam as telas reais com autenticação simulada e o repositório em memória. Não precisam de credenciais nem acessam o Firebase. Cada teste começa com dados isolados e uma data fixa.

Execute o Cypress diretamente:

```sh
npm run e2e:run
```

Para abrir o Cypress em modo interativo, use `npm run e2e:open`.

O Cypress inicia automaticamente o servidor de testes, aguarda sua inicialização e usa o endereço obtido. A porta inicial é 5174; se estiver ocupada, outra porta livre é escolhida. O servidor é encerrado ao terminar a execução pelo terminal. Não é necessário iniciar `npm run dev` ou `npm run dev:e2e`, e a aplicação normal pode continuar aberta na porta 5173.

Para inspecionar manualmente o ambiente simulado no navegador, `npm run dev:e2e` continua disponível na porta 5174.

Os cenários em [cypress/e2e](cypress/e2e) cobrem os formulários de login/cadastro, criação de tarefa sem data, edição, cancelamento, conclusão por ocorrência, gravação do reagendamento sem conflito semanal, falhas de gravação e validação de ícones. Não validam `AuthProvider`, Firebase Authentication, Firestore ou suas regras; autenticação e persistência são substituídas na entrada de testes em [cypress/support/planner.jsx](cypress/support/planner.jsx). A aplicação normal usa [src/main.jsx](src/main.jsx).

Os testes de ícones verificam rejeição de arquivos que não são PNG, rejeição de arquivos acima de 1 MB e uso de um PNG válido. O formulário também valida o tamanho após a conversão para Base64, e o repositório valida a tarefa completa antes da gravação; por isso, um arquivo abaixo de 1 MB ainda pode precisar ser reduzido. O Cypress não mede a cobertura do código nem valida o limite de documento no servidor Firestore.

### Integração contínua

A configuração em [.github/workflows/ci.yml](.github/workflows/ci.yml) é executada em pushes e pull requests para `main`, além de permitir execução manual:

- **Linux, macOS e Windows:** instalação com `npm ci`, testes unitários com `npm test` e build com `npm run build`, usando Node.js 24.
- **Linux, em um job separado:** testes de navegador com `npm run e2e:run`.

Os testes de integração com os emuladores e a medição de cobertura ainda são executados localmente; não fazem parte da CI atual.
