# Aviva - Pontos do Bem

O **Aviva** é uma plataforma digital de alto impacto focada em unir Organizações Não Governamentais (ONGs), voluntários e empresas em um único ecossistema colaborativo e orientado a dados. 

O objetivo do sistema é atuar como um facilitador completo de responsabilidade social corporativa e civil, centralizando e democratizando o acesso a ferramentas de gestão que hoje são fragmentadas ou de custo proibitivo. A criação da rede permitirá otimização de recursos, rastreabilidade de dados sociais, atração inteligente de parceiros e a remoção de barreiras tecnológicas para o Terceiro Setor.

A iniciativa apoia fortemente a **Agenda 2030 da ONU**, com foco central no **Objetivo de Desenvolvimento Sustentável (ODS) 17** (Fortalecimento de parcerias e meios de implementação), apoiando transversalmente a erradicação da pobreza (ODS 1), saúde (ODS 3), educação (ODS 4) e redução de desigualdades (ODS 10).

---

## Equipe Desenvolvedora
Projeto acadêmico idealizado, pesquisado e desenvolvido por alunas do curso superior de tecnologia em **Análise e Desenvolvimento de Sistemas (AMS)** pela **FATEC Zona Leste**:
* Desirée Constantino
* Isabelle Gomes
* Nicole Milanez

## 1. O Problema e o Cenário Atual
A concepção do Aviva baseia-se na análise crítica do Terceiro Setor brasileiro. Pesquisas de instituições como FGV e IPEA apontam que, apesar de existirem milhares de ONGs realizando trabalhos vitais, a falta de recursos aliada à **baixa maturidade digital** limita severamente a sobrevivência dessas instituições. Cria-se um gargalo: sem infraestrutura digital, há pouca visibilidade; com pouca visibilidade, a captação de recursos e voluntários é mínima.

Em contrapartida, há uma demanda corporativa e civil reprimida. Empresas com capital para investir em Responsabilidade Social e indivíduos dispostos a doar tempo esbarram na fragmentação das ferramentas. O mercado exige uma plataforma para mobilizar voluntariado, outra para doações com isenção fiscal, e uma terceira para auditoria e transparência. Essa descentralização gera redundância de esforços e afasta investimentos.

## 2. A Nossa Tese de Inovação (Benchmarking)
Avaliando o estado da arte e realizando o benchmarking de soluções existentes, mapeamos uma clara fragmentação:
* Plataformas de nível *Enterprise* (ex: *Benevity*) operam com excelência no controle corporativo, mas possuem custo extremamente elevado, restringindo-se a multinacionais.
* Soluções nacionais (ex: *Atados*, *Ribon*, *Transforma Brasil*) atuam em nichos isolados, focando ou apenas no engajamento "mão na massa" ou estritamente no fluxo financeiro e gamificação de doações.

A vantagem competitiva do **Aviva** é a **Centralização do Ecossistema**. Nosso diferencial é democratizar essas tecnologias de ponta, oferecendo, em um ambiente único e integrado, a gestão de campanhas, o motor de "match" de voluntários e a extração de métricas de impacto automatizadas.

---

## 3. Atores do Ecossistema
A arquitetura de negócio foi desenhada para atender três perfis, gerando uma rede de retroalimentação de valor:

* 🏢 **ONGs (Terceiro Setor):** Recebem um painel de gestão intuitivo para cadastramento de eventos, vagas e campanhas. Ganham uma vitrine digital confiável, com módulos de verificação para comprovação de conformidade (*compliance*).
* 🙋‍♀️ **Voluntários (Pessoas Físicas):** Acesso facilitado (cadastro em menos de 2 minutos). Através de geolocalização e cruzamento de habilidades, encontram projetos com alta afinidade para doar força de trabalho ou conhecimentos técnicos específicos (design, tecnologia, educação, etc.).
* 💼 **Empresas (Setor Privado):** Painel dedicado à gestão ESG (Environmental, Social, and Governance). Permite estruturar o voluntariado corporativo e o repasse de recursos, gerando valor direto para o balanço social da empresa.

---

## 4. Transparência Fiscal e Métricas ESG
Para garantir a adesão do Setor Privado, o Aviva reduz a burocracia na utilização de incentivos fiscais:

* **Doação dedutível (Lucro Real):** ONGs autodeclaram o cumprimento dos requisitos materiais da Lei 9.790/1999 (finalidade estatutária, sem distribuição de sobras, sem atuação político-partidária) e anexam o estatuto. Empresas no Lucro Real registram a doação, anexam o comprovante e recebem uma declaração de doação em PDF; o painel acompanha o teto dedutível de 2% do lucro operacional por exercício.
* **Rastreabilidade:** Toda ação (horas voluntariadas por colaboradores vinculados à empresa, apoios a ONGs e doações) é registrada em tabelas relacionais com *timestamps*.
* **Painel ESG com exportação:** A empresa acompanha ONGs apoiadas, horas de voluntariado, ações concluídas e doações dedutíveis, e exporta um relatório em PDF para compor auditorias e relatórios de sustentabilidade.

* **ODS e impacto ambiental:** cada vaga indica até 3 Objetivos de Desenvolvimento Sustentável (a ONG parte de uma sugestão pela categoria). O painel e o PDF da empresa mostram horas e ações por ODS. A ONG também pode declarar, por voluntário, árvores plantadas ou quilos de resíduo reciclado. O CO₂ é estimado **só a partir de árvores** (cenário conservador de 140 kg CO₂e por árvore nativa em 20 anos, estudo Totum/ESALQ/SOS Mata Atlântica) e sempre aparece como estimativa, não como crédito de carbono; resíduos aparecem em quilos, sem conversão.

> Ainda fora do escopo: marcação de projetos em leis de incentivo (Rouanet, FUMCAD, PRONON) e conversão de resíduos em CO₂.

---

## 5. Arquitetura do Sistema e Tecnologias

* **Front-end Mobile & Web:** **React Native + Expo (Expo Router)**, uma única base de código para Android, iOS e web.
* **Back-end:** **Supabase** (Backend-as-a-Service): PostgreSQL com *Row Level Security*, Supabase Auth (e-mail/senha e Google), Storage para imagens e documentos fiscais e funções SQL (`SECURITY DEFINER`) para expor dados sensíveis de forma controlada. Todas as regras de acesso vivem no banco, não no cliente.
* **Mapa e geolocalização:** OpenStreetMap (Leaflet) e `expo-location`.
* **Relatórios:** PDFs gerados no dispositivo com `expo-print` e `expo-sharing`.
* **Qualidade:** testes automatizados (Jest) das regras de negócio em `lib/`, executados a cada push via GitHub Actions.

### Como rodar
```bash
npm install
npx expo start        # --web para abrir no navegador
npm test              # testes automatizados
```
As migrations SQL (`migration_*.sql`) devem ser executadas no SQL Editor do Supabase, em ordem cronológica de criação.

*Acesse nossa prototipação inicial em alta fidelidade no [Figma do Projeto](https://www.figma.com/team_invite/redeem/ftTJuakpvc2KcnhCnmtMav?t=2LOvTr6cmx9lM8q3-21).*

---

