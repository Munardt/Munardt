const fs = require("fs");
const fetch = require("node-fetch");

/** Constante do Token de acesso às informações */
const GITHUB_TOKEN = process.env.TOKEN_ACCESS;

/** Query GraphQL */
const query = `
{
  viewer {
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
    }
  }
}
`;

/**
 * Busca as contribuições do usuário atual no GitHub
 *
 * @returns {Promise<{
 *   totalCommitContributions: number,
 *   totalPullRequestContributions: number,
 *   totalIssueContributions: number,
 * }>} Dados das contribuições do usuário
 *
 * @example fetchGitHubData()
 */
async function fetchGitHubData() {
  try {
    const response = await fetchData();

    const data = await response.json();

    if (!data?.data) errorGetData();

    return data.data.viewer.contributionsCollection;
  } catch (error) {
    console.error("Erro ao buscar dados do GitHub:", error);
    process.exit(1);
  }
}

/**
 * Faz uma requisição POST para a API do GitHub para buscar dados do usuário
 * atual.
 *
 * @returns {Promise<Response>} Resposta da requisição
 *
 * @example fetchData()
 */
async function fetchData() {
  return await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({ query }),
  });
}

/**
 * Mostra um erro se a API do GitHub não retorna dados válidos e
 * termina a execução do programa.
 *
 * @param {object} data - Dados retornados pela API do GitHub
 * @throws {Error} Se a API retornou dados inválidos
 *
 * @example errorGetData()
 */
function errorGetData() {
  console.error(
    "API não conseguiu retornar dados válidos:",
    JSON.stringify(data, null, 2)
  );
  throw new Error("API retornou dados inválidos!");
}
/**
 * Atualiza o conteúdo do README com as contribuições do usuário atual
 * e substitui os dados do template.
 *
 * @example updateReadme()
 */
async function updateReadme() {
  const stats = await fetchGitHubData();

  let readmeContent = fs.readFileSync("README.md", "utf8");

  readmeContent = readmeContent
    .replace(/`🟢 Atualizando...`/g, "")
    .replace(
      /📦 \*\*Commits em repositórios privados\/públicos:\*\*([\s\S]*?)🔀/,
      `📦 **Commits em repositórios privados/públicos:**  
      \`${stats.totalCommitContributions} commits\`\n\n🔀`
    )
    .replace(
      /🔀 \*\*Pull Requests Feitos:\*\*([\s\S]*?)📝/,
      `🔀 **Pull Requests Feitos:**  
      \`${stats.totalPullRequestContributions} PRs\`\n\n📝`
    )
    .replace(
      /📝 \*\*Issues Criadas:\*\*([\s\S]*?)🔗/,
      `📝 **Issues Criadas:**  
      \`${stats.totalIssueContributions} issues\`\n\n🔗`
    );

  fs.writeFileSync("README.md", readmeContent);
}

updateReadme();
