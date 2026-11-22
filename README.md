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

### Testes E2E

Os testes usam as telas reais com autenticação simulada e o repositório em memória. Não precisam de credenciais nem acessam o Firebase. Cada teste começa com dados isolados e uma data fixa.

Execute o Cypress diretamente:

```sh
npm run e2e:run
```

Para abrir o Cypress em modo interativo, use `npm run e2e:open`.

O Cypress inicia automaticamente o servidor de testes, aguarda sua inicialização e usa o endereço obtido. A porta inicial é 5174; se estiver ocupada, outra porta livre é escolhida. O servidor é encerrado ao terminar a execução pelo terminal. Não é necessário iniciar `npm run dev` ou `npm run dev:e2e`, e a aplicação normal pode continuar aberta na porta 5173.

Para inspecionar manualmente o ambiente simulado no navegador, `npm run dev:e2e` continua disponível na porta 5174.

Os cenários cobrem login/cadastro na interface, criação, edição, cancelamento, conclusão por ocorrência, falhas de gravação e validação de ícones. Não validam o Firebase Authentication, o Firestore ou suas regras; esses serviços são substituídos apenas na entrada de testes em `cypress/support/planner.jsx`. A aplicação normal continua usando `src/main.jsx`.

A CI executa testes unitários e build em Linux, macOS e Windows, além do Cypress em um job Linux separado.

Há um teste unitário marcado como `todo` para o conflito com a próxima ocorrência semanal. Ele executa a expectativa correta e registra a falha conhecida sem interromper a suíte. Remova a marcação quando a expansão das ocorrências for implementada. Os testes de imagem verificam o limite atual do formulário; não validam o tamanho máximo de documento do Firestore.

## Como rodar

Instale o Node.js 24 e execute na pasta do projeto:

```sh
npm ci
npm run dev
```

Acesse o endereço informado no terminal, geralmente `http://localhost:5173`.
