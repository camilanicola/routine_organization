# Magical Girl Planner

## Integrantes: 
- Bruna Caroline
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

```sh
npm run dev -- --host 127.0.0.1
```

Em outro terminal, execute o Cypress:

```sh
npm run e2e:run
```

Para abrir o Cypress em modo interativo, use `npm run e2e:open`.

## Como rodar

Instale o Node.js 24 e execute na pasta do projeto:

```sh
npm ci
npm run dev
```

Acesse o endereço informado no terminal, geralmente `http://localhost:5173`.