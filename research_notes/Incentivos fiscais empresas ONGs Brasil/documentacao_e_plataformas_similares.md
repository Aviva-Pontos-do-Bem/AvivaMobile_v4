# Documentação Fiscal para Doações Dedutíveis (Empresas) e Plataformas Digitais de Referência no Brasil

## 1. Que declaração(ões) a empresa precisa preencher/entregar (ECF, e-Financeira, LALUR/e-LALUR)?

### Takeaway
Toda pessoa jurídica tributada pelo Lucro Real (obrigatório acima de R$ 78 milhões/ano de receita) deve escriturar a doação na ECF (Escrituração Contábil Fiscal), com lançamentos específicos no e-LALUR/e-LACS conforme o tipo de doação: doações a fundos de incentivo (FIA, Fundo do Idoso, PRONON/PRONAS) **não são despesa dedutível do lucro operacional** — precisam ser adicionadas integralmente no LALUR — mas geram **dedução direta do IRPJ devido** (até 1% cada); já doações diretas a OSCs (sob a Lei 13.019/2014, MROSC) e patrocínios à Lei Rouanet têm tratamento distinto. Não há uma declaração fiscal separada "de doação" — tudo é reportado dentro da ECF anual.

### Cited Findings
- Todas as pessoas jurídicas são obrigadas a apresentar a ECF, tributadas pelo lucro real, presumido ou arbitrado, com poucas exceções — [Receita Federal - ECF](https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/ecf)
- O LALUR (Livro de Apuração do Lucro Real) é escriturado dentro da ECF (partes A e B do e-Lalur e e-Lacs) e serve para ajustar o lucro contábil ao lucro fiscal — [CLM Controller - LALUR](https://clmcontroller.com.br/tributos/lalur-o-que-e/)
- Doações a pessoas físicas e empresas com fins lucrativos não são dedutíveis e devem ser adicionadas integralmente no LALUR; doações puras, por serem "ato de liberalidade", não atendem ao critério de despesa "normal, usual e necessária" à atividade da empresa — [Contabeis.com.br](https://www.contabeis.com.br/artigos/5657/contribuicoes-e-doacoes-dedutiveis-no-lucro-real/), [Mauro Negruni](https://mauronegruni.com.br/2019/09/14/contribuicoes-e-doacoes-dedutiveis-no-lucro-real/)
- Doações aos Fundos da Criança e do Adolescente (FIA/FUMCAD) não podem ser tratadas como despesa operacional dedutível do Lucro Real — devem ser adicionadas no LALUR — mas há a possibilidade de deduzir diretamente do IRPJ devido, desde que não ultrapassem 1% do imposto devido — [Mauro Negruni](https://mauronegruni.com.br/2019/09/14/contribuicoes-e-doacoes-dedutiveis-no-lucro-real/)
- Para que a saída de caixa seja considerada, o dinheiro precisa efetivamente ter saído do caixa da empresa; se a doação é registrada como despesa em dezembro mas o pagamento ocorre só em janeiro do ano seguinte, o valor deve ser adicionado no LALUR do ano 1 e só pode ser excluído no LALUR do ano 2, quando o pagamento é efetivado — [Mauro Negruni](https://mauronegruni.com.br/2019/09/14/contribuicoes-e-doacoes-dedutiveis-no-lucro-real/)
- Doações dedutíveis feitas por empresas diretamente a OSCs (sob a Lei 13.019/2014) podem ser deduzidas como despesa operacional até o limite de 2% do lucro operacional da empresa doadora antes de computada a própria dedução (regime de Lucro Real obrigatório) — [Escola Aberta do 3º Setor](https://escolaaberta3setor.org.br/sebrades-artigos/as-doacoes-dedutiveis-realizadas-por-empresas-diretamente-para-oscs/)
- A empresa deve manter arquivada, por no mínimo 5 anos, uma declaração da entidade beneficiária no modelo exigido pela Receita Federal (conforme IN SRF nº 87/96), afirmando que aplicará os recursos em seus fins sociais, além de cópias de notas fiscais de aquisição (ou custo de fabricação/valor residual contábil no caso de bens usados) — [Escola Aberta do 3º Setor](https://escolaaberta3setor.org.br/sebrades-artigos/as-doacoes-dedutiveis-realizadas-por-empresas-diretamente-para-oscs/)

### Inferences
- O ponto central de risco fiscal não é "ter um recibo qualquer", mas garantir que o **tipo de doação** (fundo de incentivo vs. doação direta a OSC vs. patrocínio cultural) seja lançado no LALUR de forma tecnicamente correta — um erro comum seria tratar doação a fundo de incentivo como despesa dedutível (errado) em vez de adição ao lucro + dedução do imposto devido.
- Um produto de software para esse nicho precisaria, no mínimo, diferenciar essas três modalidades de incentivo (dedução da base de cálculo vs. dedução direta do imposto devido) para orientar o lançamento contábil corretamente.

### Gaps
- Não encontrei menção explícita a obrigações via **e-Financeira** relacionadas a doações incentivadas — a e-Financeira parece ser voltada primariamente a operações financeiras/bancárias, não a doações a fundos sociais; não há evidência de que doações precisem ser reportadas nesse demonstrativo específico. Isso deveria ser confirmado com um contador ou diretamente no Manual da ECF/e-Financeira da Receita Federal, que não pude acessar diretamente nesta pesquisa.
- Não obtive o texto integral do Manual da ECF da Receita Federal detalhando os códigos de conta/registros específicos usados para lançar cada tipo de doação incentivada (FIA, Idoso, PRONON/PRONAS, Rouanet) no e-Lalur.

---

## 2. Que tipo de recibo/comprovante a ONG ou fundo precisa emitir para a empresa doadora?

### Takeaway
Não existe um único "modelo oficial nacional" de recibo — cada lei de incentivo e cada fundo (muitas vezes municipal/estadual) define seu próprio formato, mas todos convergem em exigir: CNPJ do fundo/entidade, identificação do doador (nome/razão social e CNPJ), valor e data da doação, e, quando a doação é direcionada a um projeto específico, o número do projeto aprovado pelo conselho gestor (ex.: CMDCA para FIA) ou o número do processo no sistema federal (SALIC para Rouanet, sistema do FNS para PRONON/PRONAS). Para doações diretas a OSCs, o comprovante exigido pela Receita é uma declaração da entidade no modelo da IN SRF 87/96 — não um "recibo" no sentido comum.

### Cited Findings
- No Fundo Municipal da Criança e Adolescente, a equipe administrativa emite e envia o recibo a cada doador no endereço cadastrado no sistema quando o comprovante de pagamento é gerado — [Comunicado Fiorilli sobre FUMCAD](https://fiorilli.com.br/comunicados/294-utilizacao-dos-recursos-do-fumcad-uso-direto-e-indireto)
- O Fundo Municipal emite recibos em nome do doador para que sejam incluídos na Declaração Anual do Imposto de Renda; para doações via FIA os dados exigidos incluem nome/razão social, endereço, telefone e CNPJ ou CPF do doador — [CRCSC](https://www.crcsc.org.br/noticia/view/46860/saiba-como-destinar-recursos-via-fia-por-meio-da-sua-declaracao-de-imposto-de-renda), [ICOM Floripa](https://www.icomfloripa.org.br/saiba-como-destinar-recursos-via-fia-por-meio-da-sua-declaracao-de-imposto-de-renda/)
- Doações direcionadas a um projeto específico só podem ser destinadas a projetos aprovados pelo Conselho Municipal dos Direitos da Criança e do Adolescente (CMDCA) e que possuam Certificado de Captação de Recursos do Fundo da Criança e Adolescência — [ICOM Floripa](https://www.icomfloripa.org.br/saiba-como-destinar-recursos-via-fia-por-meio-da-sua-declaracao-de-imposto-de-renda/)
- Existe um modelo oficial de recibo de doação disponibilizado pelo Ministério do Desenvolvimento Social (recibo-modelo-2020.doc), no contexto da Lei de Incentivo ao Esporte — um documento padronizado que outras leis de incentivo seguem em estrutura similar — [Portal gov.br/mds](https://www.gov.br/mds/pt-br/acoes-e-programas/outros/lei-de-incentivo-ao-esporte/arquivos/modelos-de-declaracao/recibo-modelo-2020.doc)
- Para doações diretas a OSCs, a entidade receptora deve fornecer uma declaração seguindo o modelo exigido pela Receita Federal (IN SRF 87/96), atestando que aplicará os recursos em seus fins sociais — este documento (não um recibo comum) é o que sustenta a dedutibilidade — [Escola Aberta do 3º Setor](https://escolaaberta3setor.org.br/sebrades-artigos/as-doacoes-dedutiveis-realizadas-por-empresas-diretamente-para-oscs/)
- Para a Receita Federal, ao declarar o IR (pessoa física, mas o princípio de comprovação é análogo), é preciso ter os "dados do recibo de doação: valor, nome da instituição e CNPJ"; DARFs pagos até a data-limite de entrega da declaração também servem como recibo de doação — [IDIS](https://www.idis.org.br/como-doar-utilizando-incentivos-fiscais/)

### Inferences
- Como cada fundo municipal/estadual (FIA/FUMCAD) tem seu próprio processo e formato de recibo, uma plataforma que centraliza doações precisaria manter um cadastro atualizado de CNPJs de fundos por município — não há uma "fonte única da verdade" nacional. Isso é uma dor real de mercado (fragmentação) que uma plataforma poderia resolver.
- O comprovante bancário (transferência) + o recibo/declaração formal da entidade são sempre necessários **em conjunto** — nenhum dos dois isoladamente basta perante fiscalização.

### Gaps
- Não encontrei o texto completo da IN SRF nº 87/96 nem uma reprodução do modelo oficial de declaração de OSC para conferir os campos exatos exigidos — recomenda-se buscar diretamente no site da Receita Federal (normas.receita.fazenda.gov.br).
- Não confirmei se existe um modelo oficial nacional específico do FIA análogo ao da Lei de Incentivo ao Esporte (o modelo encontrado é do MDS para esporte, não da Criança e Adolescente) — parece que cada município define seu próprio, o que é uma lacuna de padronização confirmada indiretamente.

---

## 3. Quais os prazos (doação no ano-calendário, e como/quando a empresa declara)?

### Takeaway
A doação precisa ser efetivamente paga (saída de caixa) até 31 de dezembro do ano-calendário para valer como dedução do IRPJ devido naquele exercício; empresas no Lucro Real recolhem o IRPJ mensalmente por estimativa (se optarem pela apuração anual) ou trimestralmente (se optarem pela apuração trimestral), mas o efeito da dedução por doação incentivada é normalmente ajustado/consolidado na apuração anual/no ajuste do balanço de encerramento, e formalmente reportado à Receita Federal via ECF no ano seguinte.

### Cited Findings
- A doação deve ser feita até o último dia de dezembro do ano-calendário para ser deduzida, no limite do teto aplicável, na apuração do IR do exercício — [Regras para empresas e PFs — PDF via Squarespace](https://static1.squarespace.com/static/56b10ce8746fb97c2d267b79/t/5ace4a1c03ce64a75c6fe625/1523468830510/Regras+para+as+empresas++e+PFs+realizarem+doa%C3%A7%C3%B5es+incentivadas.pdf)
- Doações a fundos de direitos da criança e do adolescente podem ser feitas por empresas até dezembro para contarem no exercício — [MPPR](https://mppr.mp.br/Noticia/Doacoes-de-empresas-ao-Fundo-da-Crianca-podem-ser-feitas-ate-dezembro)
- O IRPJ é apurado com base no lucro real por períodos trimestrais (encerrados em 31/03, 30/06, 30/09 e 31/12), mas o contribuinte no Lucro Real pode optar por apuração anual, recolhendo mensalmente o imposto por estimativa — [Portal Tributário — Balanço Trimestral](https://www.portaltributario.com.br/guia/balanco-trimestral.htm)
- O dinheiro precisa ter efetivamente saído do caixa da empresa no ano em questão: se a despesa foi registrada em dezembro do ano 1 mas o pagamento ocorreu em janeiro do ano 2, o valor só pode ser excluído no LALUR do ano 2, quando o pagamento é feito — ou seja, o que vale para o exercício fiscal é a data do desembolso, não da intenção/registro contábil — [Mauro Negruni](https://mauronegruni.com.br/2019/09/14/contribuicoes-e-doacoes-dedutiveis-no-lucro-real/)

### Inferences
- Para empresas que apuram trimestralmente, é possível (e comum) fazer doações ao longo de cada trimestre e deduzir na apuração daquele trimestre, mas o mais frequente na prática de doação incentivada corporativa é concentrar a decisão de doação no fim do ano-calendário (novembro/dezembro), quando a empresa já sabe seu lucro real projetado e o IR devido — o que cria uma janela de "corrida de dezembro" repetida ano a ano, uma dor de mercado relevante (deadline-driven behavior).
- A declaração formal à Receita (ECF) acontece meses depois do fechamento do exercício (a ECF anual tem prazo de entrega em torno de julho do ano seguinte) — portanto a empresa precisa reter e organizar a documentação da doação por muitos meses antes de "prestar contas" fiscalmente.

### Gaps
- Não localizei a data exata de entrega da ECF (o prazo típico é aproximadamente 31 de julho do ano seguinte, mas isso não foi confirmado com uma fonte direta nesta pesquisa) — deveria ser verificado diretamente no Manual da ECF da Receita Federal.
- Não encontrei detalhamento se, no caso de apuração trimestral, o limite de dedução (1% IRPJ, por exemplo) é aplicado por trimestre ou apenas na consolidação anual — ponto que precisaria ser esclarecido com um contador tributarista antes de qualquer implementação de produto que calcule "limite disponível".

---

## 4. O que acontece se a empresa não guardar a documentação corretamente — há fiscalização ativa, glosas comuns?

### Takeaway
Sim: a Receita Federal pode "glosar" (rejeitar) a dedução se a empresa não comprovar documentalmente a doação, tratando o valor então como despesa/dedução indevida, o que gera autuação, cobrança do imposto que deixou de ser pago com multa e juros. Os requisitos gerais de qualquer despesa dedutível — ser normal, usual, necessária, e ter comprovação documental — se aplicam com rigor a doações, que já partem de uma presunção mais restritiva por serem "atos de liberalidade".

### Cited Findings
- A glosa fiscal é a rejeição de despesas ou créditos fiscais pela administração tributária quando identifica inconsistências ou irregularidades nas informações apresentadas — [Classe A Contábil — O que é Glosa Fiscal](https://classeacontabil.com.br/glossario/o-que-e-glosa-fiscal/)
- Entre os motivos mais comuns de glosa estão a falta de documentação comprobatória, a apresentação de despesas não dedutíveis segundo a legislação vigente, ou inconsistência entre os dados apresentados — [Classe A Contábil](https://classeacontabil.com.br/glossario/o-que-e-glosa-fiscal/)
- Os gastos precisam ser normais para o tipo de operação e ter comprovação documental para reduzir a base de cálculo do IRPJ e da CSLL — princípio geral de dedutibilidade que se aplica também às doações — [Omie — despesas dedutíveis no Lucro Real](https://www.omie.com.br/blog/despesas-dedutiveis-no-lucro-real/)
- A declaração da entidade beneficiária (modelo IN SRF 87/96) deve ser fornecida à empresa doadora, que deverá mantê-la arquivada para eventual fiscalização; ela não substitui o comprovante bancário, o recibo da doação, e os registros contábeis da operação — ou seja, são exigências cumulativas, não alternativas — [Escola Aberta do 3º Setor](https://escolaaberta3setor.org.br/sebrades-artigos/as-doacoes-dedutiveis-realizadas-por-empresas-diretamente-para-oscs/)
- Existe jurisprudência administrativa (CARF/Ministério da Fazenda) tratando de disputas envolvendo dedutibilidade de despesas em processos de fiscalização — indicando que a autuação e a disputa administrativa sobre dedutibilidade são uma realidade recorrente no contencioso tributário brasileiro — [Acórdão CARF/Ministério da Economia](https://acordaos.economia.gov.br/acordaos2/pdfs/processados/19515006239200968_7293031.pdf)

### Inferences
- Como as doações não são despesa "necessária à atividade" por natureza, elas atraem escrutínio adicional em auditorias — a documentação (recibo + comprovante bancário + declaração da entidade + registro contábil correto no LALUR) funciona como um "pacote mínimo de defesa" em caso de fiscalização.
- Isso sugere forte demanda de mercado por uma solução que **automatize a guarda e organização centralizada** desse pacote documental (recibo + comprovante + declaração + lançamento sugerido), já que hoje isso parece disperso entre e-mails, PDFs soltos e controles manuais das empresas doadoras.

### Gaps
- Não encontrei estatísticas públicas ou notícias específicas sobre o volume de autuações/glosas da Receita Federal relacionadas especificamente a doações incentivadas (FIA, Rouanet, etc.) — apenas o princípio geral de dedutibilidade e o conceito de glosa fiscal. Uma busca direcionada em decisões do CARF especificamente sobre "doação a fundo da criança" ou "Lei Rouanet" traria mais precisão, mas não foi aprofundada nesta pesquisa por limite de tempo/escopo.

---

## 5. Plataformas/produtos existentes no Brasil (benchmarking)

### Takeaway
O mercado brasileiro tem várias iniciativas que **conectam** doadores/empresas a projetos incentivados ou fazem gestão de investimento social privado, mas nenhuma das pesquisadas confirma publicamente uma funcionalidade completa de "emissão automatizada de recibo fiscal + verificação de certificação + cálculo de limite de dedução + relatório pronto para ECF" em um único produto self-service e transparente sobre preço. A oferta se divide em: (a) portais que listam/conectam projetos incentivados por lei (Portal do Incentivo, Quero Incentivar, Incentivadores.com.br), (b) institutos que fazem curadoria e acompanhamento de filantropia estratégica cobrando como consultoria/assessoria (Instituto Phi, Comunitas), (c) braços de responsabilidade social de grandes corporações que operam suas próprias verbas de incentivo (B3 Social, Ambev patrocínios), e (d) plataformas de ESG corporativo mais amplas que tangenciam o tema de rastreabilidade de recursos e relatórios (ex.: "IMPACTO"/goimpacto.com).

### Cited Findings
- **Portal do Incentivo**: plataforma que apresenta e explica leis de incentivo (Lei Rouanet, FIA/FUMCAD) para visitantes/doadores, funcionando como um canal informativo/conector entre empresas e projetos incentivados — [Portal do Incentivo — Lei Rouanet](https://portaldoincentivo.com.br/visitors/how_encourage/1); a página consultada não detalha automação de recibo, verificação de certificação, cálculo de limite ou modelo de cobrança — informação não disponível publicamente na página analisada.
- **Quero Incentivar**: outro portal dedicado a leis de incentivo, incluindo página específica sobre FUMCAD — [Quero Incentivar — FUMCAD](http://queroincentivar.com.br/leis-de-incentivo/fumcad/) (página não pôde ser acessada nesta pesquisa por erro de DNS/rede; conteúdo não verificado diretamente).
- **Instituto Phi ("Filantropia Inteligente")**: assessora pessoas físicas e empresas a planejar estrategicamente sua filantropia, fortalecendo a gestão de projetos sociais e culturais; desde 2014 já direcionou mais de R$ 232 milhões para 2.060 projetos, envolvendo mais de 3,1 milhões de pessoas; acompanha doações com relatórios e prestação de contas — [Instituto Phi](https://phi.org.br/), [Atados — Instituto Phi](https://www.atados.com.br/ong/instituto-phi)
- **B3 Social**: braço da B3 S.A. responsável por destinar recursos incentivados da empresa e suas afiliadas via Lei de Incentivo ao Esporte, Fundos da Criança e do Adolescente, Fundos do Idoso e outros programas sociais, selecionando e financiando projetos via doação direta ou leis de incentivo fiscal — [B3 Social](https://www.b3.com.br/pt_br/b3/b3-social/investimento-social-privado/)
- **Comunitas**: organização que promove "co-investimento" para ampliar e compartilhar o impacto do investimento social entre múltiplos financiadores — [Comunitas](https://comunitas.org.br/co-investimento-amplia-e-compartilha-impacto-do-investimento-social/)
- **"Investir com Impacto"**: plataforma digital lançada pela Aliança Pelos Investimentos e Negócios de Impacto (com o Fundo Vale como parceiro estratégico) para reunir informações sobre fundos de investimento de impacto, plataformas de crowdfunding e outras oportunidades de investimento com propósito no Brasil — foco mais em investimento de impacto que em doação incentivada fiscal — [Fundo Vale](https://www.fundovale.org/noticia/alianca-pelos-investimentos-e-negocios-de-impacto-lancara-a-plataforma-investir-com-impacto/), [Investir com Impacto](https://investircomimpacto.org.br/sobre/)
- **"IMPACTO" (goimpacto.com)**: plataforma ESG para empresas com dashboard modular, relatórios dinâmicos, rastreabilidade de recursos desde o investimento até resultados, relatórios de sustentabilidade alinhados a normas como CVM 193 (Brasil) e CSRD (UE), e integração com OSCs para recebimento de recursos com comprovantes financeiros; o site não especifica explicitamente emissão de recibo de doação, verificação de certificação de ONGs, ou cálculo de limite de dedução fiscal, e não divulga publicamente seu modelo de preços (oferece apenas agendamento de demonstração) — [goimpacto.com](https://goimpacto.com/)
- **SouDoador (Instituto Sou Doador)**: NÃO é uma plataforma de doação incentivada fiscal a fundos/projetos — é uma OSC fundada em 2016 dedicada à conscientização sobre doação de órgãos e tecidos no Brasil, com foco educacional e legislativo (ex.: "Lei Tatiane") — não deve ser usada como referência de produto para este nicho fiscal — [soudoador.org](https://soudoador.org/)
- **Rede Filantropia / Doare / Jeito de Ajudar**: plataformas adjacentes de captação de recursos para o Terceiro Setor de forma geral (não especificamente incentivo fiscal): Rede Filantropia foca em disseminação de conhecimento técnico/profissionalização do setor; Doare oferece solução integrada de pagamentos, recorrência, CRM, relatórios e campanhas para ONGs; Jeito de Ajudar (da Yabá Consultoria, desde 2018) é inserida no site de empresas para centralizar pedidos de doação de ONGs em um único canal — [Diário do Comércio](https://diariodocomercio.com.br/negocios/plataformas-incentivam-doacao-arrecadacao-ongs/), [Rede Filantropia](https://filantropia.ong/), [Doare](https://doare.org/)

### Inferences
- Nenhuma das plataformas pesquisadas parece resolver de ponta a ponta o problema fiscal específico (emissão de recibo com valor fiscal + cálculo automático do limite de dedução disponível + relatório pronto para lançamento em ECF): as que existem são ou (a) portais de descoberta/conexão entre doador e projeto (Portal do Incentivo, Quero Incentivar), (b) consultorias de filantropia estratégica que cobram por assessoria personalizada (Instituto Phi, Comunitas), ou (c) plataformas ESG genéricas de rastreabilidade e relatório de sustentabilidade (IMPACTO/goimpacto) que não são focadas no aspecto tributário/fiscal da dedução.
- Isso indica uma lacuna real de mercado: parece não haver, entre as fontes públicas consultadas, um produto brasileiro amplamente divulgado que automatize simultaneamente (i) verificação de que o fundo/projeto está certificado e apto a receber, (ii) cálculo em tempo real do limite de dedução ainda disponível para aquela empresa naquele exercício, e (iii) geração de um relatório estruturado pronto para a contabilidade lançar na ECF.
- Nenhuma das fontes consultadas foi explícita sobre modelo de cobrança (gratuito vs. comissão vs. mensalidade) das plataformas conectoras — os sites analisados (Portal do Incentivo, goimpacto) não divulgam preços publicamente, sugerindo que a monetização provavelmente ocorre via contato comercial direto/demonstração, não de forma transparente e self-service.

### Gaps
- Não consegui acessar o conteúdo completo de "Quero Incentivar" (erro de DNS na tentativa de fetch) — recomenda-se nova tentativa de acesso direto ou busca por cache/redes sociais da plataforma.
- Não encontrei fontes específicas e verificadas sobre "Página 3 Filantropia" nem sobre "GivenGain" no contexto brasileiro — apesar de buscas direcionadas, não retornaram resultados relevantes; é possível que "Página 3 Filantropia" tenha nome ligeiramente diferente do usado nesta pesquisa, ou tenha presença pequena/não indexada. Recomenda-se busca adicional direta no nome exato ou verificação se o nome foi lembrado corretamente.
- Não confirmei modelo de monetização (gratuito/comissão/mensalidade) de nenhuma das plataformas — é uma lacuna relevante para o benchmarking de produto solicitado; exigiria contato direto ou análise de termos de uso/contratos de cada plataforma.

---

## 6. Iniciativas de responsabilidade social/ESG de grandes empresas brasileiras (Ambev, Itaú, Natura)

### Takeaway
Grandes empresas como Ambev operam patrocínios/doações via leis de incentivo (cultura, esporte, fundos da criança/idoso) através de políticas internas de patrocínio que filtram projetos por objetivos estratégicos da marca antes de aprovar o incentivo, e publicam parte disso em relatórios de sustentabilidade/ESG anuais — mas o conteúdo público sobre como internamente elas comprovam e gerenciam essa documentação fiscal (que tipo de relatório o setor de compliance/contabilidade exige) não veio detalhado nas fontes encontradas nesta pesquisa.

### Cited Findings
- A Ambev possui uma política de patrocínio para projetos que podem se beneficiar de incentivos fiscais em áreas social, cultural e esportiva; apenas projetos que atendem a um ou mais objetivos da companhia, respeitam as regras da política e cumprem a regulamentação das diferentes modalidades de incentivo fiscal são selecionados — [Ambev — Patrocínio](https://www.ambev.com.br/sustentabilidade/patrocinio/)
- A Ambev publica Relatório de Sustentabilidade/ESG anual (ex.: Relatório ESG 2022, Relatório de Sustentabilidade 2024) como parte de sua comunicação institucional de resultados socioambientais — [Ambev — Relatório ESG 2022 (PDF)](https://www.ambev.com.br/sites/g/files/wnfebl5836/files/2023-05/Relato%CC%81rio%20ESG%202022_0.pdf), [BEON/FSB sobre Relatório Ambev 2024](https://www.beon.fsb.com.br/portfolio/ambev-relatorio-de-sustentabilidade-2024/)
- A Natura &Co publica Relatório Integrado anual consolidando dados financeiros e não financeiros (ESG) do grupo — [Relatório Integrado Natura &Co 2024 (PDF)](https://images.rede.natura.net/html/relatorio-anual/2024/Relatorio-IntegradoNatura-e-Co-2024.pdf)
- O Itaú aparece como patrocinador de projetos culturais via Lei Rouanet (referência pontual encontrada em publicação de terceiro/rede social, sem detalhamento de processo interno) — [Facebook/Ibeac](https://www.facebook.com/ibeac/videos/com-o-patroc%C3%ADnio-do-ita%C3%BA-por-meio-da-lei-de-incentivo-%C3%A0-cultura-lei-rouanet-em-2/1521964955012563/)

### Inferences
- O fato de que apenas a política de patrocínio (critérios de seleção) é comunicada publicamente, e não o processo de controle documental/fiscal interno, sugere que esse conhecimento operacional (como o compliance/contabilidade de uma Ambev, por exemplo, organiza e audita internamente os recibos e lançamentos de centenas de doações incentivadas) é tratado como informação interna/proprietária, não divulgada em relatórios de sustentabilidade voltados a stakeholders externos — o que é uma lacuna esperada para uma pesquisa baseada em fontes públicas.

### Gaps
- Não consegui obter, a partir de fontes públicas, o desenho do processo interno de compliance/contabilidade dessas empresas para gerenciar e comprovar suas doações incentivadas (isso normalmente não é divulgado externamente por ser processo operacional interno). Para aprofundar esse ponto seria necessário entrevistar profissionais de contabilidade/compliance dessas empresas diretamente, ou revisar notas explicativas de demonstrações financeiras auditadas (não analisadas nesta pesquisa).
- Não obtive dados quantitativos específicos de quanto a Ambev, Itaú ou Natura destinam anualmente via cada lei de incentivo especificamente (os relatórios de sustentabilidade completos não foram lidos na íntegra nesta pesquisa por limitação de tempo/escopo) — recomenda-se leitura direta dos PDFs de relatório de sustentabilidade/ESG linkados acima para extrair valores específicos, caso necessário para o relatório final.

---

## 7. Perguntas-chave

### Pergunta: Existe algum jeito de uma plataforma de terceiros (não o governo) emitir/validar reciprocamente um "recibo de doação dedutível" com valor fiscal real, ou isso sempre vem do fundo público/órgão gestor?

### Takeaway
Pelas fontes consultadas, o recibo/comprovante com valor fiscal para fins de dedução **sempre precisa ser emitido pela entidade legalmente beneficiária** da doação (o fundo público gestor — ex. FIA/FUMCAD municipal — no caso de fundos de incentivo, ou a própria OSC receptora, seguindo o modelo da IN SRF 87/96, no caso de doação direta). Não há evidência nas fontes pesquisadas de que uma plataforma terceira privada possa emitir ou substituir esse documento com valor fiscal — o papel de uma plataforma terceira seria o de **intermediar, organizar e facilitar** a coleta/organização desses documentos emitidos pela entidade oficial, não de emiti-los ela própria.

### Cited Findings
- O recibo do FUMCAD é emitido pela própria equipe administrativa do fundo (CPFO — Comissão Permanente de Finanças e Orçamento) e enviado ao doador — não por terceiros — [Fiorilli — Comunicado FUMCAD](https://fiorilli.com.br/comunicados/294-utilizacao-dos-recursos-do-fumcad-uso-direto-e-indireto)
- Para doações diretas a OSCs, a declaração que sustenta a dedutibilidade segue modelo exigido pela própria Receita Federal (IN SRF 87/96) e deve ser fornecida pela entidade beneficiária — não por um intermediário — [Escola Aberta do 3º Setor](https://escolaaberta3setor.org.br/sebrades-artigos/as-doacoes-dedutiveis-realizadas-por-empresas-diretamente-para-oscs/)
- Projetos culturais (Lei Rouanet) só podem captar recursos incentivados após aprovação e registro no Sistema de Apoio às Leis de Incentivo à Cultura (SALIC), sistema oficial do Ministério da Cultura — reforçando que a validação/autorização de captação passa por órgão público, não por plataforma privada — [Portal do Incentivo](https://portaldoincentivo.com.br/visitors/how_encourage/1)

### Inferences
- O espaço de produto para uma plataforma privada nesse mercado está em **facilitar a descoberta de projetos certificados, automatizar o cálculo do limite de dedução disponível, e centralizar/organizar os documentos oficiais emitidos pelos fundos/OSCs** — não em substituir a emissão do recibo oficial, que continua sendo prerrogativa do órgão gestor ou da entidade beneficiária.

### Gaps
- Não encontrei uma fonte jurídica primária (lei ou instrução normativa) que declare explicitamente e de forma categórica a proibição/impossibilidade de emissão de recibo fiscal por terceiro — a conclusão acima é uma inferência razoável a partir de como o processo é descrito nas fontes, mas não uma citação direta de uma norma que diga "somente o fundo/entidade pode emitir". Recomenda-se validação jurídica antes de tomar isso como certeza absoluta para decisões de produto.

### Pergunta: Que dados mínimos um relatório para a contabilidade da empresa doadora precisaria ter para lançar isso corretamente na ECF?

### Takeaway
Com base nos requisitos de comprovação documental encontrados, um relatório mínimo viável para a contabilidade da empresa doadora precisaria reunir: identificação completa da entidade/fundo beneficiário (nome e CNPJ), tipo de incentivo/lei aplicável (FIA, Fundo do Idoso, PRONON/PRONAS, Lei Rouanet, doação direta a OSC), número do projeto/processo aprovado quando aplicável, valor e data efetiva do desembolso (comprovante bancário), o recibo/declaração oficial emitido pela entidade (no modelo exigido pela Receita, quando for o caso), e a indicação de como classificar contabilmente o lançamento — se é adição ao LALUR com dedução direta do imposto devido (fundos/PRONON/PRONAS/Rouanet) ou despesa dedutível limitada a % do lucro operacional (doação direta a OSC).

### Cited Findings
- A declaração da entidade deve ser fornecida à empresa doadora, que deve mantê-la arquivada para eventual fiscalização, e ela não substitui o comprovante bancário, o recibo da doação, e os registros contábeis da operação — evidenciando que múltiplos documentos são exigidos em conjunto, não um único relatório — [Escola Aberta do 3º Setor](https://escolaaberta3setor.org.br/sebrades-artigos/as-doacoes-dedutiveis-realizadas-por-empresas-diretamente-para-oscs/)
- Ao declarar doações, os dados mínimos citados são: valor, nome da instituição e CNPJ — [IDIS](https://www.idis.org.br/como-doar-utilizando-incentivos-fiscais/)
- O tratamento contábil correto depende do tipo de doação: para fundos de incentivo (FIA), o valor é adicionado ao LALUR e a dedução ocorre diretamente do IRPJ devido (limite de 1%); a distinção entre lançamento como "adição no LALUR + dedução do imposto devido" versus "despesa operacional dedutível limitada a % do lucro" é o dado-chave que a contabilidade precisa saber para cada doação — [Mauro Negruni](https://mauronegruni.com.br/2019/09/14/contribuicoes-e-doacoes-dedutiveis-no-lucro-real/), [Escola Aberta do 3º Setor](https://escolaaberta3setor.org.br/sebrades-artigos/as-doacoes-dedutiveis-realizadas-por-empresas-diretamente-para-oscs/)

### Inferences
- Um relatório de referência para a contabilidade deveria conter, no mínimo, estes campos estruturados por doação: (1) CNPJ e nome do fundo/entidade beneficiária, (2) lei/programa de incentivo aplicável, (3) número do projeto/processo aprovado (quando houver), (4) data do desembolso efetivo, (5) valor doado, (6) comprovante bancário anexado, (7) recibo/declaração oficial anexado, (8) classificação contábil sugerida (adição ao LALUR + % dedução do IRPJ, ou despesa dedutível até % do lucro operacional), e (9) o limite de dedução acumulado já utilizado pela empresa naquele exercício para aquela modalidade específica (para controle de teto).

### Gaps
- Não encontrei um "checklist oficial" publicado pela Receita Federal especificamente destinado a contadores para o lançamento de doações incentivadas na ECF — o que existe são orientações fragmentadas em artigos de blogs contábeis e explicações gerais sobre LALUR. Uma busca mais aprofundada diretamente no Manual da ECF (Perguntas e Respostas do SPED) da Receita Federal, não realizada com profundidade suficiente nesta pesquisa, poderia preencher essa lacuna com uma fonte primária mais autoritativa.
