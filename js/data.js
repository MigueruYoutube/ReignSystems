/* ============================================================
   RPG System — data.js
   Bancos de dados usados pelos geradores de NPC e Item.
   Tudo aqui é conteúdo estático (texto/tabelas); a lógica de
   sorteio fica em npc.js / items.js, usando RPG.util (core.js).
   ============================================================ */

window.RPGData = (function () {

  /* ---------- Nomes de NPC ---------- */
  const firstNamesM = ["Aldric","Bram","Cedric","Dorian","Elric","Fenwick","Gareth","Hadrian","Ivo","Joren",
    "Kael","Lucan","Magnus","Nolan","Orin","Peron","Quirin","Ragnar","Soren","Thaddeus",
    "Ulric","Varian","Wendell","Yorick","Zephyr","Baltasar","Caspian","Darian","Emeric","Finnegan"];
  const firstNamesF = ["Aveline","Brianna","Celestine","Dahlia","Elowen","Freya","Giselle","Helena","Isolde","Junia",
    "Kyra","Liora","Morgana","Nerissa","Odalys","Persephone","Quintessa","Ravena","Seraphina","Thessaly",
    "Ulla","Viviane","Wren","Xanthe","Ysolde","Zara","Brielle","Cassia","Delphine","Evadne"];
  const surnames = ["Corvenoite","Bellamor","Duskhollow","Emberfall","Frostvane","Grimscar","Hallowmere","Ironwake",
    "Karthon","Lysander","Moonshade","Nightbrook","Oakenfeld","Pyrrhan","Quenneval","Ravensworth",
    "Silverthorn","Thornwood","Ulfheim","Valemourn","Wintercress","Ashgrove","Blackmire","Cinderfell",
    "Dravensworth","Eldermoss","Falkenrath","Greywick","Hollowvane","Vaelthorne"];
  const epithets = ["o(a) Silencioso(a)","o(a) Implacável","das Mil Cicatrizes","o(a) Sem-Nome","o(a) Justo(a)",
    "o(a) Corvo","a Lâmina Partida","o(a) Andarilho(a)","o(a) Maldito(a)","a Chama Viva",
    "o(a) Errante","das Sombras Longas","o(a) Fiel","o(a) Traidor(a)","a Tempestade"];

  /* ---------- Aparência de NPC (pt/en pareados) ---------- */
  const alturas = [
    {pt:"baixo(a) e ágil", en:"short and nimble build"},
    {pt:"de estatura mediana", en:"average height"},
    {pt:"alto(a) e imponente", en:"tall, imposing stature"},
    {pt:"excepcionalmente alto(a), quase intimidador(a)", en:"exceptionally tall, almost intimidating"},
    {pt:"pequeno(a) e de movimentos rápidos", en:"small frame, quick movements"}
  ];
  const compleicoes = [
    {pt:"magro(a) e ágil", en:"lean and agile physique"},
    {pt:"atlético(a) e musculoso(a)", en:"athletic, muscular physique"},
    {pt:"robusto(a) e corpulento(a)", en:"broad and heavyset build"},
    {pt:"esguio(a) e elegante", en:"slender, elegant frame"},
    {pt:"marcado(a) por cicatrizes de batalha", en:"battle-scarred, hardened body"}
  ];
  const peles = [
    {pt:"pele pálida como mármore", en:"marble-pale skin"},
    {pt:"pele morena dourada", en:"golden tan skin"},
    {pt:"pele escura e reluzente", en:"dark, glowing skin"},
    {pt:"pele acinzentada, quase pétrea", en:"ashen, stone-grey skin"},
    {pt:"pele com um leve brilho azulado", en:"skin with a faint bluish sheen"},
    {pt:"pele bronzeada por anos ao sol", en:"weathered, sun-bronzed skin"}
  ];
  const cabelos = [
    {pt:"cabelos negros longos e lisos", en:"long straight black hair"},
    {pt:"cabelos brancos como neve, curtos e bagunçados", en:"short messy snow-white hair"},
    {pt:"cabelos ruivos presos em uma trança firme", en:"red hair in a tight braid"},
    {pt:"cabelos prateados ondulados até os ombros", en:"wavy silver hair to the shoulders"},
    {pt:"careca, com tatuagens tribais no couro cabeludo", en:"bald head with tribal scalp tattoos"},
    {pt:"cabelos castanho-escuros em dreadlocks", en:"dark brown dreadlocks"},
    {pt:"cabelos verde-musgo curtos e espetados", en:"short spiky moss-green hair"},
    {pt:"cabelos dourados longos, quase até a cintura", en:"long golden hair down to the waist"}
  ];
  const olhos = [
    {pt:"olhos verdes penetrantes", en:"piercing green eyes"},
    {pt:"olhos azuis gélidos", en:"icy blue eyes"},
    {pt:"olhos âmbar dourados", en:"golden amber eyes"},
    {pt:"olhos violeta incomuns", en:"unusual violet eyes"},
    {pt:"olhos heterocromáticos — um azul, um castanho", en:"heterochromatic eyes, one blue one brown"},
    {pt:"olhos completamente negros, sem íris visível", en:"fully black eyes with no visible iris"},
    {pt:"olhos cinzentos como céu de tempestade", en:"storm-grey eyes"}
  ];
  const marcas = [
    {pt:"uma cicatriz atravessando a sobrancelha esquerda", en:"a scar crossing the left eyebrow"},
    {pt:"tatuagens rúnicas subindo pelo braço direito", en:"runic tattoos climbing the right arm"},
    {pt:"uma marca de nascença em forma de estrela no pescoço", en:"a star-shaped birthmark on the neck"},
    {pt:"um olho coberto por um tapa-olho de couro gasto", en:"a worn leather eyepatch over one eye"},
    {pt:"piercings de metal ao longo da orelha", en:"metal piercings along the ear"},
    {pt:"uma queimadura antiga na lateral do rosto", en:"an old burn scar on the side of the face"},
    {pt:"pele impecável, sem marcas visíveis", en:"flawless skin with no visible marks"}
  ];
  const roupas = [
    {pt:"armadura de couro reforçada com fivelas de bronze", en:"reinforced leather armor with bronze buckles"},
    {pt:"robes escuros bordados com runas prateadas", en:"dark robes embroidered with silver runes"},
    {pt:"trajes de viajante gastos pelo tempo, cheios de remendos", en:"weathered traveler's clothes, patched and worn"},
    {pt:"armadura de placas polida com brasão de família no peito", en:"polished plate armor with a family crest"},
    {pt:"capa esfarrapada sobre roupas simples de camponês", en:"a tattered cloak over simple peasant clothes"},
    {pt:"vestes nobres de tecido fino e bordados dourados", en:"noble garments of fine cloth with gold embroidery"},
    {pt:"couro negro justo, ideal para se mover em silêncio", en:"tight black leather, built for silent movement"}
  ];

  /* ---------- Personalidade por arquétipo ---------- */
  const archetypes = {
    "Herói": {
      traits: [
        "corajoso(a) e leal, sempre pronto(a) para se colocar entre o perigo e os mais fracos",
        "extremamente disciplinado(a) e íntegro(a), guiado(a) por um forte senso de justiça",
        "otimista mesmo diante do desespero, capaz de inspirar quem está por perto",
        "protetor(a) por natureza, encara qualquer ameaça aos seus como um assunto pessoal",
        "determinado(a) além do razoável, raramente desiste de uma causa que julga justa"
      ],
      fears: ["falhar com quem confia nele(a)", "perder as pessoas que ama no processo de salvar outras",
        "não ser forte o suficiente quando mais importa", "repetir um erro do passado que já custou caro",
        "ver seus ideais corromperem-se com o tempo"],
      motivations: ["restaurar a paz em sua terra natal", "redimir um erro que carrega desde a juventude",
        "provar seu valor a quem um dia duvidou dele(a)", "proteger a próxima geração de sofrer o que sofreu",
        "honrar a memória de um mentor ou familiar perdido"],
      speech: ["Fala de forma direta e encorajadora, escolhendo poucas palavras mas sempre firmes.",
        "Usa tom caloroso e confiante, tratando aliados como família mesmo em crise.",
        "Comunica-se com frases curtas de comando quando em combate, mas é gentil fora dele."]
    },
    "Vilão": {
      traits: [
        "brilhante e calculista, sempre um passo à frente de todos ao redor",
        "cruel de forma fria e deliberada, vendo a compaixão como fraqueza",
        "carismático(a) o suficiente para atrair seguidores fiéis à própria causa",
        "obcecado(a) por controle, incapaz de tolerar o que não pode prever",
        "movido(a) por um senso de superioridade que justifica qualquer método"
      ],
      fears: ["perder o poder que tanto custou a conquistar", "ser esquecido(a) pela história",
        "revelar uma fraqueza ou vulnerabilidade antiga", "ser traído(a) pelos próprios seguidores",
        "descobrir que, no fundo, estava errado(a) o tempo todo"],
      motivations: ["dominar completamente uma região ou reino", "vingar-se de quem o(a) humilhou no passado",
        "reescrever as regras de um mundo que o(a) rejeitou", "alcançar um poder que ninguém mais ousou buscar",
        "provar-se superior à figura que um dia o(a) superou"],
      speech: ["Fala de modo eloquente e calculado, escolhendo cada palavra para desestabilizar o ouvinte.",
        "Usa ironia afiada e meias-verdades, sorrindo mesmo ao proferir ameaças.",
        "Tom baixo e controlado, quase nunca eleva a voz — prefere o silêncio como intimidação."]
    },
    "Anti-herói": {
      traits: [
        "pragmático(a) até a amoralidade, faz o que é necessário e lida com as consequências depois",
        "cínico(a) em relação a causas nobres, mas ainda guiado(a) por um código pessoal rígido",
        "solitário(a) por escolha, desconfia de qualquer aliança fácil demais",
        "capaz de grande violência quando necessário, sem o conforto de uma bandeira moral",
        "cansado(a) do mundo, mas incapaz de simplesmente virar as costas para ele"
      ],
      fears: ["tornar-se exatamente aquilo que combate", "voltar a se importar com alguém e perdê-lo(a)",
        "descobrir que seu código pessoal não vale nada quando testado", "ser confundido(a) com os vilões que enfrenta",
        "morrer sem que ninguém sequer perceba a diferença que fez"],
      motivations: ["sobreviver mais um dia, sem grandes ilusões sobre o resto", "seguir um código pessoal de honra, mesmo sem plateia",
        "proteger um pequeno círculo de pessoas, ignorando o resto do mundo", "fechar uma dívida ou promessa antiga",
        "encontrar um motivo para voltar a acreditar em algo"],
      speech: ["Fala pouco, e quando fala usa sarcasmo seco para manter distância emocional.",
        "Tom direto, quase brusco, sem paciência para discursos ou explicações longas.",
        "Costuma responder perguntas com outra pergunta, evitando comprometer-se."]
    },
    "Coadjuvante": {
      traits: [
        "leal até a teimosia, sempre disposto(a) a seguir os amigos onde for preciso",
        "engraçado(a) e caloroso(a), usa o humor para aliviar momentos tensos",
        "confiável e observador(a), nota detalhes que passam despercebidos aos outros",
        "modesto(a) sobre as próprias capacidades, mesmo sendo mais competente do que aparenta",
        "curioso(a) e falante, sempre com uma história ou comentário para compartilhar"
      ],
      fears: ["ser deixado(a) para trás quando a situação piorar", "não ter valor real para o grupo além da companhia",
        "decepcionar quem confia nele(a) em um momento crucial", "ficar sozinho(a) de novo",
        "ser visto(a) apenas como alívio cômico e nunca levado(a) a sério"],
      motivations: ["apoiar o protagonista até o fim da jornada, custe o que custar", "encontrar seu próprio lugar de destaque na história",
        "provar que também é capaz de um grande feito", "manter o grupo unido nos momentos difíceis",
        "viver aventuras suficientes para contar boas histórias depois"],
      speech: ["Fala de forma casual e bem-humorada, com comentários espontâneos até em momentos sérios.",
        "Tom caloroso e informal, trata todos com apelidos carinhosos.",
        "Costuma narrar o que está acontecendo em voz alta, como se comentasse a própria aventura."]
    }
  };

  /* ---------- Forças e fraquezas (gerais) ---------- */
  const strengths = ["Força física bem acima da média","Estrategista nato, sempre um passo à frente em combate",
    "Carisma natural que conquista aliados com facilidade","Resistência mental inabalável sob pressão extrema",
    "Conhecimento vasto sobre táticas e história militar","Lealdade inquestionável a quem considera família",
    "Reflexos rápidos e precisão cirúrgica","Talento raro para se camuflar e agir despercebido(a)",
    "Domínio incomum sobre as próprias emoções em crise","Habilidade natural para negociar e convencer",
    "Memória excepcional para rostos, lugares e detalhes","Instinto de sobrevivência apurado em ambientes hostis",
    "Capacidade de manter a calma quando todos entram em pânico","Habilidade rara com armas pouco convencionais",
    "Intuição afiada para perceber mentiras e armadilhas"];
  const weaknesses = ["Teimosia que leva a decisões precipitadas","Dificuldade genuína em confiar nos outros",
    "Uma ferida emocional antiga que ainda não cicatrizou","Orgulho que impede de pedir ajuda quando precisa",
    "Impulsividade perigosa em momentos de tensão","Certa ingenuidade sobre as reais intenções alheias",
    "Medo paralisante ligado a um trauma específico","Tendência a assumir responsabilidade além do que consegue carregar",
    "Desconfiança de figuras de autoridade, mesmo as bem-intencionadas","Dificuldade em recuar, mesmo quando é a escolha certa",
    "Vício ou hábito que o(a) coloca em risco repetidamente","Lealdade cega que pode ser explorada por quem a conhece",
    "Sarcasmo que afasta pessoas que tentam se aproximar","Um ponto fraco físico específico, herdado ou adquirido"];

  /* ---------- Itens ---------- */
  const itemCategories = ["Arma","Armadura","Acessório","Relíquia"];
  const itemCoreByCategory = {
    "Arma": ["Espada","Machado de Guerra","Adaga","Lança","Cajado","Arco Longo","Martelo de Guerra","Foice"],
    "Armadura": ["Peitoral","Elmo","Escudo","Manto","Grevas","Braçadeiras"],
    "Acessório": ["Anel","Amuleto","Colar","Bracelete","Broche"],
    "Relíquia": ["Relicário","Orbe","Grimório","Totem Ancestral","Fragmento Selado"]
  };
  const itemPrefixes = ["Ancestral","Sombrio(a)","Radiante","Amaldiçoado(a)","Abençoado(a)","Voraz","Silencioso(a)",
    "Eterno(a)","Fragmentado(a)","Corrompido(a)","Vingativo(a)","Sagrado(a)","Glacial","Flamejante"];
  const itemSuffixes = ["do Abismo","da Aurora","dos Ventos Uivantes","da Perdição","do Vazio","da Fênix",
    "das Sombras Longas","do Juízo Final","da Ressurreição","do Caos Primordial","Eterno(a)","Imortal",
    "do Rei Esquecido","da Última Luz"];
  const itemAppearance = [
    {pt:"forjado(a) em um metal escuro que parece absorver a luz ao redor", en:"forged from a dark metal that seems to absorb surrounding light"},
    {pt:"cravejado(a) de gemas que pulsam suavemente como um coração", en:"studded with gems that pulse faintly like a heartbeat"},
    {pt:"coberto(a) por runas antigas que brilham em tom âmbar quando tocado", en:"covered in ancient runes glowing amber when touched"},
    {pt:"envolto(a) em uma névoa fria e constante, mesmo em ambientes quentes", en:"wrapped in a constant cold mist, even in warm places"},
    {pt:"com detalhes dourados desgastados pelo tempo, sinal de idade lendária", en:"with gold details worn by time, a sign of legendary age"},
    {pt:"decorado(a) com penas e ossos entrelaçados em padrões rituais", en:"adorned with feathers and bones woven into ritual patterns"},
    {pt:"de superfície cristalina, quase translúcida, que racha luz em cores", en:"crystalline, nearly translucent surface that splits light into colors"}
  ];

  const rarityOrder = ["Comum","Incomum","Raro","Épico","Lendário","Mítico"];
  const rarityConfig = {
    "Comum":    {color:"#9ca3af", passiveMin:1, passiveMax:2, unit:"pontos", valMin:1, valMax:3,  baseMult:1.0, glow:false},
    "Incomum":  {color:"#4ade80", passiveMin:1, passiveMax:2, unit:"pontos", valMin:2, valMax:5,  baseMult:1.3, glow:false},
    "Raro":     {color:"#4dc9ff", passiveMin:1, passiveMax:3, unit:"pontos", valMin:4, valMax:8,  baseMult:1.7, glow:false},
    "Épico":    {color:"#a855f7", passiveMin:2, passiveMax:4, unit:"%",      valMin:3, valMax:8,  baseMult:2.2, glow:true},
    "Lendário": {color:"#f5a524", passiveMin:3, passiveMax:4, unit:"%",      valMin:6, valMax:15, baseMult:3.0, glow:true},
    "Mítico":   {color:"#ff4d6d", passiveMin:3, passiveMax:5, unit:"%",      valMin:10,valMax:25, baseMult:4.0, glow:true}
  };

  // Passivas com efeito em PONTOS (Comum, Incomum, Raro)
  const passivesPoints = [
    {name:"Vigor Extra", desc:v=>`+${v} pontos de Vitalidade`},
    {name:"Precisão Afiada", desc:v=>`+${v} pontos de Precisão em ataques`},
    {name:"Passo Leve", desc:v=>`+${v} pontos de Velocidade`},
    {name:"Guarda Firme", desc:v=>`+${v} pontos de Resistência`},
    {name:"Fluxo Arcano", desc:v=>`+${v} pontos de Mana`},
    {name:"Mente Clara", desc:v=>`+${v} pontos de Sabedoria`},
    {name:"Força Bruta", desc:v=>`+${v} pontos de Força`},
    {name:"Raciocínio Rápido", desc:v=>`+${v} pontos de Inteligência`},
    {name:"Pele Endurecida", desc:v=>`+${v} pontos de Defesa física`},
    {name:"Foco de Batalha", desc:v=>`+${v} pontos de dano em ataques básicos`},
    {name:"Recuperação Lenta", desc:v=>`Recupera ${v} pontos de Vitalidade a cada rodada de descanso`},
    {name:"Instinto de Combate", desc:v=>`+${v} pontos de iniciativa em combate`}
  ];
  // Passivas com efeito em PORCENTAGEM (Épico, Lendário, Mítico)
  const passivesPercent = [
    {name:"Fúria Crescente", desc:v=>`+${v}% de dano causado quando a Vitalidade está abaixo de 30%`},
    {name:"Reflexo Élfico", desc:v=>`+${v}% de chance de esquivar completamente de um ataque`},
    {name:"Drenar Vida", desc:v=>`Cura ${v}% do dano causado como Vitalidade`},
    {name:"Fúria do Trovão", desc:v=>`${v}% de chance de atordoar o alvo em um acerto crítico`},
    {name:"Casca Espectral", desc:v=>`Reduz em ${v}% o dano físico recebido`},
    {name:"Queimadura Arcana", desc:v=>`Aplica ${v}% de dano contínuo por 3 rodadas ao acertar`},
    {name:"Bênção Prolongada", desc:v=>`+${v}% na duração de todos os efeitos benéficos`},
    {name:"Golpe Fatídico", desc:v=>`+${v}% de chance de acerto crítico`},
    {name:"Escudo Ressonante", desc:v=>`Anula o primeiro golpe recebido a cada ${Math.max(1, Math.round(10/v))} rodadas`},
    {name:"Passo Fantasma", desc:v=>`${v}% de chance de ignorar terreno difícil e armadilhas`},
    {name:"Eco da Alma", desc:v=>`+${v}% de Mana recuperada ao derrotar um inimigo`},
    {name:"Pacto Sombrio", desc:v=>`+${v}% de dano contra alvos com Vitalidade cheia`}
  ];

  return {
    firstNamesM, firstNamesF, surnames, epithets,
    appearance: { alturas, compleicoes, peles, cabelos, olhos, marcas, roupas },
    archetypes,
    strengths, weaknesses,
    items: {
      categories: itemCategories, coreByCategory: itemCoreByCategory,
      prefixes: itemPrefixes, suffixes: itemSuffixes, appearance: itemAppearance,
      rarityOrder, rarityConfig, passivesPoints, passivesPercent
    }
  };
})();
