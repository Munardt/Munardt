const fs = require("fs");
const fetch = require("node-fetch");

const GITHUB_USERNAME = "Munardt";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const query = `
{
  viewer {
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      commitContributionsByRepository(maxRepositories: 5) {
        repository {
          name
          owner {
            login
          }
        }
        contributions {
          totalCount
        }
      }
    }
  }
}
`;

async function fetchGitHubData() {
  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    
    if (!data || !data.data) {
      console.error("❌ Erro na resposta da API:", JSON.stringify(data, null, 2));
      throw new Error("API retornou dados inválidos!");
    }

    return data.data.viewer.contributionsCollection;
  } catch (error) {
    console.error("❌ Erro ao buscar dados do GitHub:", error);
    process.exit(1);
  }
}


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
    )
    .replace(
      /🔗 \*\*Repositórios em que mais contribuo:\*\*([\s\S]*?)---/,
      `🔗 **Repositórios em que mais contribuo:**  
      ${stats.commitContributionsByRepository
        .map((repo) => `- \`${repo.repository.owner.login}/${repo.repository.name}\``)
        .join("\n")}
      \n\n---`
    );

  fs.writeFileSync("README.md", readmeContent);
}

updateReadme();
