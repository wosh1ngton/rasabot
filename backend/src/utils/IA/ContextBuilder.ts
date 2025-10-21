export class ConversationOrchestrator {
  private readonly QUESTOES = [
    {
      id: 1,
      question: `Oi, qual o seu nome?`,
    },
    {
      id: 2,
      question: `Primeiramente, agradeço pelo seu interesse 🙂 
      Para direcionar melhor como posso te ajudar e te explicar como funciona meu trabalho, você poderia me falar um pouco do que deseja tratar?`,
    },
    {
      id: 3,
      question: `Trabalho com Terapia Focada nas Emoções (EFT, da sigla em inglês), um modelo de psicoterapia desenvolvido no Canadá e validado cientificamente em vários lugares do mundo, inclusive no Brasil.
      Nas sessões, meu foco é conectar você com suas emoções, entender melhor seus pensamentos e comportamentos. Além de tratar as situações do presente, ao longo da terapia, acessamos conteúdos que podem ter ficado "travados" ou mal resolvido no passado e por isso possam estar causando problemas atuais ou impedindo seu pleno crescimento ou satisfação hoje.
      """NOME""", na primeira consulta, avaliamos sua necessidade de tratamento e definimos a frequência de sessões que teremos. Para a maioria das pessoas, a frequência semanal é bastante adequada. Todas os nossos encontros podem ser feitos presencialmente ou à distância (por videochamada), na forma como ficar melhor para você.
      `,
    },
    {
      id: 4,
      question: `o valor da sessão de Psicoterapia Individual é R$ 370,00. Se você optar por pagar em pacotes, concedo descontos a partir de 4 sessões. 
              O pacote com 4 sessões fica em R$ 1.400,00 (nesse pacote cada sessão sai a R$: 350,00)
              `,
    },
    {
      id: 5,
      question:
        `"""NOME""", você prefere que a primeira consulta seja presencial ou online?`,
    },
    {
      id: 6,
      question: `Ótimo, """NOME""". Agora só preciso que me informe seu nome completo e data de nascimento, por favor. Segue o endereço da clínica e a localização: Av. C-255, 370 - St. Nova Suica, Goiânia - GO, 74280-010, Brasil https://maps.google.com/maps/search/J%C3%BAlio%20Manoel/@-16.7163,-49.2744,17z?hl=pt-BR`,
    },
  ];

  public buildConversationContext(conversation: any, message: string, horarios: string[]): string {
    const chatHistory = conversation.messages
      .slice(-10)
      .map((msg: any) => `${msg.sender}: ${msg.content}`)
      .join("\n");      

    return `            
        Contexto da Conversa:
        ${chatHistory}         

        Informações Relevantes:
        - Você é Assistente Virtual de um profissional de psicologia
        - Questões que podem ser utilizadas:
        """${this.QUESTOES.flatMap((question) => question.question)}"""

        Diretrizes de Resposta:
        1. PRIORIZE a última mensagem do usuário acima de tudo
        2. Não invente informações
        3. Responda de forma NATURAL, como em uma conversa real
        4. Procure introduzir apenas UMA pergunta por resposta
        5. Substitua """NOME""" pelo nome do paciente quando disponível
        6. Mantenha respostas curtas (2-3 frases no máximo)                        
        7. Encerre naturalmente após confirmar agendamento        
        
        Regras de Agendamento:
        - Só aceite horários dentro dos horários disponíveis: ${horarios}
        - Confirme data, horário e modalidade (presencial/online)
        - Não invente informações        
        - Quando obtiver os parâmetros necessários, chame a função 'criarAgendamento'
        `;
  } 

  
}
